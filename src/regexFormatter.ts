import { Settings } from "./settings";

export class TextXmlFormatter {

    private settings: Settings;
    constructor(settings: Settings) {
        this.settings = settings;
    }
    public formatXmlPretty(xml: string): string {
        const tagRegex = /(<\?.*?\?>|<!DOCTYPE(?:\s+\[[\s\S]*?\]|[^>\[]*(?:\[[\s\S]*?\])?)*?>|<!\[CDATA\[.*?\]\]>|<!--.*?-->|<\/?[^>]+?>)/gsu;

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

            // Handle text/whitespace between tags
            const rawText = xml.slice(lastIndex, index);
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
        const trailing = xml.slice(lastIndex).trim();
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
            if (this.settings.useSingleQuotes) {
                if (attrVal.startsWith('"') && attrVal.endsWith('"')) {
                    const innerVal = attrVal.slice(1, -1);
                    if (!innerVal.includes("'")) {
                        return `${attrName}='${innerVal}'`;
                    }
                }
            } else if (this.settings.useSingleQuotes === false) {
                if (attrVal.startsWith("'") && attrVal.endsWith("'")) {
                    const innerVal = attrVal.slice(1, -1);
                    if (!innerVal.includes('"')) {
                        return `${attrName}="${innerVal}"`;
                    }
                }
            }
            return m[0].trim();
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
}