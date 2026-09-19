import { describe, expect, it } from "vitest";
import { rangeCorpus } from "./support/rangeCorpus";
import { XmlFragmentToken } from "../xmlFragmentToken";
import { XmlFragmentTokenizer } from "../xmlFragmentTokenizer";
import { XmlFragmentTokenKind } from "../xmlFragmentTokenKind";

function kinds(xml: string): XmlFragmentTokenKind[] {
    return XmlFragmentTokenizer.tokenize(xml).map(token => token.kind);
}

function texts(xml: string): string[] {
    return XmlFragmentTokenizer.tokenize(xml).map(token => token.text);
}

function only(xml: string): XmlFragmentToken {
    const tokens = XmlFragmentTokenizer.tokenize(xml);
    expect(tokens).toHaveLength(1);
    return tokens[0];
}

describe("XmlFragmentTokenizer - the token kinds", () => {
    it("reads a start tag, its text and its end tag", () => {
        expect(kinds("<a>hi</a>")).toEqual([
            XmlFragmentTokenKind.startTag,
            XmlFragmentTokenKind.text,
            XmlFragmentTokenKind.endTag,
        ]);
    });

    it.each([
        ["<!-- c -->", XmlFragmentTokenKind.comment],
        ["<![CDATA[raw <stuff> here]]>", XmlFragmentTokenKind.cdata],
        ["<?xml version=\"1.0\"?>", XmlFragmentTokenKind.processingInstruction],
        ["<?pi data?>", XmlFragmentTokenKind.processingInstruction],
        ["<!DOCTYPE a>", XmlFragmentTokenKind.markupDeclaration],
        ["<a/>", XmlFragmentTokenKind.selfClosingTag],
        ["<a>", XmlFragmentTokenKind.startTag],
        ["</a>", XmlFragmentTokenKind.endTag],
        ["just text", XmlFragmentTokenKind.text],
    ])("reads %s as one %s token", (xml, kind) => {
        expect(only(xml)).toEqual({ kind: kind, text: xml, offset: 0 });
    });

    it("reads the shortest legal comment and processing instruction whole", () => {
        expect(only("<!---->").kind).toBe(XmlFragmentTokenKind.comment);
        expect(only("<??>").kind).toBe(XmlFragmentTokenKind.processingInstruction);
    });

    /*
     * The internal subset is bracketed and may contain `>` of its own, so the scan skips from `[`
     * to its `]` rather than stopping at the first `>` it meets.
     */
    it("reads a DOCTYPE whose internal subset contains a greater-than sign", () => {
        const doctype = "<!DOCTYPE a [<!ENTITY e \"x\">]>";
        expect(only(doctype).kind).toBe(XmlFragmentTokenKind.markupDeclaration);
    });

    it("records the offset each token starts at", () => {
        expect(XmlFragmentTokenizer.tokenize("<a>hi</a>")).toEqual([
            { kind: XmlFragmentTokenKind.startTag, text: "<a>", offset: 0 },
            { kind: XmlFragmentTokenKind.text, text: "hi", offset: 3 },
            { kind: XmlFragmentTokenKind.endTag, text: "</a>", offset: 5 },
        ]);
    });

    it("emits nothing for an empty selection", () => {
        expect(XmlFragmentTokenizer.tokenize("")).toEqual([]);
    });
});

/*
 * The first of the two bugs 8b exists to fix. The old `<\/?[^>]+?>` alternative stopped at the
 * first `>` whether or not it was inside a quoted value, which shredded the tag into three pieces
 * and destroyed the document.
 */
describe("XmlFragmentTokenizer - a greater-than sign inside an attribute value", () => {
    it("keeps a double-quoted value that contains one inside its tag", () => {
        expect(texts("<a b=\"x>y\"><c/></a>")).toEqual(["<a b=\"x>y\">", "<c/>", "</a>"]);
    });

    it("keeps a single-quoted value that contains one inside its tag", () => {
        expect(texts("<a b='x>y'/>")).toEqual(["<a b='x>y'/>"]);
    });

    it("does not treat a quote inside the other quote style as opening a value", () => {
        expect(texts("<a b=\"it's\" c='say \"hi\"'>")).toEqual(["<a b=\"it's\" c='say \"hi\"'>"]);
    });

    it("does not let a slash inside a value make the tag self-closing", () => {
        expect(only("<a b=\"x/>y\">").kind).toBe(XmlFragmentTokenKind.startTag);
    });
});

/*
 * The second bug. Self-closing used to be decided twice - `endsWith('/>')` in the scanner against
 * `/\/\s*>$/` in the attribute formatter - so `<a /  >` rendered self-closed while still opening a
 * depth, and every line after it in the selection came out one level too deep.
 */
describe("XmlFragmentTokenizer - self-closing is decided once", () => {
    it.each(["<a/>", "<a />", "<a /  >", "<a\n/>", "<a b=\"1\"/>"])("reads %s as self-closing", xml => {
        expect(only(xml).kind).toBe(XmlFragmentTokenKind.selfClosingTag);
    });

    it.each(["<a>", "<a b=\"1\">", "<a b=\"/\">"])("reads %s as a start tag", xml => {
        expect(only(xml).kind).toBe(XmlFragmentTokenKind.startTag);
    });

    it("never calls an end tag self-closing", () => {
        expect(only("</a/>").kind).toBe(XmlFragmentTokenKind.endTag);
    });
});

/*
 * Rule 5's raw material: a selection cut mid-token. The tokenizer reports it rather than guessing a
 * shape for it, and the run always ends the stream - nothing after an unclosed `<` can be scanned.
 */
describe("XmlFragmentTokenizer - a selection cut mid-token", () => {
    it.each([
        "<a b=\"v",
        "<!-- unfinished",
        "<![CDATA[unfinished",
        "<?pi unfinished",
        "<!DOCTYPE unfinished",
        "<!DOCTYPE a [unfinished",
    ])("reports %s as unterminated", xml => {
        expect(only(xml)).toEqual({ kind: XmlFragmentTokenKind.unterminated, text: xml, offset: 0 });
    });

    it("keeps the tokens ahead of the cut and ends the stream at it", () => {
        expect(XmlFragmentTokenizer.tokenize("<a><b attr=\"v")).toEqual([
            { kind: XmlFragmentTokenKind.startTag, text: "<a>", offset: 0 },
            { kind: XmlFragmentTokenKind.unterminated, text: "<b attr=\"v", offset: 3 },
        ]);
    });
});

/*
 * Rule 1 as a property rather than as examples: nothing is invented and nothing is deleted, so the
 * stream is a partition of the input and concatenating it gives the input back. Everything the
 * parser and renderer do in 8c is built on that, and it is cheap to check over every shape the
 * corpus already collects.
 */
describe("XmlFragmentTokenizer - the stream is a partition of the input (rule 1)", () => {
    const inputs = [
        ...rangeCorpus.map(entry => entry.fragment),
        "",
        "   ",
        "<a b=\"x>y\" c='p>q'><!-- > --><![CDATA[>]]>text</a>",
        "1 < 2",
        "<a><b>unclosed",
        "</z>",
        "<!DOCTYPE a [<!ENTITY e \"x\">]><a/>",
        "<a\n  b=\"1\"\n  c=\"2\"\n/>",
        "text<a/>more<b/>tail",
    ];

    it.each(inputs)("rebuilds %j from its tokens", input => {
        const tokens = XmlFragmentTokenizer.tokenize(input);
        expect(tokens.map(token => token.text).join("")).toBe(input);
    });

    it.each(inputs)("gives every token in %j the offset it was cut from", input => {
        let expectedOffset = 0;
        for (const token of XmlFragmentTokenizer.tokenize(input)) {
            expect(token.offset).toBe(expectedOffset);
            expectedOffset += token.text.length;
        }
    });

    it("never emits an empty token", () => {
        for (const input of inputs) {
            for (const token of XmlFragmentTokenizer.tokenize(input)) {
                expect(token.text.length).toBeGreaterThan(0);
            }
        }
    });
});
