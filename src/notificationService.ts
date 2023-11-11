import * as vscode from "vscode";
import * as compareVersions from "compare-versions";
import { Logger } from "./logger";

export class NotificationService {
    private context: vscode.ExtensionContext;
    public readonly storageKeyPrefix: string;
    private readonly lastRatingPromptDateKey: string;

    private readonly versionKey: string;

    private readonly currentVersion: string;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.storageKeyPrefix = this.context.extension.id + ".";
        this.lastRatingPromptDateKey = `${this.storageKeyPrefix}lastRatingPromptDate`;
        this.versionKey = `${this.storageKeyPrefix}version`;
        this.currentVersion = this.context.extension.packageJSON.version;
    }

    private checkIfEligibleToShowUpdateNote(): boolean {
        Logger.instance.info("checkIfEligibleToShowUpdateNote start");
        let shouldDisplay: boolean = true;
        try {
            var lastVersionShown = this.context.globalState.get(this.versionKey) as string;

            if (lastVersionShown) {
                if (compareVersions.compare(this.currentVersion, lastVersionShown, '<=')) {
                    shouldDisplay = false;
                }
            }
        }
        catch (error) {
            Logger.instance.error(error as Error);
            console.error(error);
        }
        Logger.instance.info("checkIfEligibleToShowUpdateNote end");
        return shouldDisplay;
    }

    public async notifyWhatsNewInUpdateAsync(): Promise<void> {
        Logger.instance.info("notifyWhatsNewInUpdateAsync start");
        try {
            let shouldDisplay: boolean = this.checkIfEligibleToShowUpdateNote();
            if (shouldDisplay) {
                let notes: string = `Pretty XML updated to version ${this.currentVersion}.\n [See what's new](https://github.com/pmahend1/PrettyXML/blob/main/CHANGELOG.md)`;
                if (notes !== "") {
                    await vscode.window.showInformationMessage(notes);
                    this.context.globalState.update(this.versionKey, this.currentVersion);
                }
            }
        }
        catch (error) {
            Logger.instance.error(error as Error);
            console.error(error);
        }
        Logger.instance.info("notifyWhatsNewInUpdateAsync end");
    }

    public async promptForReviewAsync(): Promise<void> {
        Logger.instance.info("promptForReviewAsync start");
        try {
            let shouldDisplayPrompt = this.shouldOpenRatingPrompt();
            if (shouldDisplayPrompt) {
                var text = "Loving Pretty XML extension? Would you like to rate and review?";
                var selection = await vscode.window.showInformationMessage(text, "Sure", "Later", "Don't show again");
                if (selection) {
                    if (selection === "Sure") {
                        var appName = vscode.env.appName.toLowerCase();
                        let vsCodeReviewUri: vscode.Uri = vscode.Uri.parse("https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml&ssr=false#review-details");

                        if (appName.includes("codium")) {
                            var codiumReviewUri = vscode.Uri.parse("https://open-vsx.org/extension/PrateekMahendrakar/prettyxml/reviews");
                            vscode.env.openExternal(codiumReviewUri);
                        }
                        else {
                            vscode.env.openExternal(vsCodeReviewUri);
                        }
                        //cant check if they really reviewed
                        //remind them after 30 days
                        var plus30days = new Date();
                        plus30days.setDate(plus30days.getDate() + 30);

                        this.context.globalState.update(this.lastRatingPromptDateKey, plus30days);
                    }
                    else if (selection === "Later") {
                        this.context.globalState.update(this.lastRatingPromptDateKey, new Date());
                    }
                    else if (selection === "Don't show again") {
                        var oneYear = new Date();
                        oneYear.setDate(oneYear.getDate() + 365);

                        this.context.globalState.update(this.lastRatingPromptDateKey, oneYear);
                    }
                }
            }
        }
        catch (error) {
            Logger.instance.error(error as Error);
            console.error(error);
        }
        Logger.instance.info("promptForReviewAsync end");
    }

    private shouldOpenRatingPrompt(): boolean {
        Logger.instance.info("shouldOpenRatingPrompt start");
        var lastPromptDateJunk = this.context.globalState.get(this.lastRatingPromptDateKey) as Date;
        var minus15days = new Date();
        minus15days.setDate(minus15days.getDate() - 15);

        if (lastPromptDateJunk) {
            var lastPromptDate = new Date(lastPromptDateJunk.toString());
            Logger.instance.info("shouldOpenRatingPrompt end");
            return lastPromptDate < minus15days;
        }
        else {
            Logger.instance.info("shouldOpenRatingPrompt end");
            return true;
        }

    }

    public async handleReviewPromptAsync() {
        Logger.instance.info("handleReviewPromptAsync start");
        let lastUsedDateKey = `${this.storageKeyPrefix}.lastUsedDate`;
        let lastUsedDate = this.context.globalState.get(lastUsedDateKey) as Date;

        if (lastUsedDate) {
            var delayedLastDate = lastUsedDate;
            delayedLastDate.setHours(delayedLastDate.getHours() + 2);
            if (new Date() >= delayedLastDate) {
                await this.promptForReviewAsync();
            }
        }
        this.context.globalState.update(lastUsedDateKey, new Date());
        Logger.instance.info("handleReviewPromptAsync end");
    }
}