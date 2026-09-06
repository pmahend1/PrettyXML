import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerfTrace } from '../perf/perfTrace';
import { EventLoopLagProbe } from '../perf/eventLoopLagProbe';
import { Logger } from '../logger/logger';
import { appendedLines, clearAppendedLines } from './mocks/vscode';

/*
 * These exist for two reasons, neither of which is the timing numbers - those are
 * wall-clock and not worth asserting on.
 *
 * The first is that importing this module at all is the guard the suite was missing:
 * `perf.ts` once split into two files where the probe was neither exported nor
 * imported, which made it a global script instead of a module. That compiled, linted
 * and bundled clean, and would only have thrown at runtime. Any test that imports
 * PerfTrace fails loudly on that class of break.
 *
 * The second is the gating. Tracing costs a repeating 20 ms timer on the extension
 * host thread, so it must never start for users who have not turned logs on.
 */

function findPerfLine(): string | undefined {
    return appendedLines.find(line => line.includes('PERF'));
}

describe('PerfTrace — gating on enableLogs', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        clearAppendedLines();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns no trace when logging is disabled', () => {
        Logger.instance.setIsEnabled(false);

        expect(PerfTrace.start('cli.format')).toBeUndefined();
    });

    it('schedules no timer when logging is disabled', () => {
        Logger.instance.setIsEnabled(false);
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

        PerfTrace.start('cli.format');

        expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('writes nothing when a disabled trigger is noted', () => {
        Logger.instance.setIsEnabled(false);

        PerfTrace.noteFormatTrigger('file:///disabled.xml', 'provider');
        PerfTrace.noteFormatTrigger('file:///disabled.xml', 'onWillSave');

        expect(appendedLines).toHaveLength(0);
    });

    it('returns a trace when logging is enabled', () => {
        Logger.instance.setIsEnabled(true);

        const trace = PerfTrace.start('cli.format');
        trace?.end();

        expect(trace).toBeDefined();
    });
});

describe('PerfTrace — the summary line', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        clearAppendedLines();
        Logger.instance.setIsEnabled(true);
    });

    afterEach(() => {
        Logger.instance.setIsEnabled(false);
        vi.useRealTimers();
    });

    it('emits one line carrying the label, every phase and the host lag', () => {
        const trace = PerfTrace.start('cli.format');
        trace?.mark('spawn');
        trace?.mark('drain');
        trace?.end('exit=0');

        const line = findPerfLine();
        expect(line).toBeDefined();
        expect(line).toContain('cli.format');
        expect(line).toContain('spawn=');
        expect(line).toContain('drain=');
        expect(line).toContain('hostLag(');
        expect(line).toContain('exit=0');
    });

    it('emits nothing further when end is called twice', () => {
        const trace = PerfTrace.start('cli.format');
        trace?.end('first');
        const afterFirstEnd = appendedLines.length;

        trace?.end('second');

        expect(appendedLines).toHaveLength(afterFirstEnd);
        expect(findPerfLine()).not.toContain('second');
    });
});

describe('PerfTrace — duplicate format detection', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        clearAppendedLines();
        Logger.instance.setIsEnabled(true);
    });

    afterEach(() => {
        Logger.instance.setIsEnabled(false);
        vi.useRealTimers();
    });

    it('warns when one document is formatted twice inside the window', () => {
        PerfTrace.noteFormatTrigger('file:///duplicate.xml', 'provider');
        PerfTrace.noteFormatTrigger('file:///duplicate.xml', 'onWillSave');

        const line = findPerfLine();
        expect(line).toContain('DUPLICATE FORMAT');
        expect(line).toContain('onWillSave');
        expect(line).toContain('provider');
    });

    it('stays quiet for a single format of one document', () => {
        PerfTrace.noteFormatTrigger('file:///single.xml', 'provider');

        expect(findPerfLine()).toBeUndefined();
    });

    it('stays quiet when two different documents are formatted', () => {
        PerfTrace.noteFormatTrigger('file:///first.xml', 'provider');
        PerfTrace.noteFormatTrigger('file:///second.xml', 'provider');

        expect(findPerfLine()).toBeUndefined();
    });
});

describe('EventLoopLagProbe', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('reports zeroed lag when stopped before any sample fires', () => {
        vi.useFakeTimers();
        const probe = new EventLoopLagProbe();

        probe.start();
        const lag = probe.stop();

        expect(lag.maxLagMs).toBe(0);
        expect(lag.avgLagMs).toBe(0);
    });

    it('stops its timer, so no sample runs after stop', () => {
        vi.useFakeTimers();
        const probe = new EventLoopLagProbe();
        probe.start();

        probe.stop();

        expect(vi.getTimerCount()).toBe(0);
    });
});
