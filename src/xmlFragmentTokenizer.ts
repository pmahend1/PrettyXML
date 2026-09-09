import { XmlFragmentToken } from "./xmlFragmentToken";
import { XmlFragmentTokenKind } from "./xmlFragmentTokenKind";

/*
 * Splits a selection into tokens in one left-to-right pass, with no backtracking and no regex over
 * the input as a whole. It replaces the mega-regex the range formatter used to scan with, and it
 * exists to settle two questions that regex answered wrongly:
 *
 * - A tag ends at the first `>` that is *outside* a quoted attribute value. `<a b="x>y">` is one
 *   token here; the old `<\/?[^>]+?>` alternative stopped at the `>` inside the value and shredded
 *   the tag into three pieces.
 * - Self-closing is decided once, by the token's kind. The old scanner asked `endsWith('/>')` in
 *   one place and `/\/\s*>$/` in another, so `<a /  >` rendered self-closed while still opening a
 *   depth and pushed every following line one level too deep.
 *
 * Token text is never rewritten, so concatenating the stream reproduces the input exactly. That is
 * rule 1 of the incomplete-tree spec, and it is what lets the tokenizer be checked by property test
 * rather than only by example.
 */
export class XmlFragmentTokenizer {

    private static readonly selfClosingSuffixRegex = /\/\s*>$/su;

    public static tokenize(xml: string): XmlFragmentToken[] {
        const tokens: XmlFragmentToken[] = [];
        let textStart = 0;
        let index = 0;

        while (index < xml.length) {
            if (xml[index] !== "<") {
                index++;
                continue;
            }

            const markup = XmlFragmentTokenizer.readMarkup(xml, index);
            XmlFragmentTokenizer.pushText(tokens, xml, textStart, index);
            tokens.push(markup);

            index = markup.offset + markup.text.length;
            textStart = index;
        }

        XmlFragmentTokenizer.pushText(tokens, xml, textStart, xml.length);
        return tokens;
    }

    private static pushText(tokens: XmlFragmentToken[], xml: string, start: number, end: number): void {
        if (end <= start) {
            return;
        }
        tokens.push({ kind: XmlFragmentTokenKind.text, text: xml.slice(start, end), offset: start });
    }

    /** `start` is the index of a `<`. */
    private static readMarkup(xml: string, start: number): XmlFragmentToken {
        if (xml.startsWith("<!--", start)) {
            return XmlFragmentTokenizer.readDelimited(xml, start, "<!--", "-->", XmlFragmentTokenKind.comment);
        }
        if (xml.startsWith("<![CDATA[", start)) {
            return XmlFragmentTokenizer.readDelimited(xml, start, "<![CDATA[", "]]>", XmlFragmentTokenKind.cdata);
        }
        if (xml.startsWith("<?", start)) {
            return XmlFragmentTokenizer.readDelimited(
                xml,
                start,
                "<?",
                "?>",
                XmlFragmentTokenKind.processingInstruction
            );
        }
        if (xml.startsWith("<!", start)) {
            return XmlFragmentTokenizer.readMarkupDeclaration(xml, start);
        }
        return XmlFragmentTokenizer.readElementTag(xml, start);
    }

    /*
     * The terminator is searched for past the opener rather than from `start + 1`, so the shortest
     * legal forms - `<!---->`, `<??>` - are read whole instead of finding their own opener's tail.
     */
    private static readDelimited(
        xml: string,
        start: number,
        opener: string,
        terminator: string,
        kind: XmlFragmentTokenKind
    ): XmlFragmentToken {
        const terminatorIndex = xml.indexOf(terminator, start + opener.length);
        if (terminatorIndex < 0) {
            return XmlFragmentTokenizer.unterminated(xml, start);
        }
        return { kind: kind, text: xml.slice(start, terminatorIndex + terminator.length), offset: start };
    }

    /*
     * A DOCTYPE's internal subset is bracketed and may itself contain `>` - `<!DOCTYPE a [<!ENTITY
     * e "x">]>` - so the scan skips from `[` to its `]` rather than stopping at the first `>`.
     */
    private static readMarkupDeclaration(xml: string, start: number): XmlFragmentToken {
        let index = start + "<!".length;

        while (index < xml.length) {
            const character = xml[index];
            if (character === "[") {
                const subsetEnd = xml.indexOf("]", index + 1);
                if (subsetEnd < 0) {
                    return XmlFragmentTokenizer.unterminated(xml, start);
                }
                index = subsetEnd + 1;
                continue;
            }
            if (character === ">") {
                return {
                    kind: XmlFragmentTokenKind.markupDeclaration,
                    text: xml.slice(start, index + 1),
                    offset: start,
                };
            }
            index++;
        }

        return XmlFragmentTokenizer.unterminated(xml, start);
    }

    /*
     * The quote-aware scan, and the whole reason this class exists. A `>` inside a quoted attribute
     * value is data, not the end of the tag.
     */
    private static readElementTag(xml: string, start: number): XmlFragmentToken {
        const isEndTag = xml.startsWith("</", start);
        let quote = "";

        for (let index = start + 1; index < xml.length; index++) {
            const character = xml[index];

            if (quote !== "") {
                if (character === quote) {
                    quote = "";
                }
                continue;
            }
            if (character === "\"" || character === "'") {
                quote = character;
                continue;
            }
            if (character === ">") {
                const text = xml.slice(start, index + 1);
                return { kind: XmlFragmentTokenizer.readTagKind(text, isEndTag), text: text, offset: start };
            }
        }

        return XmlFragmentTokenizer.unterminated(xml, start);
    }

    private static readTagKind(text: string, isEndTag: boolean): XmlFragmentTokenKind {
        if (isEndTag) {
            return XmlFragmentTokenKind.endTag;
        }
        return XmlFragmentTokenizer.selfClosingSuffixRegex.test(text)
            ? XmlFragmentTokenKind.selfClosingTag
            : XmlFragmentTokenKind.startTag;
    }

    private static unterminated(xml: string, start: number): XmlFragmentToken {
        return { kind: XmlFragmentTokenKind.unterminated, text: xml.slice(start), offset: start };
    }
}
