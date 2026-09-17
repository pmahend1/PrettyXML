import { XmlFragmentNode } from "./xmlFragmentNode";
import { XmlFragmentToken } from "./xmlFragmentToken";
import { XmlFragmentTokenKind } from "./xmlFragmentTokenKind";

/*
 * Builds the forest a selection describes. It never throws and never drops a token: an element the
 * selection does not close stays open with a null end tag, and an end tag with nothing open to close
 * becomes a node of its own at the top level.
 *
 * An end tag closes the innermost open element whatever its name. That is what the flat scanner did
 * and 8c is output-identical to it; closing by name is rule 2 of the incomplete-tree spec and belongs
 * to 8e, where it changes output on purpose.
 */
export class XmlFragmentParser {

    public static parse(tokens: readonly XmlFragmentToken[]): XmlFragmentNode[] {
        const roots: XmlFragmentNode[] = [];
        const openElements: XmlFragmentNode[] = [];

        for (const token of tokens) {
            const parent = openElements.at(-1);
            const siblings = parent === undefined ? roots : parent.children;

            if (token.kind === XmlFragmentTokenKind.endTag && parent !== undefined) {
                parent.endTag = token;
                openElements.pop();
                continue;
            }

            const node: XmlFragmentNode = { token: token, children: [], endTag: null };
            siblings.push(node);
            if (token.kind === XmlFragmentTokenKind.startTag) {
                openElements.push(node);
            }
        }

        return roots;
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
