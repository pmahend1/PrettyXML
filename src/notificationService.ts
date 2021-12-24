import * as vscode from "vscode";
import * as compareVersions from "compare-versions";
import * as fs from "fs";
import { UpdateNote } from "./updateNote";
import * as path from "path";
export class NotificationService
{
    private context: vscode.ExtensionContext;
    public readonly storageKeyPrefix: string;

    private lastNotifiedDateKey: string;

    private lastRatingPromptDateKey: string;

    constructor(context: vscode.ExtensionContext)
    {
        this.context = context;
        this.storageKeyPrefix = this.context.extension.id + ".";
        this.lastNotifiedDateKey = `${ this.storageKeyPrefix }lastNotifiedDate`;
        this.lastRatingPromptDateKey = `${ this.storageKeyPrefix }lastRatingPromptDate`;
    }

    private checkIfEligibletToShowUpdateNote(): boolean
    {
        let shouldDisplay: boolean = true;
        try
        {
            const versionKey = `${ this.storageKeyPrefix }version`;
            const currentVersion = this.context.extension.packageJSON.version;
            var lastVersionShown = this.context.globalState.get(versionKey) as string;


            if (lastVersionShown)
            {
                if (compareVersions.compare(currentVersion, lastVersionShown, '='))
                {
                    var minus7days = new Date();
                    minus7days.setDate(minus7days.getDate() - 7);

                    var lastNotifiedDateAsJunk = this.context.globalState.get(this.lastNotifiedDateKey) as Date;
                    if (lastNotifiedDateAsJunk)
                    {
                        var lastNotifiedDateAsCompareable = new Date(lastNotifiedDateAsJunk.toString());
                        shouldDisplay = lastNotifiedDateAsCompareable < minus7days;
                    }
                    else
                    {
                        shouldDisplay = true;
                    }
                }
                else
                {
                    shouldDisplay = true;
                }
            }
            else
            {
                shouldDisplay = true;
            }
            this.context.globalState.update(versionKey, currentVersion);
        }
        catch (error)
        {
            console.error(error);
            shouldDisplay = true;
        }
        return shouldDisplay;
    }

    private getUpdateNotes(version: string): string
    {
        let updateNotes: string = "";
        try
        {
            let filePath = path.join(this.context.extensionPath, "lib", "newReleaseNotifications.json");
            var content = fs.readFileSync(filePath, { "encoding": "utf8" });
            let releaseNotes: UpdateNote[] = JSON.parse(content);
            var currentUpdateNote = releaseNotes.find((x) => { return x.version === version; });

            if (currentUpdateNote)
            {
                updateNotes = currentUpdateNote.updateNotes;
            }

        }
        catch (error)
        {
            console.error(error);
        }
        return updateNotes;
    }

    public async notifyWhatsNewInUpdateAsync(): Promise<void>
    {
        try
        {
            let shouldDisplay: boolean = this.checkIfEligibletToShowUpdateNote();
            if (shouldDisplay)
            {
                var currentVersion = this.context.extension.packageJSON.version;
                var notes = this.getUpdateNotes(currentVersion);
                if (notes !== "")
                {
                    await vscode.window.showInformationMessage(notes);
                    this.context.globalState.update(this.lastNotifiedDateKey, new Date());
                }
            }
        }
        catch (error) 
        {
            console.error(error);
        }
    }

    public async promptForReviewAsync(): Promise<void>
    {
        try
        {
            var shouldDisplayPrompt = this.shouldOpenRatingPrompt();
            if (shouldDisplayPrompt)
            {
                var text = "Loving Pretty XML extension? Would you like to rate and review?";
                var selection = await vscode.window.showInformationMessage(text, "Sure", "Later");
                if (selection)
                {
                    if (selection === "Sure")
                    {
                        var appName = vscode.env.appName.toLowerCase();
                        let vsCodeReviewUri: vscode.Uri = vscode.Uri.parse("https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml&ssr=false#review-details");

                        if (appName.includes("codium"))
                        {
                            var codiumReviewUri = vscode.Uri.parse("https://open-vsx.org/extension/PrateekMahendrakar/prettyxml/reviews");
                            vscode.env.openExternal(codiumReviewUri);
                        }
                        else
                        {
                            vscode.env.openExternal(vsCodeReviewUri);
                        }
                        //cant check if they really reviewed
                        //remind them after 30 days
                        var plus30days = new Date();
                        plus30days.setDate(plus30days.getDate() + 30);
                        
                        this.context.globalState.update(this.lastRatingPromptDateKey, plus30days);
                    }
                    else if (selection === "Later")
                    {
                        this.context.globalState.update(this.lastRatingPromptDateKey, new Date());
                    }
                }
            }
        }
        catch (error)
        {
            console.error(error);
        }
    }

    private shouldOpenRatingPrompt(): boolean
    {
        var lastPromptDateJunk = this.context.globalState.get(this.lastRatingPromptDateKey) as Date;
        var minus15days = new Date();
        minus15days.setDate(minus15days.getDate() - 15);

        if (lastPromptDateJunk)
        {
            var lastPromptDate = new Date(lastPromptDateJunk.toString());
            return lastPromptDate < minus15days;
        }
        else
        {
            return true;
        }
    }
}