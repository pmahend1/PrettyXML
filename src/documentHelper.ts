/* eslint-disable @typescript-eslint/naming-convention */
// imports 
import * as vscode from "vscode";
export class DocumentHelper
{
    constructor()
    {

    }


    public static get Editor()
    {
        return vscode.window.activeTextEditor;
    }

    //get Range of the active document
    public static getEditorRange(): vscode.Range
    {
        if (this.Editor)
        {
            //get editor text
            let document = this.Editor.document;
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
        if (this.Editor)
        {
            return this.Editor.document.getText();
        }
        else
        {
            throw new Error("Editor not found!");
        }
    }

    public static replaceTextForRange(range: vscode.Range, newText: string)
    {
        if (this.Editor)
        {
            this.Editor.edit(editBuilder =>
            {
                editBuilder.replace(range, newText);
            });
        }
    }

    public static replaceDocumentText(newText: string)
    {
        if (this.Editor)
        {
            var range = this.getEditorRange();
            this.Editor.edit(editBuilder =>
            {
                editBuilder.replace(range, newText);
            });
        }
    }
}