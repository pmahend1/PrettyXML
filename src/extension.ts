/* eslint-disable @typescript-eslint/naming-convention */
// imports
import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { Formatter } from "./formatter";
import { PrettyXmlFormattingEditProvider } from "./prettyXmlFormattingEditProvider";
import { NotificationService } from "./notificationService";
import { replaceDocumentTextWithProgressForCallback } from "./helper";
import { ConsoleLogger } from "./logger";

let formatter: Formatter;
let notificationService: NotificationService;

//extension activate
export function activate(context: vscode.ExtensionContext): void {
	try {

		formatter = new Formatter(context);
		notificationService = new NotificationService(context);

		notificationService.notifyWhatsNewInUpdateAsync();
		notificationService.promptForReviewAsync();

		vscode.workspace.onDidChangeConfiguration((configChangeEvent: vscode.ConfigurationChangeEvent) => {
			ConsoleLogger.instance.info("workspace.onDidChangeConfiguration start");
			formatter.loadSettings();
			ConsoleLogger.instance.info("workspace.onDidChangeConfiguration end");
		});

		let prettifyXmlCommand = vscode.commands.registerTextEditorCommand("prettyxml.prettifyxml", () => replaceDocumentTextWithProgressForCallback("Formatting...", formatter.formatXml()));

		let minimizeXmlCommand = vscode.commands.registerTextEditorCommand("prettyxml.minimizexml", () => replaceDocumentTextWithProgressForCallback("Minimizing...", formatter.minimizeXml()));


		vscode.workspace.onWillSaveTextDocument(async (willSaveEvent) => {
			ConsoleLogger.instance.info("vscode.workspace.onWillSaveTextDocument start");
			try {
				var languageId = willSaveEvent?.document?.languageId;
				if (languageId) {
					if (languageId === "xml" || languageId === "xsd") {
						let prettyXmlConfig = vscode.workspace.getConfiguration("prettyxml.settings");
						let formatOnSave = prettyXmlConfig.get<boolean>("formatOnSave") ?? false;
						if (formatOnSave) {
							willSaveEvent.waitUntil(replaceDocumentTextWithProgressForCallback("Formatting...", formatter.formatXml()));
						}
					}
				}
				else {
					ConsoleLogger.instance.warning("Invalid languageId");
				}
			}
			catch (exception) {
				let errorMessage = (exception as Error)?.message;
				ConsoleLogger.instance.error(exception as Error);
				vscode.window.showErrorMessage(errorMessage);
				console.error(exception);
			}
			ConsoleLogger.instance.info("vscode.workspace.onWillSaveTextDocument end");
		});

		const xmlXsdDocSelector = [
			...DocumentHelper.createLanguageDocumentFilters("xml"),
			...DocumentHelper.createLanguageDocumentFilters("xsd"),
		];
		const xmlFormattingEditProvider = new PrettyXmlFormattingEditProvider(formatter);

		let languageProvider = vscode.languages.registerDocumentFormattingEditProvider(xmlXsdDocSelector, xmlFormattingEditProvider);

		//subscribe commands
		context.subscriptions.push(prettifyXmlCommand,
			minimizeXmlCommand,
			languageProvider);
	}
	catch (exception) {
		let errorMessage = (exception as Error)?.message;
		vscode.window.showErrorMessage(errorMessage);
		ConsoleLogger.instance.error(exception as Error);
		console.error(exception);
	}
}

//extension deactivate
export function deactivate() {
	ConsoleLogger.instance.info("Extension dectivated");
 }