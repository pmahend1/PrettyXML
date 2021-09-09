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
import *  as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { Formatter } from "./formatter";

export class PrettyXmlFormattingEditProvider implements DocumentFormattingEditProvider
{
    private formatter: Formatter;
    constructor(formatter: Formatter)
    {
        this.formatter = formatter;
    }

    provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]>
    {
        let documentRange: Range = DocumentHelper.getEditorRange();

        return new Promise(async (resolve, reject) =>
        {
            try
            {
                var progressOptions = {
                    location: vscode.ProgressLocation.Notification,
                    title: "Pretty XML",
                    cancellable: false,
                };

                var formattedText = await vscode.window.withProgress(progressOptions, (progress) =>
                {
                    var promise = new Promise<string>((resolve) =>
                    {
                        progress.report({ message: "Formatting...", increment: 0 });

                        setTimeout(() =>
                        {
                            progress.report({ message: "Formatting...", increment: 25 });

                        }, 100);

                        setTimeout(async () =>
                        {
                            var formattedText = await this.formatter.formatXml();
                            progress.report({ message: "Formatting...", increment: 75 });
                            resolve(formattedText);

                            progress.report({ message: "Formatting...", increment: 100 });

                        }, 250);
                    });

                    return promise;
                });
                const replacer = TextEdit.replace(documentRange, formattedText);
                resolve([ replacer ]);
            }
            catch (error)
            {
                console.error(error);
                reject(error);
            }
        });
    }
}