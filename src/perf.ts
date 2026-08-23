import { performance } from "node:perf_hooks";
import { Logger } from "./logger";

/**
 * Timing instrumentation used to diagnose reports of slow formatting.
 *
 * Three separate things are captured per format:
 *  - phase deltas, so .NET startup can be told apart from actual formatting work
 *  - extension host event loop lag, which shows whether the host thread was blocked
 *  - duplicate formats of the same document, which catches double-fire configurations
 *
 * Everything goes to the Pretty XML output channel and only appears when
 * `prettyxml.settings.enableLogs` is enabled.
 */

const perfPrefix = "PERF";

/**
 * Samples how late a short timer actually fires. The extension host runs single
 * threaded, so when another extension blocks it these callbacks are delayed and
 * the recorded lag climbs. High lag means the wait was host contention, not the CLI.
 */
class EventLoopLagProbe {
    private static readonly sampleIntervalMs = 20;

    private timer?: NodeJS.Timeout;
    private maxLagMs: number = 0;
    private totalLagMs: number = 0;
    private sampleCount: number = 0;

    public start(): void {
        this.scheduleSample();
    }

    private scheduleSample(): void {
        const scheduledAt = performance.now();
        this.timer = setTimeout(() => {
            const lagMs = performance.now() - scheduledAt - EventLoopLagProbe.sampleIntervalMs;
            if (lagMs > 0) {
                this.maxLagMs = Math.max(this.maxLagMs, lagMs);
                this.totalLagMs += lagMs;
            }
            this.sampleCount++;
            this.scheduleSample();
        }, EventLoopLagProbe.sampleIntervalMs);
    }

    public stop(): { maxLagMs: number, avgLagMs: number } {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        const avgLagMs = this.sampleCount > 0 ? this.totalLagMs / this.sampleCount : 0;
        return { maxLagMs: this.maxLagMs, avgLagMs: avgLagMs };
    }
}

export class PerfTrace {
    private static nextId: number = 1;
    private static readonly lastFormatByDocument = new Map<string, { at: number, trigger: string }>();
    private static readonly duplicateWindowMs = 2000;

    private readonly id: number;
    private readonly label: string;
    private readonly startedAt: number;
    private readonly phases: string[] = [];
    private readonly lagProbe: EventLoopLagProbe = new EventLoopLagProbe();

    private lastMarkAt: number;
    private hasEnded: boolean = false;

    private constructor(label: string) {
        this.id = PerfTrace.nextId++;
        this.label = label;
        this.startedAt = performance.now();
        this.lastMarkAt = this.startedAt;
        this.lagProbe.start();
    }

    /**
     * Returns a trace only when logging is on. Tracing costs a repeating timer on the
     * extension host thread, so it must never run for users who have not asked for logs.
     */
    public static start(label: string): PerfTrace | undefined {
        if (!Logger.instance.isEnabled) {
            return undefined;
        }
        return new PerfTrace(label);
    }

    /**
     * Records that a document is about to be formatted. When the same document is
     * formatted twice inside a short window it means two triggers are both firing,
     * which costs a full extra CLI round trip per save.
     */
    public static noteFormatTrigger(documentKey: string, trigger: string): void {
        if (!Logger.instance.isEnabled) {
            return;
        }
        const now = performance.now();
        PerfTrace.forgetStaleDocuments(now);
        const previous = PerfTrace.lastFormatByDocument.get(documentKey);

        if (previous && (now - previous.at) < PerfTrace.duplicateWindowMs) {
            Logger.instance.warning(
                `${perfPrefix} DUPLICATE FORMAT - '${trigger}' fired ${Math.round(now - previous.at)}ms after '${previous.trigger}' ` +
                `for the same document. Check whether both 'prettyxml.settings.formatOnSave' and 'editor.formatOnSave' are enabled.`);
        }

        PerfTrace.lastFormatByDocument.set(documentKey, { at: now, trigger: trigger });
    }

    /** Keeps the duplicate-detection map from growing across a long session. */
    private static forgetStaleDocuments(now: number): void {
        for (const [key, entry] of PerfTrace.lastFormatByDocument) {
            if ((now - entry.at) >= PerfTrace.duplicateWindowMs) {
                PerfTrace.lastFormatByDocument.delete(key);
            }
        }
    }

    /** Records the time spent since the previous mark. */
    public mark(phase: string): void {
        const now = performance.now();
        this.phases.push(`${phase}=${Math.round(now - this.lastMarkAt)}ms`);
        this.lastMarkAt = now;
    }

    /** Emits the single summary line for this trace. Safe to call more than once. */
    public end(note: string = ""): void {
        if (this.hasEnded) {
            return;
        }
        this.hasEnded = true;

        const totalMs = Math.round(performance.now() - this.startedAt);
        const lag = this.lagProbe.stop();

        const parts = [
            `${perfPrefix} #${this.id} ${this.label} total=${totalMs}ms`,
            this.phases.join(" "),
            `hostLag(max=${Math.round(lag.maxLagMs)}ms avg=${Math.round(lag.avgLagMs)}ms)`,
            note
        ];

        Logger.instance.info(parts.filter(part => part !== "").join(" | "));
    }
}
