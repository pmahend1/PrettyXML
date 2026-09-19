import { CancellationToken, DocumentRangeFormattingEditProvider, FormattingOptions, Position, ProviderResult, Range, TextDocument, TextEdit } from "vscode";
import { Formatter } from "./formatter";
import { TextXmlFormatter } from "./regexFormatter";
import { defaultSettings, Settings } from "./settings";
import { appendEolIfMissing, preserveOriginalEol } from "./eolHelper";

export class RangeFormatterProvider implements DocumentRangeFormattingEditProvider {

    private formatter?: Formatter;
    private settings?: Settings;

    constructor(settingsOrFormatter: Settings | Formatter) {
        if (settingsOrFormatter instanceof Formatter) {
            this.formatter = settingsOrFormatter;
        } else {
            this.settings = settingsOrFormatter;
        }
    }

    private getSettings(): Settings {
        if (this.formatter) {
            this.formatter.loadSettings();
            return this.formatter.settings;
        }
        return this.settings ?? defaultSettings;
    }

    provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
        if (document) {
            const settings = this.getSettings();
            const edit = this.formatRange(document, range, new TextXmlFormatter(settings), settings);
            if (edit !== undefined) {
                return [edit];
            }
        }
        return [];
    }

    provideDocumentRangesFormattingEdits?(document: TextDocument, ranges: Range[], options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
        if (document) {
            const currentSettings = this.getSettings();
            const regexFormatter = new TextXmlFormatter(currentSettings);
            const edits: TextEdit[] = [];
            for (const range of ranges) {
                const edit = this.formatRange(document, range, regexFormatter, currentSettings);
                if (edit !== undefined) {
                    edits.push(edit);
                }
            }
            return edits;
        }
        return [];
    }

    /*
     * The formatter indents from a base column rather than guessing one out of the selected text, so
     * a selection preceded only by whitespace is widened to cover that indentation - otherwise the
     * replacement would sit after indentation it cannot see and the first line would keep whatever
     * width it had. A selection starting mid-line is left where the user drew it and starts at zero.
     */
    private formatRange(document: TextDocument, range: Range, formatter: TextXmlFormatter, settings: Settings): TextEdit | undefined {
        const indentationWidth = document.lineAt(range.start.line).firstNonWhitespaceCharacterIndex;
        const startsInIndentation = range.start.character <= indentationWidth;
        const editedRange = startsInIndentation ? range.with(new Position(range.start.line, 0)) : range;

        const text = document.getText(editedRange);
        if (text.length === 0) {
            return undefined;
        }

        const formattedText = formatter.formatXmlPretty(text, startsInIndentation ? indentationWidth : 0);
        return TextEdit.replace(editedRange, this.appendEolIfNeeded(formattedText, text, document, editedRange, settings));
    }

    private appendEolIfNeeded(formattedText: string, originalText: string, document: TextDocument, range: Range, settings: Settings): string {
        if (formattedText.length === 0) {
            return formattedText;
        }
        const lastLine = document.lineAt(document.lineCount - 1);
        const isAtDocumentEnd = range.end.line >= lastLine.lineNumber && range.end.character >= lastLine.range.end.character;
        if (!isAtDocumentEnd) {
            return formattedText;
        }
        if (settings.addEmptyEol) {
            return appendEolIfMissing(formattedText, originalText);
        }
        return preserveOriginalEol(formattedText, originalText);
    }
}
