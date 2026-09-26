import { IndentationStyle } from "./indentationStyle";
import { Settings } from "./settings";
import { StartTagLine } from "./startTagLine";
import { XmlFragmentNode } from "./xmlFragmentNode";
import { XmlFragmentParser } from "./xmlFragmentParser";
import { XmlFragmentToken } from "./xmlFragmentToken";
import { XmlFragmentTokenKind } from "./xmlFragmentTokenKind";

/*
 * Writes a parsed selection back out, one piece of markup per line. Every element's content sits
 * one level deeper than its tags, and the indentation the selection starts at is passed in, not
 * guessed.
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

    // XML whitespace only - NBSP is text to the engine, and trim() would delete it.
    private static readonly xmlWhitespaceRegex = /^[ \t\r\n]*$/u;

    private static readonly xmlWhitespaceEdgeRegex = /^[ \t\r\n]+|[ \t\r\n]+$/gu;

    private static readonly xmlWhitespaceTrailingRegex = /[ \t\r\n]+$/u;

    private static readonly lineBreakRegex = /\r\n|\r|\n/u;

    private static readonly xmlDeclarationRegex = /^<\?xml(\s[\s\S]*?)?\?>$/u;

    // Only a wrapped attribute list reads this, and a wrapped tag is rejected for being multi-line.
    private static readonly inlineProbeIndentation = IndentationStyle.spaces(0);

    private readonly settings: Settings;
    private readonly allAttributesOnFirstLineExceptions: RegExp[];

    // Each element's one-line form, resolved once per render - see resolveInlineForms.
    private readonly inlineForms = new Map<XmlFragmentNode, string | null>();

    constructor(settings: Settings) {
        this.settings = settings;
        this.allAttributesOnFirstLineExceptions = XmlFragmentRenderer.compilePatterns(settings.wildCardedExceptionsForPositionAllAttributesOnFirstLine ?? []);
    }

    // `indentation` carries the selection's own leading whitespace; every line is written from it.
    public render(nodes: readonly XmlFragmentNode[], indentation: IndentationStyle): string {
        this.inlineForms.clear();

        const lines: string[] = [];
        const trailingToken = XmlFragmentRenderer.findLastToken(nodes);
        const siblingCount = XmlFragmentRenderer.countSiblings(nodes);

        for (let index = 0; index < nodes.length; index++) {
            const node = nodes[index];
            if (index === 0 && XmlFragmentRenderer.isCutLeadingRun(node.token)) {
                lines.push(node.token.text.replace(XmlFragmentRenderer.xmlWhitespaceTrailingRegex, ""));
            } else {
                this.renderTree(lines, node, indentation, nodes[index - 1], trailingToken);
            }

            if (this.isBlankLineAfter(nodes, index, siblingCount)) {
                XmlFragmentRenderer.pushBlankLine(lines);
            }
        }

        while (lines.at(-1) === "") {
            lines.pop();
        }

        return lines.join("\n");
    }

    // Rule 5: a leading run carrying a `>` is the tail of a tag the selection cut through, so it
    // goes out as it came in. The cost is that leading character data with a bare `>` does too.
    private static isCutLeadingRun(token: XmlFragmentToken): boolean {
        return token.kind === XmlFragmentTokenKind.text && token.offset === 0 && token.text.includes(">");
    }

    /*
     * Walks the tree depth-first with an explicit stack rather than by recursion: a selection nested
     * a few thousand levels deep overflowed the call stack, where the flat scanner this replaced
     * formatted it. An element's end tag is pushed as a leaf beneath its children, so everything
     * comes off the stack in document order.
     *
     * A null node is a blank line. An end tag carries where its start tag's line ended, so it can tell
     * whether anything inside started a line of its own.
     */
    private renderTree(
        lines: string[],
        root: XmlFragmentNode,
        indentation: IndentationStyle,
        rootPreviousSibling: XmlFragmentNode | undefined,
        trailingToken: XmlFragmentToken | undefined
    ): void {
        const pending: [XmlFragmentNode | null, number, XmlFragmentNode | undefined, StartTagLine?][] = [[root, 0, rootPreviousSibling]];

        for (let step = pending.pop(); step !== undefined; step = pending.pop()) {
            const [node, depth, previousSibling, startTagLine] = step;
            if (node === null) {
                XmlFragmentRenderer.pushBlankLine(lines);
                continue;
            }

            const token = node.token;
            const indent = indentation.forDepth(depth);

            switch (token.kind) {
                case XmlFragmentTokenKind.text:
                    this.appendTextRun(lines, token.text, indent, token === trailingToken);
                    break;

                // Rule 5 at the other end: the front half of a cut tag, indented but never rewritten.
                case XmlFragmentTokenKind.unterminated:
                    lines.push(indent + token.text);
                    break;

                case XmlFragmentTokenKind.comment:
                    if (this.keepsCommentOnPreviousLine(lines, previousSibling)) {
                        lines[lines.length - 1] += this.formatComment(token.text);
                    } else {
                        lines.push(indent + this.formatComment(token.text));
                    }
                    break;

                case XmlFragmentTokenKind.startTag: {
                    const formattedTag = indent + this.formatTag(token, depth, indentation);
                    if (XmlFragmentRenderer.preservesWhiteSpace(token)) {
                        lines.push(formattedTag + XmlFragmentRenderer.readSourceText(node));
                        break;
                    }

                    const inlineContent = this.readInlineContent(node);
                    if (node.endTag !== null && inlineContent !== null) {
                        lines.push(formattedTag + inlineContent + node.endTag.text);
                        break;
                    }

                    const childDepth = depth + 1;
                    const grouped = this.readGroupedContent(node, indentation.forDepth(childDepth));
                    if (grouped !== null && node.endTag !== null) {
                        lines.push(formattedTag + grouped.head);
                        lines.push(...grouped.lines);
                        lines.push(indent + node.endTag.text);
                        break;
                    }

                    lines.push(formattedTag);
                    if (node.endTag !== null) {
                        pending.push([XmlFragmentRenderer.leaf(node.endTag), depth, undefined, { index: lines.length - 1, width: formattedTag.length }]);
                    }
                    const siblingCount = XmlFragmentRenderer.countSiblings(node.children);
                    for (let index = node.children.length - 1; index >= 0; index--) {
                        if (this.isBlankLineAfter(node.children, index, siblingCount)) {
                            pending.push([null, childDepth, undefined]);
                        }
                        pending.push([node.children[index], childDepth, node.children[index - 1]]);
                    }
                    break;
                }

                case XmlFragmentTokenKind.selfClosingTag:
                    lines.push(indent + this.formatTag(token, depth, indentation));
                    break;

                case XmlFragmentTokenKind.processingInstruction:
                    lines.push(indent + this.formatProcessingInstruction(token.text));
                    break;

                // An element's own end tag, or one render() found closing nothing at the top level.
                case XmlFragmentTokenKind.endTag:
                    if (XmlFragmentRenderer.contentStayedOnStartTagLine(lines, startTagLine)) {
                        lines[lines.length - 1] += token.text;
                    } else {
                        lines.push(indent + token.text);
                    }
                    break;

                case XmlFragmentTokenKind.cdata:
                case XmlFragmentTokenKind.markupDeclaration:
                    lines.push(indent + token.text);
                    break;
            }
        }
    }

    /*
     * The engine's rule: an end tag gets a line of its own only when something inside the element
     * started one. Here that is content - comments kept in place - appended to the start tag's line
     * and nothing pushed after it. An element whose content was dropped entirely keeps its end tag
     * on a new line, which is what the engine does with `<a>\n</a>` under preserveNewLines.
     */
    private static contentStayedOnStartTagLine(lines: readonly string[], startTagLine: StartTagLine | undefined): boolean {
        return startTagLine !== undefined
            && startTagLine.index === lines.length - 1
            && lines[startTagLine.index].length > startTagLine.width;
    }

    private static leaf(token: XmlFragmentToken): XmlFragmentNode {
        return { token: token, children: [], endTag: null };
    }

    private static isTextRun(token: XmlFragmentToken): boolean {
        return token.kind === XmlFragmentTokenKind.text || token.kind === XmlFragmentTokenKind.unterminated;
    }

    private static isWhitespaceText(node: XmlFragmentNode | undefined): boolean {
        return node?.token.kind === XmlFragmentTokenKind.text && XmlFragmentRenderer.xmlWhitespaceRegex.test(node.token.text);
    }

    /*
     * Rule 6. The attributes are read rather than the tag searched, because a selection cut through
     * a tag can leave xml:space="preserve" sitting inside some other attribute's value - and then
     * the next format, which requotes that value, would not find it again. An ancestor carrying it
     * from outside the selection is invisible here - see the README.
     */
    private static preservesWhiteSpace(startTag: XmlFragmentToken): boolean {
        if (startTag.text.includes("xml:space") === false) {
            return false;
        }

        const attributeText = startTag.text.match(XmlFragmentRenderer.tagPartsRegex)?.[2] ?? "";
        for (const [, name, value] of attributeText.matchAll(XmlFragmentRenderer.attributeRegex)) {
            if (name === "xml:space") {
                return value === "\"preserve\"" || value === "'preserve'" || value === "preserve";
            }
        }
        return false;
    }

    // An element's content and end tag as the selection wrote them.
    private static readSourceText(element: XmlFragmentNode): string {
        const content = XmlFragmentParser.flatten(element.children).map(token => token.text).join("");
        return content + (element.endTag?.text ?? "");
    }

    private static isElement(node: XmlFragmentNode): boolean {
        return node.token.kind === XmlFragmentTokenKind.startTag || node.token.kind === XmlFragmentTokenKind.selfClosingTag;
    }

    // A blank first line separates nothing, and a second format would not find it again.
    private static pushBlankLine(lines: string[]): void {
        if (lines.length > 0 && lines.at(-1) !== "") {
            lines.push("");
        }
    }

    // An invalid pattern matches nothing; a selection has no way to report the error.
    private static compilePatterns(patterns: readonly string[]): RegExp[] {
        const compiled: RegExp[] = [];
        for (const pattern of patterns) {
            try {
                compiled.push(new RegExp(pattern));
            } catch {
                continue;
            }
        }
        return compiled;
    }

    private static countSiblings(siblings: readonly XmlFragmentNode[]): number {
        return siblings.filter(sibling => XmlFragmentRenderer.isWhitespaceText(sibling) === false).length;
    }

    /*
     * The engine's WriteBlankLineAfterChild, less its whitespace handling under preserveNewLines,
     * which counts indentation as siblings and so changes its answer on a second format.
     */
    private isBlankLineAfter(siblings: readonly XmlFragmentNode[], index: number, siblingCount: number): boolean {
        if (this.settings.addEmptyLineBetweenElements !== true || siblingCount <= 2 || XmlFragmentRenderer.isElement(siblings[index]) === false) {
            return false;
        }

        let next = index + 1;
        while (next < siblings.length && XmlFragmentRenderer.isWhitespaceText(siblings[next])) {
            next++;
        }
        if (next === siblings.length || XmlFragmentRenderer.isTextRun(siblings[next].token)) {
            return false;
        }

        // A comment sharing the element's line would otherwise be joined onto the blank line.
        return siblings[next].token.kind !== XmlFragmentTokenKind.comment || this.sharesPreviousLine(siblings[next - 1]) === false;
    }

    // Like the engine, a comment that shared its line is joined with no space between.
    private keepsCommentOnPreviousLine(lines: readonly string[], previousSibling: XmlFragmentNode | undefined): boolean {
        return lines.length > 0 && this.sharesPreviousLine(previousSibling);
    }

    private sharesPreviousLine(commentPreviousSibling: XmlFragmentNode | undefined): boolean {
        if (this.settings.preserveCommentPlacement !== true) {
            return false;
        }

        const beganOwnLine = XmlFragmentRenderer.isWhitespaceText(commentPreviousSibling) && commentPreviousSibling?.token.text.includes("\n") === true;
        return beganOwnLine === false;
    }

    /*
     * The element's content on its tags' own line, or null when it has to be broken out. Content
     * that is all markup is laid out as a block, as the engine does.
     */
    private readInlineContent(element: XmlFragmentNode): string | null {
        if (element.endTag === null) {
            return null;
        }

        this.resolveInlineForms(element);
        return this.computeInlineContent(element);
    }

    /*
     * Deepest-first on an explicit stack, for the reason every other walk here is iterative. The
     * cache also keeps a parent that cannot inline from re-walking a subtree it already asked about.
     */
    private resolveInlineForms(root: XmlFragmentNode): void {
        const pending: XmlFragmentNode[] = [root];

        while (pending.length > 0) {
            const node = pending[pending.length - 1];
            if (this.inlineForms.has(node)) {
                pending.pop();
                continue;
            }

            let hasUnresolvedChild = false;
            for (const child of node.children) {
                if (child.token.kind === XmlFragmentTokenKind.startTag && this.inlineForms.has(child) === false) {
                    pending.push(child);
                    hasUnresolvedChild = true;
                }
            }

            if (hasUnresolvedChild) {
                continue;
            }

            pending.pop();
            this.inlineForms.set(node, this.computeInlineElement(node));
        }
    }

    // An element written whole on one line. Every element descendant must already be resolved.
    private computeInlineElement(element: XmlFragmentNode): string | null {
        if (element.endTag === null || XmlFragmentRenderer.preservesWhiteSpace(element.token)) {
            return null;
        }

        const content = this.computeInlineContent(element);
        if (content === null) {
            return null;
        }

        const tag = this.formatTag(element.token, 0, XmlFragmentRenderer.inlineProbeIndentation);
        if (XmlFragmentRenderer.isMultiLine(tag)) {
            return null;
        }

        return tag + content + element.endTag.text;
    }

    private computeInlineContent(element: XmlFragmentNode): string | null {
        const children = element.children;
        if (children.length === 0) {
            return "";
        }

        // Whitespace alone is content only under preserveNewLines; otherwise the engine never loads it.
        if (children.length === 1 && XmlFragmentRenderer.isWhitespaceText(children[0])) {
            if (this.settings.preserveNewLines !== true) {
                return "";
            }
            return XmlFragmentRenderer.isMultiLine(children[0].token.text) ? null : children[0].token.text;
        }

        const groups = this.layoutContent(element);
        return groups !== null && groups.length === 1 ? groups[0] : null;
    }

    /*
     * Mixed content that does not fit on one line, as the engine writes it: `<r><a/>x<b/></r>` is
     * one line of content and `<r><a/><b/>x<c/></r>` is two. Content with no character data at all
     * is left to the block layout, which also knows about blank lines.
     */
    private readGroupedContent(element: XmlFragmentNode, childIndent: string): { head: string; lines: string[] } | null {
        if (element.endTag === null || element.children.some(XmlFragmentRenderer.isCharacterData) === false) {
            return null;
        }

        this.resolveInlineForms(element);

        const groups = this.layoutContent(element);
        if (groups === null) {
            return null;
        }

        return {
            head: groups[0],
            lines: groups.slice(1).map(line => childIndent + line),
        };
    }

    /*
     * The engine's layout of an element's content, as the lines it writes: the first is the start
     * tag's own, and each one after it began with a child that started a line. Null when a child
     * cannot be written on one line. Every element child's inline form must already be resolved.
     *
     * Whitespace-only runs are not text to the engine - it drops them, or under preserveNewLines
     * reads them as structural whitespace - so they never glue two children together.
     */
    private layoutContent(element: XmlFragmentNode): string[] | null {
        const children = element.children;
        let lastIndex = children.length - 1;
        while (lastIndex >= 0 && XmlFragmentRenderer.isWhitespaceText(children[lastIndex])) {
            lastIndex--;
        }

        const groups = [""];
        let previous: XmlFragmentNode | undefined = undefined;
        let trailingWhitespace = "";

        for (let index = 0; index <= lastIndex; index++) {
            const child = children[index];
            if (XmlFragmentRenderer.isWhitespaceText(child)) {
                if (this.settings.preserveNewLines === true) {
                    previous = child;
                }
                continue;
            }

            let text = child.token.text;
            if (index === lastIndex && child.token.kind === XmlFragmentTokenKind.text) {
                const trimmed = text.replace(XmlFragmentRenderer.xmlWhitespaceTrailingRegex, "");
                trailingWhitespace = text.slice(trimmed.length);
                text = trimmed;
            }

            const part = this.readInlineChild(child, text);
            if (part === null) {
                return null;
            }

            if (this.startsLine(child, previous, children[index - 1])) {
                groups.push("");
            }
            groups[groups.length - 1] += part;
            previous = child;
        }

        // Text followed by the end tag keeps its trailing whitespace; a line break would absorb it.
        if (groups.length === 1 && trailingWhitespace !== "") {
            if (XmlFragmentRenderer.isMultiLine(trailingWhitespace)) {
                return null;
            }
            groups[0] += trailingWhitespace;
        }
        return groups;
    }

    /*
     * The engine's WriteSeparatorBeforeChild and its CDATA rule. `previous` is the last child
     * written - undefined for the start tag - and `sibling` the one just before, whitespace included.
     */
    private startsLine(child: XmlFragmentNode, previous: XmlFragmentNode | undefined, sibling: XmlFragmentNode | undefined): boolean {
        const previousIsText = previous !== undefined && previous.token.kind === XmlFragmentTokenKind.text && XmlFragmentRenderer.isWhitespaceText(previous) === false;

        switch (child.token.kind) {
            case XmlFragmentTokenKind.text:
                return false;
            case XmlFragmentTokenKind.cdata:
                return previousIsText === false && previous !== undefined && XmlFragmentRenderer.isElement(previous) === false;
            case XmlFragmentTokenKind.comment:
                return previousIsText === false && this.sharesPreviousLine(sibling) === false;
            default:
                return previousIsText === false;
        }
    }

    // `text` is the token's text less any trailing whitespace layoutContent has taken off.
    private readInlineChild(child: XmlFragmentNode, text: string): string | null {
        const token = child.token;
        if (XmlFragmentRenderer.isMultiLine(text)) {
            return null;
        }

        switch (token.kind) {
            case XmlFragmentTokenKind.text:
                return this.escapeInvisibleNonAscii(text);

            case XmlFragmentTokenKind.cdata:
                return token.text;

            case XmlFragmentTokenKind.comment:
                return this.formatComment(token.text);

            case XmlFragmentTokenKind.selfClosingTag: {
                const tag = this.formatTag(token, 0, XmlFragmentRenderer.inlineProbeIndentation);
                return XmlFragmentRenderer.isMultiLine(tag) ? null : tag;
            }

            case XmlFragmentTokenKind.startTag:
                return this.inlineForms.get(child) ?? null;

            default:
                return null;
        }
    }

    /** The last token of the selection in document order - the one whose whitespace is never kept. */
    private static findLastToken(nodes: readonly XmlFragmentNode[]): XmlFragmentToken | undefined {
        let last = nodes.at(-1);
        while (last !== undefined && last.endTag === null && last.children.length > 0) {
            last = last.children.at(-1);
        }
        return last === undefined ? undefined : last.endTag ?? last.token;
    }

    /*
     * Only XML's own four whitespace characters are trimmed. JavaScript's trim() counts NBSP and the
     * rest of Zs as whitespace and would delete a text run made of them - rule 1 says nothing is
     * deleted, and the engine reads them as text too.
     */
    private appendTextRun(lines: string[], rawText: string, indent: string, isTrailing: boolean): void {
        const escaped = this.escapeInvisibleNonAscii(rawText);
        const text = escaped.replace(XmlFragmentRenderer.xmlWhitespaceEdgeRegex, "");
        if (text !== "") {
            this.appendTextLines(lines, text, indent);
            return;
        }

        // Trailing whitespace is dropped outright - the formatter never ends a selection with EOL.
        if (isTrailing || this.settings.preserveNewLines !== true) {
            return;
        }

        // Whitespace between siblings; only an intended blank line survives.
        if (XmlFragmentRenderer.containsBlankLine(escaped)) {
            XmlFragmentRenderer.pushBlankLine(lines);
        }
    }

    /*
     * A run spanning several lines is re-indented a line at a time, as the engine does. An interior
     * blank line survives only under preserveNewLines - the engine keeps it either way, but writes
     * it as trailing spaces, and nothing else here emits trailing whitespace.
     */
    private appendTextLines(lines: string[], text: string, indent: string): void {
        if (XmlFragmentRenderer.isMultiLine(text) === false) {
            lines.push(indent + text);
            return;
        }

        for (const sourceLine of text.split(XmlFragmentRenderer.lineBreakRegex)) {
            const line = sourceLine.replace(XmlFragmentRenderer.xmlWhitespaceEdgeRegex, "");
            if (line === "") {
                if (this.settings.preserveNewLines === true) {
                    XmlFragmentRenderer.pushBlankLine(lines);
                }
                continue;
            }

            lines.push(indent + line);
        }
    }

    private static isMultiLine(text: string): boolean {
        return text.includes("\n") || text.includes("\r");
    }

    // Text that is not whitespace alone, or CDATA - what the engine writes inline with its neighbours.
    private static isCharacterData(node: XmlFragmentNode): boolean {
        return node.token.kind === XmlFragmentTokenKind.cdata
            || (node.token.kind === XmlFragmentTokenKind.text && XmlFragmentRenderer.isWhitespaceText(node) === false);
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

    private formatProcessingInstruction(instruction: string): string {
        const content = instruction.match(XmlFragmentRenderer.xmlDeclarationRegex)?.[1]?.trim();
        if (content === undefined || content === "") {
            return instruction;
        }

        const end = this.settings.addSpaceBeforeEndOfXmlDeclaration === true ? " ?>" : "?>";
        return `<?xml ${content}${end}`;
    }

    private formatTag(token: XmlFragmentToken, depth: number, indentation: IndentationStyle): string {
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

        if (this.settings.positionAllAttributesOnFirstLine === true && this.isAllAttributesOnFirstLineException(tagName) === false) {
            return `<${tagName} ${attributes.join(" ")}${closingBracket}`;
        }

        // The engine ignores the threshold here, so a single attribute wraps too.
        if (this.settings.positionFirstAttributeOnSameLine === false) {
            const attributeIndentation = "\n" + indentation.forDepth(depth + 1);
            return `<${tagName}${attributeIndentation}${attributes.join(attributeIndentation)}${closingBracket}`;
        }

        if (attributes.length <= (this.settings.attributesInNewlineThreshold ?? 1)) {
            return `<${tagName} ${attributes.join(" ")}${closingBracket}`;
        }

        // The first attribute stays on the tag's line and the rest line up under it.
        const alignment = "\n" + indentation.alignedUnderColumn(depth, `<${tagName} `.length);
        return `<${tagName} ${attributes.join(alignment)}${closingBracket}`;
    }

    private isAllAttributesOnFirstLineException(tagName: string): boolean {
        return this.allAttributesOnFirstLineExceptions.some(pattern => pattern.test(tagName));
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
            return `${name}=${this.escapeApostrophes(requoted)}`;
        }

        const outputValue = this.escapeApostrophes(escapedValue);
        const rawAttribute = rawMatch.trim();
        if (outputValue === value) {
            return rawAttribute;
        }
        // The value ends the match, so swapping only the tail keeps the spacing around the '='.
        return rawAttribute.slice(0, rawAttribute.length - value.length) + outputValue;
    }

    private escapeApostrophes(quotedValue: string): string {
        if (this.settings.allowSingleQuoteInAttributeValue !== false
            || this.settings.useSingleQuotes === true
            || quotedValue.startsWith("\"") === false) {
            return quotedValue;
        }

        return quotedValue.replaceAll("'", "&apos;");
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
