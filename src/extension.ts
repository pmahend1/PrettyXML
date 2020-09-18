/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { JSInputDTO } from "./jsinputdto";
import { DefaultSettings, Settings } from "./settings";

let extPath = "";
export function activate(context: vscode.ExtensionContext)
{
	try
	{
		let prettifyXmlCommand = vscode.commands.registerTextEditorCommand("prettyxml.prettifyxml",
			async () =>
			{
				extPath = context.extensionPath;
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "Pretty XML",
						cancellable: false
					},
					async (progress) =>
					{
						progress.report({ message: "Formatting..." });
						try
						{
							await format();
						} catch (error)
						{
							console.error(error);
							vscode.window.showErrorMessage(error.message);
						}
					});
			});
		context.subscriptions.push(prettifyXmlCommand);

	} catch (error)
	{
		vscode.window.showErrorMessage(error.message);
		console.log(error);
	}
}

async function format()
{
	//extension path was not found
	if (extPath === "")
	{
		vscode.window.showErrorMessage('Error in finding extension path');
		return;
	}
	var dllPath = extPath + `/lib/XmlFormatter.VSCode.dll`;
	try
	{
		let editor = vscode.window.activeTextEditor;
		if (editor)
		{
			//get editor text
			let document = editor.document;
			var start = new vscode.Position(0, 0);
			var lastButOne = document.lineAt(document.lineCount - 1);
			var end = new vscode.Position(document.lineCount, lastButOne.range.end.character);
			var ranger = new vscode.Range(start, end);
			var docText = document.getText();

			//get settings
			let spacelength = vscode.workspace.getConfiguration('prettyxml.settings').get<number>('indentSpaceLength');
			let usesinglequotes = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('useSingleQuotes') ;
			let useselfclosetag = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('useSelfClosingTag') ;

			var settings = new Settings(spacelength, usesinglequotes, useselfclosetag);

			//format
			if (docText)
			{
				switch (process.platform)
				{
					//if Mac then use different binary
					case 'darwin':
						var edge = require('electron-edge-js-mac/lib/edge');
						break;
					default:
						var edge = require('electron-edge-js/lib/edge');
						break;
				}

				//electron-edge-js function for C# DLL
				var formatCSharp = edge.func({
					assemblyFile: dllPath,
					typeName: 'XmlFormatter.VSCode.PrettyXML',
					methodName: 'Format',
				});

				//DTO object for DLL
				var jsinput: JSInputDTO = new JSInputDTO(
					docText,
					settings.IndentLength,
					settings.UseSingleQuotes,
					settings.UseSelfClosingTags
				);

				//convert to string
				var inputstr = JSON.stringify(jsinput);

				//call C# method from DLL
				await formatCSharp(inputstr, function (error: any, result: any)
				{
					if (result)
					{
						editor?.edit(editBuilder =>
						{
							editBuilder.replace(ranger, result + "");
						});
						console.log("Document formatted!");

					} else if (error)
					{
						vscode.window.showErrorMessage(error.message);
						console.error(error);
					}

				});
			}
		}
	} catch (error)
	{
		vscode.window.showErrorMessage(error.message);
		console.error(error);
	}
}
export function deactivate() { }
