import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { Formatter } from "./formatter";
import { PrettyXmlFormattingEditProvider } from "./prettyXmlFormattingEditProvider";
import { NotificationService } from "./notificationService";
import { replaceDocumentTextWithProgressForCallback } from "./helper";
import { Logger } from "./logger";

let formatter: Formatter;
let notificationService: NotificationService;
export const prettyxml = "prettyxml";

//extension activate
export function activate(context: vscode.ExtensionContext): void {
	try {

		formatter = new Formatter(context);
		notificationService = new NotificationService(context);

		notificationService.notifyWhatsNewInUpdateAsync();
		notificationService.handleReviewPromptAsync();

		vscode.workspace.onDidChangeConfiguration((configChangeEvent: vscode.ConfigurationChangeEvent) => {
			Logger.instance.info("workspace.onDidChangeConfiguration start");
			formatter.loadSettings();
			Logger.instance.info("workspace.onDidChangeConfiguration end");
		});

		let prettifyXmlCommand = vscode.commands.registerTextEditorCommand(`${prettyxml}.prettifyxml`, () => replaceDocumentTextWithProgressForCallback("Formatting...", formatter.formatXml()));

		let minimizeXmlCommand = vscode.commands.registerTextEditorCommand(`${prettyxml}.minimizexml`, () => replaceDocumentTextWithProgressForCallback("Minimizing...", formatter.minimizeXml()));

		vscode.workspace.onWillSaveTextDocument(async (willSaveEvent) => {
			Logger.instance.info("vscode.workspace.onWillSaveTextDocument start");
			try {
				var languageId = willSaveEvent?.document?.languageId;
				if (languageId) {
					if (languageId === "xml" || languageId === "xsd" || languageId === "xaml") {
						let prettyXmlConfig = vscode.workspace.getConfiguration(`${prettyxml}.settings`);
						let formatOnSave = prettyXmlConfig.get<boolean>("formatOnSave") ?? false;
						if (formatOnSave) {
							willSaveEvent.waitUntil(replaceDocumentTextWithProgressForCallback("Formatting...", formatter.formatXml()));
						}
					}
				}
				else {
					Logger.instance.warning("Invalid languageId");
				}
			}
			catch (error) {
				if (error instanceof Error) {
					Logger.instance.error(error);
					vscode.window.showErrorMessage(error.message);
					console.error(error);
				}
			}
			Logger.instance.info("vscode.workspace.onWillSaveTextDocument end");
		});

		const xmlXsdDocSelector = [
			...DocumentHelper.createLanguageDocumentFilters("xml"),
			...DocumentHelper.createLanguageDocumentFilters("xsd"),
			...DocumentHelper.createLanguageDocumentFilters("xaml"),
		];
		const xmlFormattingEditProvider = new PrettyXmlFormattingEditProvider(formatter);

		let languageProvider = vscode.languages.registerDocumentFormattingEditProvider(xmlXsdDocSelector, xmlFormattingEditProvider);

		//subscribe commands
		context.subscriptions.push(prettifyXmlCommand,
			minimizeXmlCommand,
			languageProvider);
	}
	catch (error) {
		if (error instanceof Error) {
			vscode.window.showErrorMessage(error.message);
			Logger.instance.error(error);
		}
		else if (typeof error === "string") {
			vscode.window.showErrorMessage(error);
			Logger.instance.warning(error);
		}
		console.error(error);
	}
}

//extension deactivate
export function deactivate() {
	Logger.instance.info("Extension dectivated");
}
