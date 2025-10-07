import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { Formatter } from "./formatter";
import { PrettyXmlFormattingEditProvider } from "./prettyXmlFormattingEditProvider";
import { NotificationService } from "./notificationService";
import { replaceDocumentTextWithProgressForCallback } from "./helper";
import { Logger } from "./logger";
import { RangeFormatterProvider } from "./rangeFormatterProvider";
import { Constants } from "./constants";

let formatter: Formatter;
let notificationService: NotificationService;

//extension activate
export function activate(context: vscode.ExtensionContext): void {
	try {

		formatter = new Formatter(context);
		notificationService = new NotificationService(context);
		Logger.instance.setDebug(context.extensionMode === vscode.ExtensionMode.Development);

		notificationService.notifyWhatsNewInUpdateAsync();
		notificationService.handleReviewPromptAsync();

		vscode.workspace.onDidChangeConfiguration((configChangeEvent: vscode.ConfigurationChangeEvent) => {
			Logger.instance.info("workspace.onDidChangeConfiguration start");
			formatter.loadSettings();
			Logger.instance.info("workspace.onDidChangeConfiguration end");
		});

		let prettifyXmlCommand = vscode.commands.registerTextEditorCommand(Constants.Commands.prettifyxml, () => replaceDocumentTextWithProgressForCallback("Formatting...", formatter.formatXml()));

		let minimizeXmlCommand = vscode.commands.registerTextEditorCommand(Constants.Commands.minimize, () => replaceDocumentTextWithProgressForCallback("Minimizing...", formatter.minimizeXml()));

		vscode.workspace.onWillSaveTextDocument(async (willSaveEvent) => {
			Logger.instance.info("vscode.workspace.onWillSaveTextDocument start");
			try {
				if (!formatter.settings.formatOnSave) {
					return;
				}
				var languageId = willSaveEvent?.document?.languageId;
				if (languageId) {
					let shouldFormatOnSave = isDefaultFormatter(languageId);
					if (shouldFormatOnSave) {
						willSaveEvent.waitUntil(replaceDocumentTextWithProgressForCallback("Formatting...", formatter.formatXml()));
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

		const languageIdSelector = [
			...DocumentHelper.createLanguageDocumentFilters(Constants.LanguageIDs.xml),
			...DocumentHelper.createLanguageDocumentFilters(Constants.LanguageIDs.xsd),
			...DocumentHelper.createLanguageDocumentFilters(Constants.LanguageIDs.xaml),
			...DocumentHelper.createLanguageDocumentFilters(Constants.LanguageIDs.xsl),
			...DocumentHelper.createLanguageDocumentFilters(Constants.LanguageIDs.xslt)
		];
		const xmlFormattingEditProvider = new PrettyXmlFormattingEditProvider(formatter);

		let documentFormatterProvider = vscode.languages.registerDocumentFormattingEditProvider(languageIdSelector, xmlFormattingEditProvider);

		const rangeFormatterProvider = new RangeFormatterProvider(formatter.settings);
		const selectionFormatter = vscode.languages.registerDocumentRangeFormattingEditProvider(languageIdSelector, rangeFormatterProvider);

		//subscribe commands
		context.subscriptions.push(prettifyXmlCommand,
			minimizeXmlCommand,
			documentFormatterProvider,
			selectionFormatter);
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

function isDefaultFormatter(languageID: string): boolean {
	try {
		const languageSettings = vscode.workspace.getConfiguration(`[${languageID}]`) as any;
		const defaultFormatter = languageSettings[Constants.defaultEditor];
		return defaultFormatter === Constants.id;
	} catch (error) {
		return false;
	}
}

//extension deactivate
export function deactivate() {
	Logger.instance.info("Extension dectivated");
}
