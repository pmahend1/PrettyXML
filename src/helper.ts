import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";

export function replaceDocumentTextWithProgressForCallback(progressText: string, task: Thenable<string>) : Thenable<void>
{
    var progressOptions = {
        location: vscode.ProgressLocation.Notification,
        title: "Pretty XML",
        cancellable: false,
    };

    var progressPromise = vscode.window.withProgress(progressOptions, (progress) =>
    {
        var promise = new Promise<void>((resolve, reject)  =>
        {
            progress.report({ message: progressText, increment: 0 });

            setTimeout(() =>
            {
                progress.report({ message: progressText, increment: 25 });
            }, 100);

            setTimeout(async () =>
            {
                try 
                {
                    var newText = await task;
                    progress.report({ message: progressText, increment: 75 });
    
                    DocumentHelper.replaceDocumentText(newText);
                    progress.report({ message: progressText, increment: 100 });
                    resolve();
                } 
                catch (error) 
                {
                    reject(error);
                }
            }, 250);
        });

        return promise;
    });
    return progressPromise;
}

