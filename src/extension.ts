// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "prettyxml" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('prettyxml.helloWorld', () =>
	{
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from PrettyXML!');
		format();
	});

	context.subscriptions.push(disposable);
}

function format()
{

	try
	{
		var edge_ = require('electron-edge-js/lib/edge');
var formatCSharp = edge_.func({
		assemblyFile: 'XmlFormatter.dll',
		typeName: 'XmlFormatter.Formatter',
		methodName: 'Format' 
	});

	var text =  String.raw`<note>
	<to>Tove</to>
	<from>Jani</from>
	<heading>Reminder</heading>
	<body>Don't forget me this weekend!</body>
	</note>`;
	formatCSharp(text, function (error:any, result:any) { 

		console.log(result);

	 });
	} catch (error)
	{
		console.log(error);
	}

	
}
// this method is called when your extension is deactivated
export function deactivate() { }
