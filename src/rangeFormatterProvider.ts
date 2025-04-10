import { CancellationToken, DocumentRangeFormattingEditProvider, FormattingOptions, ProviderResult, Range, TextDocument, TextEdit } from "vscode";
import { TextXmlFormatter } from "./regexFormatter";
import {  Settings } from "./settings";

export class RangeFormatterProvider implements DocumentRangeFormattingEditProvider {

    private settings: Settings;
    constructor(settings: Settings) {
        this.settings = settings;
    }
    provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
        if (document) {
            var text = document.getText(range);
            if (text) {
                var regexFormatter = new TextXmlFormatter(this.settings);
                var formattedText = regexFormatter.formatXmlPretty(text);
                const replacer = TextEdit.replace(range, formattedText);
                return [replacer]
            }
        }
        return [];
    }
    provideDocumentRangesFormattingEdits?(document: TextDocument, ranges: Range[], options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
        if (document) {
            var edits = new Array<TextEdit>();
            for (let i = 0; i < ranges.length; i++) {
                const range = ranges[i];
                var text = document.getText(range);
                if (text) {
                    var regexFormatter = new TextXmlFormatter(this.settings);
                    var formattedText = regexFormatter.formatXmlPretty(text);
                    const replacer = TextEdit.replace(range, formattedText);
                    edits.push(replacer);
                }
            }
            return edits;
        }
        return [];
    }
}