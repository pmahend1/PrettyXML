/* eslint-disable @typescript-eslint/naming-convention */
// imports 
import * as vscode from "vscode";
export class DocumentHelper
{
    constructor()
    {

    }

    //get Range of the active document
    public static getEditorRange(): vscode.Range
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
        }
        else
        {
            return new vscode.Range(0, 0, 0, 0);
        }
    }

    public static getDocumentText(): string
    {
        let editor = vscode.window.activeTextEditor;
        if(editor)
        {
            return editor.document.getText();
        }
        else
        {
            throw new Error("Editor not found!");
        }
    }
}