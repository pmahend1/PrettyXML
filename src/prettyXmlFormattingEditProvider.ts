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
        let documentRange: Range = DocumentHelper.getDocumentRange(document);

        let docText = document?.getText();

        if(!docText)
        {
            return [];
        }

        token.onCancellationRequested((e: any, thisArgs?: any, disposables?:any) =>
        {
            if(token.isCancellationRequested)
            {
                return [];
            }
        });
        return new Promise(async (resolve) =>
        {
            try
            {
                var progressOptions = {
                    location: vscode.ProgressLocation.Notification,
                    title: "Pretty XML",
                    cancellable: true,
                };

                var formattedText = await vscode.window.withProgress(progressOptions, (progress, token) =>
                {
                    token.onCancellationRequested((e: any, thisArgs?: any, disposables?:any) =>
                    {
                        if(token.isCancellationRequested)
                        {
                            return [];
                        }
                    });
                    var promise = new Promise<string>(async (resolve, reject) =>
                    {
                        progress.report({ message: "Formatting...", increment: 0 });

                        setTimeout(() =>
                        {
                            progress.report({ message: "Formatting...", increment: 25 });

                        }, 100);

                        setTimeout(async () =>
                        {
                            try 
                            {
                                var formattedText = await this.formatter.formatXml(docText);
                                progress.report({ message: "Formatting...", increment: 75 });
                                resolve(formattedText);

                                progress.report({ message: "Formatting...", increment: 100 });
                            }
                            catch (error) 
                            {
                                return reject(error);
                            }
                        }, 250);
                    });

                    return promise;
                });
                const replacer = TextEdit.replace(documentRange, formattedText);
                return resolve([ replacer ]);
            }
            catch (error)
            {
                console.error(error);
                return resolve([]);
            }
        });
    }
}