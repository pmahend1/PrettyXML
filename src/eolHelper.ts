/**
 * Appends a trailing newline to `text` if it doesn't already end with one.
 * Detects CRLF vs LF from the content or the original source text.
 * Returns `text` unchanged when it already ends with a newline or is empty.
 */
export function appendEolIfMissing(text: string, originalText: string): string {
    if (text.length === 0) {
        return text;
    }
    if (text.endsWith("\r\n") || text.endsWith("\n")) {
        return text;
    }
    const eol = text.includes("\r\n") || originalText.includes("\r\n") ? "\r\n" : "\n";
    return text + eol;
}

/**
 * If the original text ended with a newline but the formatted text does not,
 * re-append the same line ending. Preserves the original file's EOL state
 * without adding one that wasn't there before.
 */
export function preserveOriginalEol(text: string, originalText: string): string {
    if (text.length === 0 || originalText.length === 0) {
        return text;
    }
    if (text.endsWith("\r\n") || text.endsWith("\n")) {
        return text;
    }
    if (originalText.endsWith("\r\n")) {
        return text + "\r\n";
    }
    if (originalText.endsWith("\n")) {
        return text + "\n";
    }
    return text;
}
