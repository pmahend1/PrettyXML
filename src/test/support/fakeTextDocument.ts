import { Position, Range } from "../mocks/vscode";

// Enough of TextDocument for the range formatter: lines, their indentation and the text of a range.
export class FakeTextDocument {
    private readonly lines: string[];

    constructor(text: string) {
        this.lines = text.split("\n");
    }

    public get lineCount(): number {
        return this.lines.length;
    }

    public lineAt(line: number) {
        const text = this.lines[line];
        const firstNonWhitespaceCharacterIndex = text.length - text.trimStart().length;
        return {
            text: text,
            lineNumber: line,
            firstNonWhitespaceCharacterIndex: firstNonWhitespaceCharacterIndex,
            range: new Range(new Position(line, 0), new Position(line, text.length)),
        };
    }

    public getText(range: Range): string {
        if (range.start.line === range.end.line) {
            return this.lines[range.start.line].slice(range.start.character, range.end.character);
        }

        const first = this.lines[range.start.line].slice(range.start.character);
        const middle = this.lines.slice(range.start.line + 1, range.end.line);
        const last = this.lines[range.end.line].slice(0, range.end.character);
        return [first, ...middle, last].join("\n");
    }

    public rangeOfAll(): Range {
        const lastLine = this.lines.length - 1;
        return new Range(new Position(0, 0), new Position(lastLine, this.lines[lastLine].length));
    }
}
