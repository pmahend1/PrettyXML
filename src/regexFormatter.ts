import { Settings } from "./settings";

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
        const tagRegex = /(<\?.*?\?>|<!DOCTYPE(?:[^>\[]|\[[^\]]*\])*>|<!\[CDATA\[.*?\]\]>|<!--.*?-->|<\/?[^>]+?>)/gsu;

        let startIndent = 0;
        let formatted: string[] = [];

        if (xml.startsWith(" ")) {
            const firstTagIndex = xml.indexOf("<");
            if (firstTagIndex > 0) {
                startIndent = firstTagIndex;
            }
        }
        const indentSize = this.settings.indentLength ?? 4;
        let indentLevel = Math.floor(startIndent / indentSize);

        let lastIndex = 0;
        const matches = [...xml.matchAll(tagRegex)];
        var i = 0;
        for (const match of matches) {
            const [tag] = match;
            const index = match.index ?? 0;

            /*
             * Handle text/whitespace between tags. Escaping runs before the trim, and that
             * ordering is the whole point of the option: trim() counts NBSP and the rest of Zs as
             * whitespace, so an invisible character at the edge of a text node would be deleted
             * rather than escaped - the #208 data loss. A character reference is not whitespace
             * and survives. The consequence to expect is that a node made only of invisible
             * characters stops being empty while the option is on; the engine does the same.
             */
            const rawText = this.escapeInvisibleNonAscii(xml.slice(lastIndex, index));
            const text = rawText.trim();
            if (text) {
                let n = i === 0 && indentLevel > 0 ? indentLevel - 1 : indentLevel;
                formatted.push(' '.repeat(n * indentSize) + text);
            } else if (rawText.length > 0) {
                // Pure whitespace between tags
                if (!rawText.includes('\n') && !rawText.includes('\r')) {
                    // Inline whitespace content (e.g. <xsl:text> </xsl:text>)
                    if (this.settings.preserveNewLines) {
                        let n = i === 0 && indentLevel > 0 ? indentLevel - 1 : indentLevel;
                        formatted.push(' '.repeat(n * indentSize) + rawText);
                    }
                } else if (this.settings.preserveNewLines) {
                    // Multiple newlines indicate an empty line that should be preserved
                    const newlineCount = (rawText.match(/\n/g) || []).length;
                    if (newlineCount >= 2) {
                        formatted.push('');
                    }
                }
            }
            i++;
            if (tag.startsWith('<?') || tag.startsWith('<!DOCTYPE') || tag.startsWith('<![CDATA[')) {
                formatted.push(' '.repeat(indentLevel * indentSize) + tag);
            } else if (tag.startsWith('<!--')) {
                let formattedComment = tag;
                if (this.settings.wrapCommentTextWithSpaces && !this.settings.preserveWhiteSpacesInComment) {
                    const commentMatch = tag.match(/^<!--\s*(.*?)\s*-->$/su);
                    if (commentMatch) {
                        formattedComment = `<!-- ${commentMatch[1]} -->`;
                    }
                }
                formatted.push(' '.repeat(indentLevel * indentSize) + formattedComment);
            } else if (tag.startsWith('</')) {
                indentLevel = Math.max(indentLevel - 1, 0);
                formatted.push(' '.repeat(indentLevel * indentSize) + tag);
            } else {
                const isSelfClosing = tag.endsWith('/>') || tag.endsWith('/ >');

                const formattedTag = this.formatTagWithAttributes(tag, indentLevel * indentSize);
                formatted.push(' '.repeat(indentLevel * indentSize) + formattedTag);

                if (!isSelfClosing) {
                    indentLevel++;
                }
            }

            lastIndex = match.index! + tag.length;
        }

        // Remaining text after last tag
        const trailing = this.escapeInvisibleNonAscii(xml.slice(lastIndex)).trim();
        if (trailing) {
            formatted.push(' '.repeat(indentLevel * indentSize) + trailing);
        }

        return formatted.join('\n');
    }

    public formatTagWithAttributes(tag: string, baseIndent: number): string {
        const tagNameMatch = tag.match(/^<([^\s/>]+)/u);
        if (!tagNameMatch) {
            return tag;
        }
        const tagName = tagNameMatch[1];

        const isSelfClosing = /\/\s*>$/su.test(tag);
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
