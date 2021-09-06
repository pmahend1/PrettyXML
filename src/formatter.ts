import { error } from "console";
import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { JSInputDTO } from "./jsinputdto";
import { Settings } from "./settings";

// global variables
let extPath = "";
let dllPath = "";
let edge: any;

export class Formatter
{
    private extensionContext: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext,)
    {
        this.extensionContext = context;
    }

    async formatDocument()
    {
        try
        {
            extPath = this.extensionContext.extensionPath;
            //extension path was not found
            if (extPath === "")
            {
                vscode.window.showErrorMessage('Error in finding extension path');
                throw error();
            }
            dllPath = extPath + `//lib//XmlFormatter.VSCode.dll`;
            switch (process.platform)
            {
                //if Mac then use different binary
                case 'darwin':
                    edge = require('electron-edge-js-mac/lib/edge');
                    break;
                default:
                    edge = require('electron-edge-js/lib/edge');
                    break;
            }

            //get settings
            let spacelength = vscode.workspace.getConfiguration('prettyxml.settings').get<number>('indentSpaceLength');
            let usesinglequotes = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('useSingleQuotes');
            let useselfclosetag = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('useSelfClosingTag');
            let formatOnSave = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('formatOnSave');
            let allowSingleQuoteInAttributeValue = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('allowSingleQuoteInAttributeValue');
            let addSpaceBeforeSelfClosingTag = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('addSpaceBeforeSelfClosingTag');
            let wrapCommentTextWithSpaces = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('wrapCommentTextWithSpaces');
            let allowWhiteSpaceUnicodesInAttributeValues = vscode.workspace.getConfiguration('prettyxml.settings').get<boolean>('allowWhiteSpaceUnicodesInAttributeValues');

            var settings = new Settings(spacelength,
                usesinglequotes,
                useselfclosetag,
                formatOnSave,
                allowSingleQuoteInAttributeValue,
                addSpaceBeforeSelfClosingTag,
                wrapCommentTextWithSpaces,
                allowWhiteSpaceUnicodesInAttributeValues);

            var docText = vscode?.window.activeTextEditor?.document?.getText();
            let formattedString: string = "";
            //format
            if (docText)
            {
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
                    settings.UseSelfClosingTags,
                    settings.AllowSingleQuoteInAttributeValue,
                    settings.AddSpaceBeforeSelfClosingTag,
                    settings.WrapCommentTextWithSpaces,
                    settings.AllowWhiteSpaceUnicodesInAttributeValues
                );

                var inputstr = JSON.stringify(jsinput);


               
                //call C# method from DLL
                await formatCSharp(inputstr, function (error: any, result: any)
                {
                    if (result)
                    {
                        formattedString = result + "";
                    }
                    else if (error)
                    {
                        vscode.window.showErrorMessage(error.message);
                        console.error(error);
                    }

                });
                return formattedString;

            }
            return formattedString;

        }
        catch (error)
        {
            vscode.window.showErrorMessage(error.message);
            console.error(error);
            return "";
        }

    }
}