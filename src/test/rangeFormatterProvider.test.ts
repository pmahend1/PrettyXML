import { describe, expect, it } from "vitest";
import type { CancellationToken, FormattingOptions, Range as VsRange, TextDocument } from "vscode";
import { Position, Range, TextEdit } from "./mocks/vscode";
import { FakeTextDocument } from "./support/fakeTextDocument";
import { RangeFormatterProvider } from "../rangeFormatterProvider";
import { defaultSettings, ISettings } from "../settings";

const options = {} as FormattingOptions;
const tabEditor = { insertSpaces: false, tabSize: 4 } as FormattingOptions;
const spaceEditor = { insertSpaces: true, tabSize: 8 } as FormattingOptions;
const cancellation = {} as CancellationToken;

function provider(overrides: Partial<ISettings> = {}): RangeFormatterProvider {
    return new RangeFormatterProvider({ ...defaultSettings, ...overrides });
}

function formatRange(document: FakeTextDocument, range: Range, overrides: Partial<ISettings> = {}, editor: FormattingOptions = options): TextEdit {
    const result = provider(overrides).provideDocumentRangeFormattingEdits(
        document as unknown as TextDocument,
        range as unknown as VsRange,
        editor,
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

describe("RangeFormatterProvider - the editor's own indentation", () => {
    it("indents with tabs when the editor inserts tabs", () => {
        const document = new FakeTextDocument("<r>\n\t<a><b/></a>\n</r>");
        const edit = formatRange(document, range(1, 1, 1, 12), {}, tabEditor);

        expect(edit.newText).toBe("\t<a>\n\t\t<b />\n\t</a>");
    });

    it("keeps the tab-indented first line at the width it had", () => {
        const document = new FakeTextDocument("<r>\n\t\t<a><b/></a>\n</r>");
        const edit = formatRange(document, range(1, 2, 1, 13), {}, tabEditor);

        expect(edit.range.start.character).toBe(0);
        expect(edit.newText).toBe("\t\t<a>\n\t\t\t<b />\n\t\t</a>");
    });

    it("re-formats its own tab-indented output to the same text", () => {
        const document = new FakeTextDocument("<r>\n\t<a><b>t</b><c/></a>\n</r>");
        const once = formatRange(document, range(1, 1, 1, 21), {}, tabEditor).newText;
        const again = formatRange(new FakeTextDocument("<r>\n" + once + "\n</r>"), range(1, 1, 4, 5), {}, tabEditor);

        expect(again.newText).toBe(once);
    });

    // The continuation lines carry the element's tabs and then spaces to the first attribute.
    it("aligns a wrapped attribute list with spaces under a tab indent", () => {
        const document = new FakeTextDocument("<r>\n\t<a b=\"1\" c=\"2\"/>\n</r>");
        const edit = formatRange(document, range(1, 1, 1, 18), {}, tabEditor);

        expect(edit.newText).toBe("\t<a b=\"1\"\n\t   c=\"2\" />");
    });

    it("re-formats its own tab-indented wrapped attribute list to the same text", () => {
        const document = new FakeTextDocument("<r>\n\t<a b=\"1\" c=\"2\"/>\n</r>");
        const once = formatRange(document, range(1, 1, 1, 18), {}, tabEditor).newText;
        const again = formatRange(new FakeTextDocument("<r>\n" + once + "\n</r>"), range(1, 1, 2, 12), {}, tabEditor);

        expect(again.newText).toBe(once);
    });

    it("indents with spaces when the editor inserts spaces", () => {
        const document = new FakeTextDocument("<r>\n    <a><b/></a>\n</r>");
        const edit = formatRange(document, range(1, 4, 1, 15), {}, spaceEditor);

        expect(edit.newText).toBe("    <a>\n        <b />\n    </a>");
    });

    it("re-formats its own space-indented output to the same text", () => {
        const document = new FakeTextDocument("<r>\n    <a><b>t</b><c/></a>\n</r>");
        const once = formatRange(document, range(1, 4, 1, 24), {}, spaceEditor).newText;
        const again = formatRange(new FakeTextDocument("<r>\n" + once + "\n</r>"), range(1, 4, 4, 8), {}, spaceEditor);

        expect(again.newText).toBe(once);
    });

    /*
     * indentLength is the width Format Document sends to the engine, so a selection keeps it
     * rather than taking the editor's tabSize - the two paths would otherwise disagree inside one
     * document. insertSpaces has no counterpart in the settings, so it decides the character alone.
     */
    it("takes the indent width from indentLength and not from tabSize", () => {
        const document = new FakeTextDocument("<r>\n  <a><b/></a>\n</r>");
        const edit = formatRange(document, range(1, 2, 1, 13), { indentLength: 2 }, spaceEditor);

        expect(edit.newText).toBe("  <a>\n    <b />\n  </a>");
    });

    it("ignores indentLength when the editor inserts tabs", () => {
        const document = new FakeTextDocument("<r>\n\t<a><b/></a>\n</r>");
        const edit = formatRange(document, range(1, 1, 1, 12), { indentLength: 8 }, tabEditor);

        expect(edit.newText).toBe("\t<a>\n\t\t<b />\n\t</a>");
    });

    it("formats each of several ranges with the editor's indentation", () => {
        const document = new FakeTextDocument("<r>\n\t<a><b/></a>\n\t\t<c><d/></c>\n</r>");
        const result = provider().provideDocumentRangesFormattingEdits?.(
            document as unknown as TextDocument,
            [range(1, 1, 1, 12), range(2, 2, 2, 13)] as unknown as VsRange[],
            tabEditor,
            cancellation
        ) as TextEdit[];

        expect(result.map(edit => edit.newText)).toEqual([
            "\t<a>\n\t\t<b />\n\t</a>",
            "\t\t<c>\n\t\t\t<d />\n\t\t</c>",
        ]);
    });
});
