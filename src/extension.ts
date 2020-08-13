// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//console.log('Congratulations, your extension "prettyxml" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerTextEditorCommand('prettyxml.prettifyxml', () =>
	{
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		//vscode.window.showInformationMessage('Hello World from PrettyXML!');
			format();
			
	});

	context.subscriptions.push(disposable);
}

function format()
{

	var cwd = vscode.env.appRoot;
	var dllPath = cwd+String.raw`/extensions/prettyxml/dist/XmlFormatter.dll`;
	try
	{
		let editor = vscode.window.activeTextEditor;
		if (editor)
		{
			let document = editor.document;

			var start = new vscode.Position(0, 0);
			var end = new vscode.Position(document.lineCount, 100);

			var ranger = new vscode.Range(start, end);

			var docText = document.getText();
			if (docText)
			{
				var edge_ = require('electron-edge-js/lib/edge');
				var formatCSharp = edge_.func({
					assemblyFile: dllPath,
					typeName: 'XmlFormatter.Formatter',
					methodName: 'Format'
				});

				formatCSharp(docText, function (error: any, result: any)
				{

					console.log(result);

					if (result)
					{
						editor?.edit(editBuilder =>
						{
							editBuilder.replace(ranger, result + "");
						});
					}

				});
			}
			

		}
	} catch (error)
	{
		console.log(error);
	}


}
// this method is called when your extension is deactivated
export function deactivate() { }
