import { describe, expect, it } from "vitest";
import type { CancellationToken, FormattingOptions, Range as VsRange, TextDocument } from "vscode";
import { Position, Range, TextEdit } from "./mocks/vscode";
import { FakeTextDocument } from "./support/fakeTextDocument";
import { RangeFormatterProvider } from "../rangeFormatterProvider";
import { defaultSettings, ISettings } from "../settings";

const options = {} as FormattingOptions;
const cancellation = {} as CancellationToken;

function provider(overrides: Partial<ISettings> = {}): RangeFormatterProvider {
    return new RangeFormatterProvider({ ...defaultSettings, ...overrides });
}

function formatRange(document: FakeTextDocument, range: Range, overrides: Partial<ISettings> = {}): TextEdit {
    const result = provider(overrides).provideDocumentRangeFormattingEdits(
        document as unknown as TextDocument,
        range as unknown as VsRange,
        options,
        cancellation
    ) as TextEdit[];
    return result[0];
}

function range(startLine: number, startCharacter: number, endLine: number, endCharacter: number): Range {
    return new Range(new Position(startLine, startCharacter), new Position(endLine, endCharacter));
}

describe("RangeFormatterProvider - the selection's own indentation (rule 4)", () => {
    it("widens a selection preceded only by whitespace so the replacement covers its indentation", () => {
        const document = new FakeTextDocument("<r>\n        <a><b/></a>\n</r>");
        const edit = formatRange(document, range(1, 8, 1, 19));

        expect(edit.range.start.character).toBe(0);
        expect(edit.newText).toBe("        <a>\n            <b />\n        </a>");
    });

    it("indents a selection that already covers its indentation from the same column", () => {
        const document = new FakeTextDocument("<r>\n    <a><b/></a>\n</r>");
        const edit = formatRange(document, range(1, 0, 1, 15));

        expect(edit.newText).toBe("    <a>\n        <b />\n    </a>");
    });

    it("leaves a selection that starts after content on its line where the user drew it", () => {
        const document = new FakeTextDocument("<r>    <a><b/></a>\n</r>");
        const edit = formatRange(document, range(0, 7, 0, 18));

        expect(edit.range.start.character).toBe(7);
        expect(edit.newText).toBe("<a>\n    <b />\n</a>");
    });

    it("formats each of several ranges from its own indentation", () => {
        const document = new FakeTextDocument("<r>\n    <a><b/></a>\n        <c><d/></c>\n</r>");
        const result = provider().provideDocumentRangesFormattingEdits?.(
            document as unknown as TextDocument,
            [range(1, 4, 1, 15), range(2, 8, 2, 19)] as unknown as VsRange[],
            options,
            cancellation
        ) as TextEdit[];

        expect(result.map(edit => edit.newText)).toEqual([
            "    <a>\n        <b />\n    </a>",
            "        <c>\n            <d />\n        </c>",
        ]);
    });

    it("re-formats its own output to the same text", () => {
        const document = new FakeTextDocument("<r>\n    <a><b/></a>\n</r>");
        const once = formatRange(document, range(1, 4, 1, 15)).newText;
        const again = formatRange(new FakeTextDocument("<r>\n" + once + "\n</r>"), range(1, 4, 3, 8));

        expect(again.newText).toBe(once);
    });
});
