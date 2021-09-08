/* eslint-disable @typescript-eslint/naming-convention */
// imports 
import * as vscode from "vscode";
import * as fs from "fs";
import { DocumentHelper } from "./documentHelper";
import { Formatter } from "./formatter";
import { LocalStorage } from "./localstorage";
import { PrettyXmlFormattingEditProvider } from "./prettyXmlFormattingEditProvider";
let formatter: Formatter;
let localStorage : LocalStorage;

//extension activate
export function activate(context: vscode.ExtensionContext)
{
	try
	{
		formatter = new Formatter(context);
		localStorage = new LocalStorage();
		localStorage.hasShownUpdateNotification = false;
		//prettify command definition
		var progressOptions = { 
								location: vscode.ProgressLocation.Notification,
								title: "Pretty XML",
								cancellable: false
							  };
									

		try 
		{
			var localStorageJson = fs.readFileSync('prettXmlData.json', {encoding : 'utf8'});
			if(localStorageJson)
			{
				localStorage = JSON.parse(localStorageJson);
			}
		} 
		catch (error) 
		{
			localStorage = new LocalStorage();
			localStorage.hasShownUpdateNotification = false;
			try 
			{
				let fileText :string = JSON.stringify(localStorage);
				fs.writeFileSync("prettXmlData.json", fileText);
			} 
			catch (error) 
			{
				
			}

		}
		

		if(localStorage.hasShownUpdateNotification === false)
		{
			vscode.window.showInformationMessage('Now you can use Pretty XML as default document formatter.\nSet Pretty XML as default XML formatter and use press formatting keybinds');
			localStorage.hasShownUpdateNotification = true;

			try
			{
				let fileText :string = JSON.stringify(localStorage);
				fs.writeFileSync("prettXmlData.json", fileText);
			} 
			catch (error) 
			{
				
			}
		}
		
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
			let prettyXmlConfig = vscode.workspace.getConfiguration('prettyxml.settings');
			let formatOnSave = prettyXmlConfig.get<boolean>('formatOnSave') ?? false;
			if(formatOnSave)
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
