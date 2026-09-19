export enum XmlFragmentTokenKind {
    /** Everything outside markup - character data and the whitespace between tags. */
    text = "Text",
    startTag = "StartTag",
    selfClosingTag = "SelfClosingTag",
    endTag = "EndTag",
    comment = "Comment",
    cdata = "CData",

    /** `<?xml ... ?>` and every other processing instruction; the two are formatted alike. */
    processingInstruction = "ProcessingInstruction",

    /** `<!DOCTYPE ...>` and any other `<!...>` declaration. */
    markupDeclaration = "MarkupDeclaration",

    /*
     * Markup that opens and never closes, because the selection was cut mid-token. It always ends
     * the stream: nothing after the opening `<` can be scanned once its terminator is missing.
     */
    unterminated = "Unterminated",
}
