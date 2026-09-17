import { Settings } from "./settings";
import { XmlFragmentNode } from "./xmlFragmentNode";
import { XmlFragmentToken } from "./xmlFragmentToken";
import { XmlFragmentTokenKind } from "./xmlFragmentTokenKind";

/*
 * Writes a parsed selection back out, one piece of markup per line. Every element's content sits
 * one level deeper than its tags, and the only depth that is not carried by the tree is the one the
 * selection starts at - which an end tag that closed nothing inside the selection steps back out of.
 */
export class XmlFragmentRenderer {

    /*
     * The engine's TryReadInvisibleNonAscii as a single pattern: "invisible" is the Unicode
     * category - the separators (Zs, Zl, Zp), the format characters (Cf) and the controls (Cc) -
     * rather than a hand-kept list of the characters someone has complained about. A combining
     * mark is deliberately absent: it draws the accent its letter is wrong without. The u flag
     * reads a surrogate pair as the one code point it encodes, so U+E0020 is written &#xE0020;
     * and never as two halves no parser puts back together.
     */
    private static readonly invisibleCharacterRegex = /[\p{Zs}\p{Zl}\p{Zp}\p{Cf}\p{Cc}]/gu;

    // Name, then everything between the name and the closing bracket, less a self-closing slash.
    private static readonly tagPartsRegex = /^<([^\s/>]+)\s*(.*?)\s*\/?\s*>$/su;

    private static readonly attributeRegex = /([^\s=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/gu;

    private readonly settings: Settings;
    private readonly indentSize: number;
    private readonly indentations: string[] = [];

    constructor(settings: Settings) {
        this.settings = settings;
        this.indentSize = settings.indentLength ?? 4;
    }

    public render(nodes: readonly XmlFragmentNode[], startLevel: number): string {
        const lines: string[] = [];
        const trailingToken = XmlFragmentRenderer.findLastToken(nodes);
        let level = startLevel;
        let isLeading = true;

        for (const node of nodes) {
            if (node.token.kind === XmlFragmentTokenKind.endTag) {
                level = Math.max(level - 1, 0);
                lines.push(this.indentation(level * this.indentSize) + node.token.text);
            } else {
                this.renderNode(lines, node, level, isLeading, trailingToken);
            }

            if (XmlFragmentRenderer.isTextRun(node.token) === false) {
                isLeading = false;
            }
        }

        return lines.join("\n");
    }

    /*
     * `isLeading` marks a text run ahead of the selection's first piece of markup. It sits one level
     * out: it is content of whatever element encloses the selection, not of anything the selection
     * opened.
     */
    private renderNode(
        lines: string[],
        node: XmlFragmentNode,
        level: number,
        isLeading: boolean,
        trailingToken: XmlFragmentToken | undefined
    ): void {
        const token = node.token;
        const column = level * this.indentSize;

        switch (token.kind) {
            /*
             * An unterminated run is the front half of a tag the selection cut through. It is
             * emitted as the text it currently is; giving it a shape of its own is rule 5, which
             * belongs to 8e.
             */
            case XmlFragmentTokenKind.text:
            case XmlFragmentTokenKind.unterminated: {
                const textLevel = isLeading && level > 0 ? level - 1 : level;
                this.appendTextRun(lines, token.text, textLevel * this.indentSize, token === trailingToken);
                break;
            }

            case XmlFragmentTokenKind.comment:
                lines.push(this.indentation(column) + this.formatComment(token.text));
                break;

            case XmlFragmentTokenKind.startTag:
                lines.push(this.indentation(column) + this.formatTag(token, column));
                for (const child of node.children) {
                    this.renderNode(lines, child, level + 1, false, trailingToken);
                }
                if (node.endTag !== null) {
                    lines.push(this.indentation(column) + node.endTag.text);
                }
                break;

            case XmlFragmentTokenKind.selfClosingTag:
                lines.push(this.indentation(column) + this.formatTag(token, column));
                break;

            // The parser only leaves an end tag unmatched at the top level, where render() handles it.
            case XmlFragmentTokenKind.endTag:
            case XmlFragmentTokenKind.processingInstruction:
            case XmlFragmentTokenKind.cdata:
            case XmlFragmentTokenKind.markupDeclaration:
                lines.push(this.indentation(column) + token.text);
                break;
        }
    }

    private static isTextRun(token: XmlFragmentToken): boolean {
        return token.kind === XmlFragmentTokenKind.text || token.kind === XmlFragmentTokenKind.unterminated;
    }

    /** The last token of the selection in document order - the one whose whitespace is never kept. */
    private static findLastToken(nodes: readonly XmlFragmentNode[]): XmlFragmentToken | undefined {
        const last = nodes.at(-1);
        if (last === undefined) {
            return undefined;
        }
        if (last.endTag !== null) {
            return last.endTag;
        }
        return XmlFragmentRenderer.findLastToken(last.children) ?? last.token;
    }

    private indentation(column: number): string {
        let indentation = this.indentations[column];
        if (indentation === undefined) {
            indentation = " ".repeat(column);
            this.indentations[column] = indentation;
        }
        return indentation;
    }

    /*
     * Escaping runs before the trim, and that ordering is the whole point of the option: trim()
     * counts NBSP and the rest of Zs as whitespace, so an invisible character at the edge of a text
     * node would be deleted rather than escaped - the #208 data loss. A character reference is not
     * whitespace and survives. The consequence to expect is that a node made only of invisible
     * characters stops being empty while the option is on; the engine does the same.
     */
    private appendTextRun(lines: string[], rawText: string, column: number, isTrailing: boolean): void {
        const escaped = this.escapeInvisibleNonAscii(rawText);
        const text = escaped.trim();
        if (text !== "") {
            lines.push(this.indentation(column) + text);
            return;
        }

        // Trailing whitespace is dropped outright - the formatter never ends a selection with EOL.
        if (isTrailing || this.settings.preserveNewLines !== true) {
            return;
        }

        if (escaped.includes("\n") === false && escaped.includes("\r") === false) {
            // Inline whitespace content, e.g. <xsl:text> </xsl:text>.
            lines.push(this.indentation(column) + escaped);
            return;
        }

        if (XmlFragmentRenderer.containsBlankLine(escaped)) {
            lines.push("");
        }
    }

    // Two newlines are a blank line the author put there on purpose.
    private static containsBlankLine(whitespace: string): boolean {
        const firstNewline = whitespace.indexOf("\n");
        return firstNewline >= 0 && whitespace.includes("\n", firstNewline + 1);
    }

    private formatComment(comment: string): string {
        if (this.settings.wrapCommentTextWithSpaces !== true || this.settings.preserveWhiteSpacesInComment === true) {
            return comment;
        }
        const commentMatch = comment.match(/^<!--\s*(.*?)\s*-->$/su);
        return commentMatch === null ? comment : `<!-- ${commentMatch[1]} -->`;
    }

    private formatTag(token: XmlFragmentToken, column: number): string {
        const tagParts = token.text.match(XmlFragmentRenderer.tagPartsRegex);
        if (tagParts === null) {
            return token.text;
        }
        const [, tagName, attributeText] = tagParts;

        const spaceBeforeSelfClosing = this.settings.addSpaceBeforeSelfClosingTag !== false ? " " : "";
        const closingBracket = token.kind === XmlFragmentTokenKind.selfClosingTag ? `${spaceBeforeSelfClosing}/>` : ">";

        const attributes: string[] = [];
        for (const match of attributeText.matchAll(XmlFragmentRenderer.attributeRegex)) {
            attributes.push(this.formatAttribute(match));
        }
        if (attributes.length === 0) {
            return `<${tagName}${closingBracket}`;
        }

        const fitsOnOneLine = this.settings.positionAllAttributesOnFirstLine === true
            || attributes.length <= (this.settings.attributesInNewlineThreshold ?? 1);
        if (fitsOnOneLine) {
            return `<${tagName} ${attributes.join(" ")}${closingBracket}`;
        }

        // The first attribute stays on the tag's line and the rest line up under it.
        const alignment = "\n" + this.indentation(column + `<${tagName} `.length);
        return `<${tagName} ${attributes.join(alignment)}${closingBracket}`;
    }

    private formatAttribute(match: RegExpMatchArray): string {
        const [rawMatch, name, value] = match;
        if (value === undefined) {
            return name;
        }

        // Values only - an attribute name is not a place a character reference means anything.
        const escapedValue = this.escapeInvisibleNonAscii(value);
        const requoted = this.requote(escapedValue);
        if (requoted !== null) {
            return `${name}=${requoted}`;
        }

        const rawAttribute = rawMatch.trim();
        if (escapedValue === value) {
            return rawAttribute;
        }
        // The value ends the match, so swapping only the tail keeps the spacing around the '='.
        return rawAttribute.slice(0, rawAttribute.length - value.length) + escapedValue;
    }

    /** The value in the configured quote style, or null when it is left as written. */
    private requote(value: string): string | null {
        const [from, to] = this.settings.useSingleQuotes === true ? ["\"", "'"] : ["'", "\""];
        if (this.settings.useSingleQuotes === undefined || value.startsWith(from) === false || value.endsWith(from) === false) {
            return null;
        }

        const unquoted = value.slice(1, -1);
        return unquoted.includes(to) ? null : `${to}${unquoted}${to}`;
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

        return value.replace(XmlFragmentRenderer.invisibleCharacterRegex, character => {
            const codePoint = character.codePointAt(0) ?? 0;
            if (codePoint < 0x80) {
                return character;
            }
            return `&#x${codePoint.toString(16).toUpperCase()};`;
        });
    }
}
