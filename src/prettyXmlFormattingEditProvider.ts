import
{
    CancellationToken,
    DocumentFormattingEditProvider,
    FormattingOptions,
    ProviderResult,
    Range,
    TextDocument,
    TextEdit
} from "vscode";
import { Formatter } from "./formatter";

export class PrettyXmlFormattingEditProvider implements DocumentFormattingEditProvider
{
    formatter: Formatter;
    constructor(formatter: Formatter)
    {
        this.formatter = formatter;
    }
    provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]>
    {
        const lastLine = document.lineAt(document.lineCount - 1);
        const documentRange = new Range(document.positionAt(0), lastLine.range.end);

        return new Promise((resolve, reject) =>
        {
            try
            {
                this.formatter.formatXml().then(formattedText =>
                {
                    const temp = TextEdit.replace(documentRange, formattedText);
                    resolve([temp]);
                });
            } catch (error)
            {
                reject(error);
            }
        });
    }
}