import * as vscode from "vscode";
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
						await format();
					});
			});
		context.subscriptions.push(prettifyXmlCommand);

	} catch (error)
	{
		vscode.window.showErrorMessage(error);
		console.log(error);
	}
}

async function format()
{
	if (extPath === "")
	{
		vscode.window.showErrorMessage('Error in finding extension path');
		return;
	}
	var dllPath = extPath + `/lib/XmlFormatter.dll`;
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

			//format
			if (docText)
			{
				var edge = require('electron-edge-js/lib/edge');
				var formatCSharp = edge.func({
					assemblyFile: dllPath,
					typeName: 'XmlFormatter.Formatter',
					methodName: 'Format'
				});

				await formatCSharp(docText, function (error: any, result: any)
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
						vscode.window.showErrorMessage(error);
						console.error(error);
					}

				});
			}
		}
	} catch (error)
	{
		vscode.window.showErrorMessage(error);
		console.error(error);
	}
}
export function deactivate() { }
