import { describe, expect, it } from "vitest";
import { rangeCorpus } from "./support/rangeCorpus";
import { XmlFragmentNode } from "../xmlFragmentNode";
import { XmlFragmentParser } from "../xmlFragmentParser";
import { XmlFragmentTokenizer } from "../xmlFragmentTokenizer";

function parse(xml: string): XmlFragmentNode[] {
    return XmlFragmentParser.parse(XmlFragmentTokenizer.tokenize(xml));
}

// The tree as nested text, so a test reads as the shape it asserts.
function shape(nodes: XmlFragmentNode[]): unknown[] {
    return nodes.map(node => {
        if (node.children.length === 0 && node.endTag === null) {
            return node.token.text;
        }
        return [node.token.text, shape(node.children), node.endTag?.text ?? null];
    });
}

describe("XmlFragmentParser - the tree a balanced selection builds", () => {
    it("nests content inside the element that encloses it", () => {
        expect(shape(parse("<a><b>t</b><c/></a>"))).toEqual([
            ["<a>", [["<b>", ["t"], "</b>"], "<c/>"], "</a>"],
        ]);
    });

    it("keeps an empty element distinct from a self-closing one", () => {
        expect(shape(parse("<a></a><b/>"))).toEqual([["<a>", [], "</a>"], "<b/>"]);
    });

    it("keeps siblings, text and non-element markup in order", () => {
        expect(shape(parse("<?pi?>x<!-- c --><a/>y"))).toEqual(["<?pi?>", "x", "<!-- c -->", "<a/>", "y"]);
    });

    it("builds nothing for an empty selection", () => {
        expect(parse("")).toEqual([]);
    });
});

// The parser never throws and never drops a token, and it closes by name - rule 2.
describe("XmlFragmentParser - an incomplete selection", () => {
    it("leaves an element the selection does not close open", () => {
        expect(shape(parse("<a><b>text"))).toEqual([["<a>", [["<b>", ["text"], null]], null]]);
    });

    it("keeps an end tag with nothing open as a node of its own", () => {
        expect(shape(parse("</b></a><c/>"))).toEqual(["</b>", "</a>", "<c/>"]);
    });

    it("closes the element the end tag names, leaving what was open inside it open", () => {
        expect(shape(parse("<a><b></a>x"))).toEqual([["<a>", ["<b>"], "</a>"], "x"]);
    });

    it("closes the innermost element of that name", () => {
        expect(shape(parse("<a><a></a></a>"))).toEqual([["<a>", [["<a>", [], "</a>"]], "</a>"]]);
    });

    it("keeps an end tag naming nothing open where it stands", () => {
        expect(shape(parse("<a><b></z>x"))).toEqual([["<a>", [["<b>", ["</z>", "x"], null]], null]]);
    });

    it("keeps a run the selection cut mid-tag inside the element it was in", () => {
        expect(shape(parse("<a><b attr=\"v"))).toEqual([["<a>", ["<b attr=\"v"], null]]);
    });
});

/*
 * Rule 1 one layer up from the tokenizer: flattening the tree gives back the very token stream it
 * was built from, so the tree can reorder nothing and lose nothing.
 */
describe("XmlFragmentParser - the tree holds every token in order (rule 1)", () => {
    const inputs = [
        ...rangeCorpus.map(entry => entry.fragment),
        "",
        "</z>",
        "</b></a>",
        "<a><b>unclosed",
        "<a><b></a></b></c>",
        "text<a/>more<b>tail",
        "<a><b attr=\"v",
    ];

    it("flattens a tree nested far deeper than the call stack reaches", () => {
        const depth = 100000;
        const tokens = XmlFragmentTokenizer.tokenize("<a>".repeat(depth) + "x" + "</a>".repeat(depth));
        const flattened = XmlFragmentParser.flatten(XmlFragmentParser.parse(tokens));
        expect(flattened).toHaveLength(tokens.length);
        expect(flattened.at(-1)).toBe(tokens.at(-1));
    });

    it.each(inputs)("flattens %j back into its token stream", input => {
        const tokens = XmlFragmentTokenizer.tokenize(input);
        const flattened = XmlFragmentParser.flatten(XmlFragmentParser.parse(tokens));
        expect(flattened).toHaveLength(tokens.length);
        flattened.forEach((token, index) => expect(token).toBe(tokens[index]));
    });
});
