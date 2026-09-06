import { performance } from "node:perf_hooks";

/**
 * Samples how late a short timer actually fires. The extension host runs single
 * threaded, so when another extension blocks it these callbacks are delayed and
 * the recorded lag climbs. High lag means the wait was host contention, not the CLI.
 */
export class EventLoopLagProbe {
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
