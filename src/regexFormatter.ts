import { Settings } from "./settings";
import { XmlFragmentToken } from "./xmlFragmentToken";
import { XmlFragmentTokenizer } from "./xmlFragmentTokenizer";
import { XmlFragmentTokenKind } from "./xmlFragmentTokenKind";

export class TextXmlFormatter {

    /*
     * The engine's TryReadInvisibleNonAscii as a single pattern: "invisible" is the Unicode
     * category - the separators (Zs, Zl, Zp), the format characters (Cf) and the controls (Cc) -
     * rather than a hand-kept list of the characters someone has complained about. A combining
     * mark is deliberately absent: it draws the accent its letter is wrong without. The u flag
     * reads a surrogate pair as the one code point it encodes, so U+E0020 is written &#xE0020;
     * and never as two halves no parser puts back together.
     */
    private static readonly invisibleCharacterRegex = /[\p{Zs}\p{Zl}\p{Zp}\p{Cf}\p{Cc}]/gu;

    private settings: Settings;
    constructor(settings: Settings) {
        this.settings = settings;
    }

    public formatXmlPretty(xml: string): string {
        const indentSize = this.settings.indentLength ?? 4;
        const tokens = XmlFragmentTokenizer.tokenize(xml);
        const formatted: string[] = [];

        let indentLevel = Math.floor(TextXmlFormatter.readStartIndent(xml) / indentSize);
        let markupCount = 0;

        for (let index = 0; index < tokens.length; index++) {
            const token = tokens[index];

            switch (token.kind) {
                /*
                 * An unterminated run is the front half of a tag the selection cut through. It is
                 * emitted as the text it currently is; giving it a shape of its own is rule 5,
                 * which belongs to the tree formatter.
                 */
                case XmlFragmentTokenKind.text:
                case XmlFragmentTokenKind.unterminated:
                    this.appendTextRun(
                        formatted,
                        token.text,
                        TextXmlFormatter.textIndentColumn(indentLevel, indentSize, markupCount),
                        index === tokens.length - 1
                    );
                    break;

                case XmlFragmentTokenKind.comment:
                    formatted.push(" ".repeat(indentLevel * indentSize) + this.formatComment(token.text));
                    markupCount++;
                    break;

                case XmlFragmentTokenKind.endTag:
                    indentLevel = Math.max(indentLevel - 1, 0);
                    formatted.push(" ".repeat(indentLevel * indentSize) + token.text);
                    markupCount++;
                    break;

                case XmlFragmentTokenKind.startTag:
                case XmlFragmentTokenKind.selfClosingTag: {
                    const column = indentLevel * indentSize;
                    formatted.push(" ".repeat(column) + this.formatTagWithAttributes(token, column));
                    if (token.kind === XmlFragmentTokenKind.startTag) {
                        indentLevel++;
                    }
                    markupCount++;
                    break;
                }

                case XmlFragmentTokenKind.processingInstruction:
                case XmlFragmentTokenKind.cdata:
                case XmlFragmentTokenKind.markupDeclaration:
                    formatted.push(" ".repeat(indentLevel * indentSize) + token.text);
                    markupCount++;
                    break;
            }
        }

        return formatted.join("\n");
    }

    /*
     * Today's starting depth is guessed from the leading whitespace of the input, which only works
     * when the selection happens to begin with a space. Rule 4 replaces the guess with a base
     * column the provider passes in; that is an observable change and belongs to 8e.
     */
    private static readStartIndent(xml: string): number {
        if (xml.startsWith(" ") === false) {
            return 0;
        }
        const firstTagIndex = xml.indexOf("<");
        return firstTagIndex > 0 ? firstTagIndex : 0;
    }

    /*
     * A text run ahead of the first piece of markup sits one level out: it is content of whatever
     * element encloses the selection, not of anything the selection opened.
     */
    private static textIndentColumn(indentLevel: number, indentSize: number, markupCount: number): number {
        const level = markupCount === 0 && indentLevel > 0 ? indentLevel - 1 : indentLevel;
        return level * indentSize;
    }

    /*
     * Escaping runs before the trim, and that ordering is the whole point of the option: trim()
     * counts NBSP and the rest of Zs as whitespace, so an invisible character at the edge of a text
     * node would be deleted rather than escaped - the #208 data loss. A character reference is not
     * whitespace and survives. The consequence to expect is that a node made only of invisible
     * characters stops being empty while the option is on; the engine does the same.
     */
    private appendTextRun(formatted: string[], rawText: string, indentColumn: number, isTrailing: boolean): void {
        const escaped = this.escapeInvisibleNonAscii(rawText);
        const text = escaped.trim();
        if (text !== "") {
            formatted.push(" ".repeat(indentColumn) + text);
            return;
        }

        // Trailing whitespace is dropped outright - the formatter never ends a selection with EOL.
        if (isTrailing || this.settings.preserveNewLines !== true) {
            return;
        }

        if (escaped.includes("\n") === false && escaped.includes("\r") === false) {
            // Inline whitespace content, e.g. <xsl:text> </xsl:text>.
            formatted.push(" ".repeat(indentColumn) + escaped);
            return;
        }

        // Two newlines are a blank line the author put there on purpose.
        if ((escaped.match(/\n/gu) || []).length >= 2) {
            formatted.push("");
        }
    }

    private formatComment(comment: string): string {
        if (this.settings.wrapCommentTextWithSpaces !== true || this.settings.preserveWhiteSpacesInComment === true) {
            return comment;
        }
        const commentMatch = comment.match(/^<!--\s*(.*?)\s*-->$/su);
        return commentMatch === null ? comment : `<!-- ${commentMatch[1]} -->`;
    }

    private formatTagWithAttributes(token: XmlFragmentToken, baseIndent: number): string {
        const tag = token.text;
        const tagNameMatch = tag.match(/^<([^\s/>]+)/u);
        if (tagNameMatch === null) {
            return tag;
        }
        const tagName = tagNameMatch[1];

        const isSelfClosing = token.kind === XmlFragmentTokenKind.selfClosingTag;
        const spaceBeforeSelfClosing = this.settings.addSpaceBeforeSelfClosingTag !== false ? ' ' : '';
        const selfCloseSuffix = isSelfClosing ? `${spaceBeforeSelfClosing}/>` : '>';

        // Strip opening tag name and closing bracket to get attribute string
        const inner = tag.replace(/^<[^\s/>]+\s*/su, '').replace(/\s*\/?\s*>$/su, '');
        if (!inner.trim()) {
            return `<${tagName}${selfCloseSuffix}`;
        }

        const attrRegex = /([^\s=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/gu;
        const childNodeMatches = [...inner.matchAll(attrRegex)];

        if (childNodeMatches.length === 0) {
            return `<${tagName}${selfCloseSuffix}`;
        }

        // Format individual attributes (normalize quotes if configured)
        const formattedAttrs = childNodeMatches.map(m => {
            const attrName = m[1];
            const attrVal = m[2];
            if (attrVal === undefined) {
                return attrName;
            }
            // Values only - an attribute name is not a place a character reference means anything.
            const escapedVal = this.escapeInvisibleNonAscii(attrVal);
            if (this.settings.useSingleQuotes) {
                if (escapedVal.startsWith('"') && escapedVal.endsWith('"')) {
                    const innerVal = escapedVal.slice(1, -1);
                    if (!innerVal.includes("'")) {
                        return `${attrName}='${innerVal}'`;
                    }
                }
            } else if (this.settings.useSingleQuotes === false) {
                if (escapedVal.startsWith("'") && escapedVal.endsWith("'")) {
                    const innerVal = escapedVal.slice(1, -1);
                    if (!innerVal.includes('"')) {
                        return `${attrName}="${innerVal}"`;
                    }
                }
            }
            const rawAttribute = m[0].trim();
            if (escapedVal === attrVal) {
                return rawAttribute;
            }
            // The value ends the match, so swapping only the tail keeps the spacing around the '='.
            return rawAttribute.slice(0, rawAttribute.length - attrVal.length) + escapedVal;
        });

        if (this.settings.positionAllAttributesOnFirstLine || formattedAttrs.length <= (this.settings.attributesInNewlineThreshold ?? 1)) {
            return `<${tagName} ${formattedAttrs.join(' ')}${selfCloseSuffix}`;
        }

        const alignIndent = baseIndent + `<${tagName} `.length;
        const alignedAttrs: string[] = [];

        alignedAttrs.push(formattedAttrs[0]); // first attribute inline

        for (let i = 1; i < formattedAttrs.length; i++) {
            alignedAttrs.push(' '.repeat(alignIndent) + formattedAttrs[i]);
        }

        return `<${tagName} ${alignedAttrs.join('\n')}${selfCloseSuffix}`;
    }

    /*
     * Rewrites what escapeInvisibleNonAsciiCharacters covers, and only that: code points at or
     * above U+0080 that draw nothing. Tab, LF and CR are invisible too and are left alone - they
     * belong to allowWhiteSpaceUnicodesInAttributeValues, and escaping them here would rewrite the
     * line breaks of every selection. Text and attribute values are the only callers; CDATA and
     * comments resolve no character references, so a reference written into either would replace
     * the character with the six characters that spell its name.
     */
    private escapeInvisibleNonAscii(value: string): string {
        if (this.settings.escapeInvisibleNonAsciiCharacters !== true) {
            return value;
        }

        return value.replace(TextXmlFormatter.invisibleCharacterRegex, character => {
            const codePoint = character.codePointAt(0) ?? 0;
            if (codePoint < 0x80) {
                return character;
            }
            return `&#x${codePoint.toString(16).toUpperCase()};`;
        });
    }
}
