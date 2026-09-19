import { XmlFragmentNode } from "./xmlFragmentNode";
import { XmlFragmentToken } from "./xmlFragmentToken";
import { XmlFragmentTokenKind } from "./xmlFragmentTokenKind";

/*
 * Builds the forest a selection describes. It never throws and never drops a token: an element the
 * selection does not close stays open with a null end tag, and an end tag closes the innermost open
 * element of its own name - rule 2 - or, naming nothing open, becomes a node where it stands.
 */
export class XmlFragmentParser {

    private static readonly tagNameRegex = /^<\/?([^\s/>]+)/u;

    public static parse(tokens: readonly XmlFragmentToken[]): XmlFragmentNode[] {
        const roots: XmlFragmentNode[] = [];
        const openElements: XmlFragmentNode[] = [];

        for (const token of tokens) {
            if (token.kind === XmlFragmentTokenKind.endTag) {
                const closedIndex = XmlFragmentParser.findOpenElement(openElements, token);
                if (closedIndex >= 0) {
                    openElements[closedIndex].endTag = token;
                    openElements.length = closedIndex;
                    continue;
                }
            }

            const parent = openElements.at(-1);
            const node: XmlFragmentNode = { token: token, children: [], endTag: null };
            (parent === undefined ? roots : parent.children).push(node);
            if (token.kind === XmlFragmentTokenKind.startTag) {
                openElements.push(node);
            }
        }

        return roots;
    }

    // The innermost open element the end tag names, or -1 when the selection never opened it.
    private static findOpenElement(openElements: readonly XmlFragmentNode[], endTag: XmlFragmentToken): number {
        const name = XmlFragmentParser.readTagName(endTag);
        for (let index = openElements.length - 1; index >= 0; index--) {
            if (XmlFragmentParser.readTagName(openElements[index].token) === name) {
                return index;
            }
        }
        return -1;
    }

    // XML element names are case-sensitive, so the match is too.
    private static readTagName(tag: XmlFragmentToken): string {
        return tag.text.match(XmlFragmentParser.tagNameRegex)?.[1] ?? "";
    }

    /*
     * The tokens the forest was built from, in their original order. An explicit stack rather than
     * recursion, so depth is bounded by memory and not by the call stack; an end tag goes on as a
     * leaf beneath its element's children, so it comes off after them.
     */
    public static flatten(nodes: readonly XmlFragmentNode[]): XmlFragmentToken[] {
        const tokens: XmlFragmentToken[] = [];
        const pending = [...nodes].reverse();

        for (let node = pending.pop(); node !== undefined; node = pending.pop()) {
            tokens.push(node.token);
            if (node.endTag !== null) {
                pending.push({ token: node.endTag, children: [], endTag: null });
            }
            for (let index = node.children.length - 1; index >= 0; index--) {
                pending.push(node.children[index]);
            }
        }

        return tokens;
    }
}
