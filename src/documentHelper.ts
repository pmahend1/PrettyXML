/* eslint-disable @typescript-eslint/naming-convention */
// imports 
import * as vscode from "vscode";
import { DocumentFilter } from "./documentFilter";
import { Logger } from "./logger";



export class DocumentHelper {
    constructor() {

    }


    public static get Editor() {
        return vscode.window.activeTextEditor;
    }

    //get Range of the active document in editor
    public static getEditorRange(): vscode.Range {
        Logger.instance.info("getEditorRange start");
        if (this.Editor) {
            //get editor text
            let document = this.Editor.document;
            var start = new vscode.Position(0, 0);
            var lastButOne = document.lineAt(document.lineCount - 1);
            var end = new vscode.Position(document.lineCount, lastButOne.range.end.character);
            var ranger = new vscode.Range(start, end);
            Logger.instance.info("getEditorRange end");
            return ranger;
        }
        else {
            Logger.instance.warning("Editor null. Returning 0 range");
            Logger.instance.info("getEditorRange end");
            return new vscode.Range(0, 0, 0, 0);
        }
        
    }

    //get Range of a document
    public static getDocumentRange(document: vscode.TextDocument): vscode.Range {
        Logger.instance.info("getDocumentRange start");
        if (document) {
            var start = new vscode.Position(0, 0);
            var lastButOne = document.lineAt(document.lineCount - 1);
            var end = new vscode.Position(document.lineCount, lastButOne.range.end.character);
            var ranger = new vscode.Range(start, end);
            Logger.instance.info("getDocumentRange end");
            return ranger;
        }
        else {
            Logger.instance.warning("document null. Returning empty range");
            Logger.instance.info("getDocumentRange end");
            return new vscode.Range(0, 0, 0, 0);
        }
    }

    public static getDocumentText(): string {
        if (this.Editor) {
            return this.Editor.document.getText();
        }
        else {
            throw new Error("Editor not found!");
        }
    }

    public static replaceTextForRange(range: vscode.Range, newText: string) {
        Logger.instance.info("replaceTextForRange start");
        if (this.Editor) {
            this.Editor.edit(editBuilder => {
                editBuilder.replace(range, newText);
                Logger.instance.info("Editor.edit.editBuilder.replace...");
            });
        } else {
            Logger.instance.warning("Editor is null");
        }
        Logger.instance.info("replaceTextForRange end");
    }

    public static replaceDocumentText(newText: string) {
        Logger.instance.info("replaceDocumentText start");
        if (this.Editor) {
            var range = this.getEditorRange();
            this.Editor.edit(editBuilder => {
                editBuilder.replace(range, newText);
                Logger.instance.info("Editor.edit.editBuilder.replace...");
            });
        } else {
            Logger.instance.warning("Editor is null");
        }
        Logger.instance.info("replaceDocumentText end");
    }

    public static createLanguageDocumentFilters(language: string): vscode.DocumentFilter[] {
        var filters = [new DocumentFilter(language, 'file'), new DocumentFilter(language, 'untitled')];
        return filters;
    }
}