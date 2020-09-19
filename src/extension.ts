/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { JSInputDTO } from "./jsinputdto";
import { DefaultSettings, Settings } from "./settings";

let extPath = "";
let dllPath = "";
export function activate(context: vscode.ExtensionContext)
{
	try
	{
		extPath = context.extensionPath;
		//extension path was not found
		if (extPath === "")
		{
			vscode.window.showErrorMessage('Error in finding extension path');
			return;
		}
		dllPath = extPath + `//lib//XmlFormatter.VSCode.dll`;
		let prettifyXmlCommand = vscode.commands.registerTextEditorCommand("prettyxml.prettifyxml",
			async () =>
			{
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "Pretty XML",
						cancellable: false
					},
					async (progress) =>
					{
						progress.report({ message: "Formatting..." });

						await format();
					});
			});

		let minimizeXmlCommand = vscode.commands.registerTextEditorCommand("prettyxml.minimizexml",
			async () => {
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "Pretty XML",
						cancellable: false
					},async (progress) =>
					{
						progress.report({ message: "Formatting..." });

						await minimizeXml();
					});
				

			});

		context.subscriptions.push( minimizeXmlCommand);

	} catch (error)
	{
		vscode.window.showErrorMessage(error.message);
		console.log(error);
	}
}

async function format()
{

	try
	{



		//get settings
		let spacelength = vscode.workspace.getConfiguration('prettyxml.settings').get<number>('indentSpaceLength');
		let usesinglequotes = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('useSingleQuotes');
		let useselfclosetag = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('useSelfClosingTag');

		var settings = new Settings(spacelength, usesinglequotes, useselfclosetag);

		var docText = vscode?.window?.activeTextEditor?.document?.getText();
		var ranger = getEditorRange();
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
			var editor = vscode.window.activeTextEditor;
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

	} catch (error)
	{
		vscode.window.showErrorMessage(error.message);
		console.error(error);
	}
}

async function minimizeXml()
{
	var docText = vscode.window.activeTextEditor?.document.getText();
	var editor = vscode.window.activeTextEditor;
	var ranger = getEditorRange();
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
		var minimizeXmlCsharp = edge.func({
			assemblyFile: dllPath,
			typeName: 'XmlFormatter.VSCode.PrettyXML',
			methodName: 'MinimizeXml',
		});

		await minimizeXmlCsharp(docText, function (error: Error, result: any)
		{
			if (result)
			{
				editor?.edit(editBuilder =>
				{
					editBuilder.replace(ranger, result + "");
				});
				console.log("Document minimized!");
			} else if (error)
			{
				vscode.window.showErrorMessage(error.message);
				console.error(error);
			}
		});
	}

}


function getEditorRange()
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
		return ranger;
	} else
	{
		return new vscode.Range(0, 0, 0, 0);
	}
}
export function deactivate() { }
