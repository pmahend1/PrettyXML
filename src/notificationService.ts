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
    constructor(context: vscode.ExtensionContext)
    {
        this.context = context;
        this.storageKeyPrefix = this.context.extension.id + ".";
        this.lastNotifiedDateKey = `${this.storageKeyPrefix}lastNotifiedDate`;
    }

    private checkIfEligibletToShowUpdateNote(): boolean
    {
        let shouldDisplay: boolean = true;
        try
        {
            const versionKey = `${this.storageKeyPrefix}version`;
            const currentVersion = this.context.extension.packageJSON.version;
            var lastVersionShown = this.context.globalState.get(versionKey) as string;


            if(lastVersionShown)
            {
                if (compareVersions.compare(currentVersion, lastVersionShown, '='))
                {
                    var minus15days = new Date();
                    minus15days.setDate(minus15days.getDate() - 7);
    
                    var lastNotifiedDate = this.context.globalState.get(this.lastNotifiedDateKey) as Date;
                    let dateEligible = lastNotifiedDate === undefined || lastNotifiedDate === null || lastNotifiedDate < minus15days;
                    shouldDisplay = dateEligible;
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

    private getUpdateNotes(version: string)
    {
        let updateNotes: string = "";
        try
        {
            let filePath =  path.join(this.context.extensionPath , "src","newReleaseNotifications.json");
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

    public async notifyWhatsNewInUpdate(): Promise<void>
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
                    vscode.window.showInformationMessage(notes);
                    this.context.globalState.update(this.lastNotifiedDateKey, new Date());
                }
            }
        }
        catch (error) 
        {
            console.error(error);
        }
    }
}