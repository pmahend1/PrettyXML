/* eslint-disable @typescript-eslint/naming-convention */
// imports
import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { Formatter } from "./formatter";
import { PrettyXmlFormattingEditProvider } from "./prettyXmlFormattingEditProvider";
import { NotificationService } from "./notificationService";

let formatter: Formatter;
let notificationService: NotificationService;

//extension activate
export function activate(context: vscode.ExtensionContext)
{
	try
	{
		formatter = new Formatter(context);
		notificationService = new NotificationService(context);

		var progressOptions = {
			location: vscode.ProgressLocation.Notification,
			title: "Pretty XML",
			cancellable: false,
		};


		notificationService.notifyWhatsNewInUpdate();

		let prettifyXmlCommand = vscode.commands.registerTextEditorCommand("prettyxml.prettifyxml",
			() => vscode.window.withProgress(progressOptions, (progress, token) =>
			{
				var promise = new Promise<string>((resolve) =>
				{
					progress.report({ message: "Formatting...", increment: 0 });

					setTimeout(() =>
					{
						progress.report({ message: "Formatting...", increment: 25 });

					}, 100);

					setTimeout(async () =>
					{
						var formattedText = await formatter.formatXml();
						progress.report({ message: "Formatting...", increment: 75 });
						resolve(formattedText);

						DocumentHelper.replaceDocumentText(formattedText);
						progress.report({ message: "Formatting...", increment: 100 });

					}, 250);
				});

				return promise;
			}));

		let minimizeXmlCommand = vscode.commands.registerTextEditorCommand("prettyxml.minimizexml",
			() => vscode.window.withProgress(progressOptions, (progress) =>
			{
				var promise = new Promise<string>((resolve) =>
				{
					progress.report({ message: "Minimizing...", increment: 0 });

					setTimeout(() =>
					{
						progress.report({ message: "Minimizing...", increment: 25 });
					}, 100);

					setTimeout(async () =>
					{
						var minimizedText = await formatter.minimizeXml();
						progress.report({ message: "Minimizing...", increment: 75 });
						resolve(minimizedText);

						DocumentHelper.replaceDocumentText(minimizedText);
						progress.report({ message: "Minimizing...", increment: 100 });
					}, 250);
				});

				return promise;
			}));


		vscode.workspace.onDidSaveTextDocument(async () =>
		{
			let prettyXmlConfig = vscode.workspace.getConfiguration("prettyxml.settings");
			let formatOnSave = prettyXmlConfig.get<boolean>("formatOnSave") ?? false;
			if (formatOnSave)
			{
				var formattedText = await formatter.formatXml();
				DocumentHelper.replaceDocumentText(formattedText);
			}
		});

		const xmlXsdDocSelector = [
			...DocumentHelper.createLanguageDocumentFilters("xml"),
			...DocumentHelper.createLanguageDocumentFilters("xsd"),
		];
		const xmlFormattingEditProvider = new PrettyXmlFormattingEditProvider(formatter);

		let languageProvider = vscode.languages.registerDocumentFormattingEditProvider(xmlXsdDocSelector, xmlFormattingEditProvider);

		//subscribe commands
		context.subscriptions.push(
			prettifyXmlCommand,
			minimizeXmlCommand,
			languageProvider
		);
	}
	catch (exception)
	{
		let errorMessage = (exception as Error)?.message;
		vscode.window.showErrorMessage(errorMessage);
		console.error(exception);
	}
}
