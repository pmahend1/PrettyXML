import {
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
import { ConsoleLogger } from "./logger";

export class PrettyXmlFormattingEditProvider implements DocumentFormattingEditProvider {
    private formatter: Formatter;
    constructor(formatter: Formatter) {
        this.formatter = formatter;
    }

    provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
        ConsoleLogger.instance.info("provideDocumentFormattingEdits start");
        let documentRange: Range = DocumentHelper.getDocumentRange(document);

        let docText = document?.getText();

        if (!docText) {
            ConsoleLogger.instance.info("docText is null. returning empty []");
            return [];
        }

        token.onCancellationRequested((e: any, thisArgs?: any, disposables?: any) => {
            if (token.isCancellationRequested) {
                ConsoleLogger.instance.info("token.onCancellationRequested. Returning []");
                return [];
            }
        });
        return new Promise(async (resolve) => {
            try {
                var progressOptions = {
                    location: vscode.ProgressLocation.Notification,
                    title: "Pretty XML",
                    cancellable: true,
                };

                var formattedText = await vscode.window.withProgress(progressOptions, (progress, token) => {
                    token.onCancellationRequested((e: any, thisArgs?: any, disposables?: any) => {
                        if (token.isCancellationRequested) {
                            ConsoleLogger.instance.info("vscode.window.withProgress.token.onCancellationRequested. Returning []");
                            return [];
                        }
                    });
                    var promise = new Promise<string>(async (resolve, reject) => {
                        progress.report({ message: "Formatting...", increment: 0 });

                        setTimeout(() => {
                            progress.report({ message: "Formatting...", increment: 25 });

                        }, 100);

                        setTimeout(async () => {
                            try {
                                var formattedText = await this.formatter.formatXml(docText);
                                progress.report({ message: "Formatting...", increment: 75 });
                                resolve(formattedText);

                                progress.report({ message: "Formatting...", increment: 100 });
                            }
                            catch (error) {
                                ConsoleLogger.instance.error(error as Error);
                                return reject(error);
                            }
                        }, 250);
                    });

                    return promise;
                });
                const replacer = TextEdit.replace(documentRange, formattedText);
                ConsoleLogger.instance.info("provideDocumentFormattingEdits start");
                return resolve([replacer]);
            }
            catch (error) {
                ConsoleLogger.instance.error(error as Error);
                console.error(error);
                ConsoleLogger.instance.info("provideDocumentFormattingEdits start");
                return resolve([]);
            }
        });
    }
}