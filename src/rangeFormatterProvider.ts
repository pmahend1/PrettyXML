import { CancellationToken, DocumentRangeFormattingEditProvider, FormattingOptions, ProviderResult, Range, TextDocument, TextEdit } from "vscode";
import { Formatter } from "./formatter";
import { TextXmlFormatter } from "./regexFormatter";
import { defaultSettings, Settings } from "./settings";

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
                const regexFormatter = new TextXmlFormatter(this.getSettings());
                const formattedText = regexFormatter.formatXmlPretty(text);
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
                    const formattedText = regexFormatter.formatXmlPretty(text);
                    const replacer = TextEdit.replace(range, formattedText);
                    edits.push(replacer);
                }
            }
            return edits;
        }
        return [];
    }
}