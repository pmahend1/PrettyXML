import { CancellationToken, DocumentRangeFormattingEditProvider, FormattingOptions, Position, ProviderResult, Range, TextDocument, TextEdit } from "vscode";
import { Formatter } from "./formatter";
import { IndentationStyle } from "./indentationStyle";
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
            const edit = this.formatRange(document, range, new TextXmlFormatter(settings), settings, options);
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
                const edit = this.formatRange(document, range, regexFormatter, currentSettings, options);
                if (edit !== undefined) {
                    edits.push(edit);
                }
            }
            return edits;
        }
        return [];
    }

    /*
     * The formatter indents from a base indentation rather than guessing one out of the selected
     * text, so a selection preceded only by whitespace is widened to cover that indentation -
     * otherwise the replacement would sit after indentation it cannot see and the first line would
     * keep whatever width it had. A selection starting mid-line is left where the user drew it and
     * starts at the left margin.
     */
    private formatRange(document: TextDocument, range: Range, formatter: TextXmlFormatter, settings: Settings, options: FormattingOptions): TextEdit | undefined {
        const firstLine = document.lineAt(range.start.line);
        const startsInIndentation = range.start.character <= firstLine.firstNonWhitespaceCharacterIndex;
        const editedRange = startsInIndentation ? range.with(new Position(range.start.line, 0)) : range;

        const text = document.getText(editedRange);
        if (text.length === 0) {
            return undefined;
        }

        // Taken as written rather than measured in columns, so a tab-indented first line comes back
        // the way it went in and the next format over the same lines reads the same base.
        const baseIndent = startsInIndentation ? firstLine.text.slice(0, firstLine.firstNonWhitespaceCharacterIndex) : "";

        const indentation = new IndentationStyle(baseIndent, RangeFormatterProvider.indentUnit(options, settings));
        const formattedText = formatter.formatXmlPretty(text, indentation);
        return TextEdit.replace(editedRange, this.appendEolIfNeeded(formattedText, text, document, editedRange, settings));
    }

    /*
     * The editor decides tabs or spaces, indentLength decides how wide a space indent is. They do
     * not compete: indentLength cannot say "tab", and taking the width from tabSize instead would
     * make a selection indent differently from Format Document, which sends indentLength on.
     */
    private static indentUnit(options: FormattingOptions, settings: Settings): string {
        return options.insertSpaces === false ? "\t" : " ".repeat(settings.indentLength ?? 4);
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
