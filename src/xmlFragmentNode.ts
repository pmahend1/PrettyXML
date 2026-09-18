import { XmlFragmentToken } from "./xmlFragmentToken";

/*
 * One node of the tree a selection parses into. What the node is follows from its token's kind: a
 * start tag is an element, an end tag here is one that closed nothing inside the selection, and
 * every other kind is a leaf. Keeping the token rather than a copy of its text is what lets the
 * tree be flattened back into the exact stream it was built from.
 */
export interface XmlFragmentNode {
    token: XmlFragmentToken;

    /** An element's content, in order. Always empty for anything that is not an element. */
    children: XmlFragmentNode[];

    /** The end tag that closed an element, or null when the selection ended first or the node is not an element. */
    endTag: XmlFragmentToken | null;
}
