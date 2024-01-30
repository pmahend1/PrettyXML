import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { Logger } from "./logger";

export function replaceDocumentTextWithProgressForCallback(progressText: string, task: Thenable<string>): Thenable<void> {
    Logger.instance.info("replaceDocumentTextWithProgressForCallback start");
    var progressOptions = {
        location: vscode.ProgressLocation.Notification,
        title: "Pretty XML",
        cancellable: false,
    };

    var progressPromise = vscode.window.withProgress(progressOptions, (progress) => {
        var promise = new Promise<void>((resolve, reject) => {
            progress.report({ message: progressText, increment: 0 });

            setTimeout(() => {
                progress.report({ message: progressText, increment: 25 });
            }, 100);

            setTimeout(async () => {
                try {
                    var newText = await task;
                    progress.report({ message: progressText, increment: 75 });

                    DocumentHelper.replaceDocumentText(newText);
                    progress.report({ message: progressText, increment: 100 });
                    resolve();
                }
                catch (errorObj) {
                    var errorMessage = errorObj as string;
                    if (errorMessage) {
                        Logger.instance.info(`Errored with ${errorMessage}`);
                        if (errorMessage.includes("System.Xml.XmlException: Unexpected end of file has occurred.")) {
                            var userReadableErrorMessage = errorMessage.replace("System.Xml.XmlException: Unexpected end of file has occurred.","").replace("Unhandled exception. System.Xml.XmlException: ","").replace("Unhandled exception. ", "");
                            vscode.window.showErrorMessage(userReadableErrorMessage);
                        } else {
                            vscode.window.showErrorMessage(errorMessage);
                        }
                        
                    }
                    reject(errorObj);
                }
            }, 250);
        });

        return promise;
    });
    Logger.instance.info("replaceDocumentTextWithProgressForCallback end");
    return progressPromise;
}

