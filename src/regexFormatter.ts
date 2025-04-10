import { Settings } from "./settings";

export class TextXmlFormatter {

    private settings: Settings;
    constructor(settings: Settings) {
        this.settings = settings;
    }
    public formatXmlPretty(xml: string): string {
        const tagRegex = /(<\?xml[^?>]*\?>|<!DOCTYPE[^>]*>|<!\[CDATA\[.*?\]\]>|<!--.*?-->|<\/?[^>]+?>)/gs;

        let startIndent = 0;
        let formatted: string[] = [];

        if (xml.startsWith(" ")) {
            const firstTagIndex = xml.indexOf("<");
            if (firstTagIndex > 0) {
                startIndent = firstTagIndex;
            }
        }
        const indentSize = this.settings.indentLength ?? 4;
        let indentLevel = startIndent / indentSize;

        let lastIndex = 0;
        const matches = [...xml.matchAll(tagRegex)];
        var i = 0;
        for (const match of matches) {
            const [tag] = match;
            const index = match.index ?? 0;

            // Handle text between tags
            const text = xml.slice(lastIndex, index).trim();
            if (text) {
                let n = i === 0 && indentLevel > 0 ? indentLevel - 1 : indentLevel;
                formatted.push(' '.repeat(n * indentSize) + text);
            }
            i++;
            if (tag.startsWith('<?xml') || tag.startsWith('<!DOCTYPE') || tag.startsWith('<![CDATA[') || tag.startsWith('<!--')) {
                formatted.push(' '.repeat(indentLevel * indentSize) + tag);
            } else if (tag.startsWith('</')) {
                indentLevel = Math.max(indentLevel - 1, 0);
                formatted.push(' '.repeat(indentLevel * indentSize) + tag);
            } else {
                const isSelfClosing = tag.endsWith('/>');

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
        const tagRegex = /^<([^\s/>]+)((?:\s+[^\s=]+(?:=(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>$/;

        const match = tag.match(tagRegex);
        if (!match) return tag;

        const [, tagName, attrs, selfClosing] = match;

        const attrRegex = /([^\s=]+(?:=(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)/g;
        const childNodeMatches = [...attrs.matchAll(attrRegex)];
        if (childNodeMatches.length === 0) {
            return `<${tagName}${selfClosing ? ' />' : '>'}`;
        }

        const alignIndent = baseIndent + `<${tagName} `.length;
        const alignedAttrs: string[] = [];

        alignedAttrs.push(childNodeMatches[0][0]); // first attribute inline

        let isSelfClosing = false;
        for (let i = 1; i < childNodeMatches.length; i++) {
            if (childNodeMatches[i][0].endsWith('/') === false) {
                alignedAttrs.push(' '.repeat(alignIndent) + childNodeMatches[i][0]);
            } else {
                isSelfClosing = true;
            }
        }

        // Append closing directly to last line
        alignedAttrs[alignedAttrs.length - 1] += isSelfClosing ? '/>' : '>';

        return `<${tagName} ${alignedAttrs.join('\n')}`;
    }
}