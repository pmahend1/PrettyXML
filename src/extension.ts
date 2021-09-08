/* eslint-disable @typescript-eslint/naming-convention */
// imports 
import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { Formatter } from "./formatter";
import { PrettyXmlFormattingEditProvider } from "./prettyXmlFormattingEditProvider";

// global variables
let formatter: Formatter;

//extension activate
export function activate(context: vscode.ExtensionContext)
{
	try
	{
		formatter = new Formatter(context);

		//prettify command definition
		var progressOptions = { 
								location: vscode.ProgressLocation.Notification,
								title: "Pretty XML",
								cancellable: false
							  };

		let prettifyXmlCommand = vscode.commands.registerTextEditorCommand("prettyxml.prettifyxml" ,
			() =>
			{
				vscode.window.withProgress(progressOptions,async (progress) => 
				{
					progress.report({ message: "Formatting..." });
					var formattedText = await formatter.formatXml();
					DocumentHelper.replaceDocumentText(formattedText);
				});
			});

		let minimizeXmlCommand = vscode.commands.registerTextEditorCommand("prettyxml.minimizexml",
			() =>
			{
				vscode.window.withProgress(progressOptions, async (progress) =>
				{
					progress.report({ message: "Minimizing..." });
					var minimizedText = await formatter.minimizeXml();
					DocumentHelper.replaceDocumentText(minimizedText);
				});
			});

		vscode.workspace.onDidSaveTextDocument(async () => 
		{ 
			if(formatter.settings.FormatOnSave)
			{
				var formattedText = await formatter.formatXml();
				DocumentHelper.replaceDocumentText(formattedText);
			}
		});

		const xmlXsdDocSelector = [ ...DocumentHelper.createLanguageDocumentFilters("xml"), ...DocumentHelper.createLanguageDocumentFilters("xsd") ];
		const xmlFormattingEditProvider = new PrettyXmlFormattingEditProvider(formatter);
		let languageProvider = vscode.languages.registerDocumentFormattingEditProvider(xmlXsdDocSelector, xmlFormattingEditProvider);

		//subscribe commands
		context.subscriptions.push(prettifyXmlCommand, minimizeXmlCommand, languageProvider);
	}
	catch (exception)
	{
		let errorMessage = (exception as Error)?.message;
		vscode.window.showErrorMessage(errorMessage);
		console.log(exception);
	}
}


//extension deactivate
export function deactivate() 
{

}
