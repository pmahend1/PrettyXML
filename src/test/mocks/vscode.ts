/*
 * The extension host supplies `vscode` at runtime, so the module does not exist under
 * vitest. `vitest.config.mts` aliases it here, stubbing only the surface Logger touches:
 * an output channel whose lines the tests can read back through `appendedLines`.
 */

export const appendedLines: string[] = [];

export function clearAppendedLines(): void {
    appendedLines.length = 0;
}

export const window = {
    createOutputChannel: (name: string) => ({
        name: name,
        appendLine: (value: string) => {
            appendedLines.push(value);
        },
        append: (value: string) => {
            appendedLines.push(value);
        },
        show: () => { },
        dispose: () => { }
    })
};

export class Position {
    public readonly line: number;
    public readonly character: number;

    constructor(line: number, character: number) {
        this.line = line;
        this.character = character;
    }
}

export class Range {
    public readonly start: Position;
    public readonly end: Position;

    constructor(start: Position, end: Position) {
        this.start = start;
        this.end = end;
    }

    public with(start: Position = this.start, end: Position = this.end): Range {
        return new Range(start, end);
    }
}

export class TextEdit {
    public readonly range: Range;
    public readonly newText: string;

    private constructor(range: Range, newText: string) {
        this.range = range;
        this.newText = newText;
    }

    public static replace(range: Range, newText: string): TextEdit {
        return new TextEdit(range, newText);
    }
}
