import { CancellationToken, DocumentRangeFormattingEditProvider, FormattingOptions, ProviderResult, Range, TextDocument, TextEdit } from "vscode";
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
            const text = document.getText(range);
            if (text) {
                const settings = this.getSettings();
                const regexFormatter = new TextXmlFormatter(settings);
                let formattedText = regexFormatter.formatXmlPretty(text);
                formattedText = this.appendEolIfNeeded(formattedText, text, document, range, settings);
                const replacer = TextEdit.replace(range, formattedText);
                return [replacer];
            }
        }
        return [];
    }

    provideDocumentRangesFormattingEdits?(document: TextDocument, ranges: Range[], options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
        if (document) {
            const currentSettings = this.getSettings();
            const edits = new Array<TextEdit>();
            for (let i = 0; i < ranges.length; i++) {
                const range = ranges[i];
                const text = document.getText(range);
                if (text) {
                    const regexFormatter = new TextXmlFormatter(currentSettings);
                    let formattedText = regexFormatter.formatXmlPretty(text);
                    formattedText = this.appendEolIfNeeded(formattedText, text, document, range, currentSettings);
                    const replacer = TextEdit.replace(range, formattedText);
                    edits.push(replacer);
                }
            }
            return edits;
        }
        return [];
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