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
    constructor(context: vscode.ExtensionContext)
    {
        this.extensionContext = context;
    }

    async formatDocument(): Promise<string>
    {
        try
        {
            extPath = this.extensionContext.extensionPath;
            //extension path was not found
            if (extPath === "")
            {
                vscode.window.showErrorMessage('Error in finding extension path');
                throw new Error('Error in finding extension path');
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
            let prettyXmlConfig = vscode.workspace.getConfiguration('prettyxml.settings');

            let spacelength = prettyXmlConfig.get<number>('indentSpaceLength');
            let usesinglequotes = prettyXmlConfig.get<boolean>('useSingleQuotes');
            let useselfclosetag = prettyXmlConfig.get<boolean>('useSelfClosingTag');
            let formatOnSave = prettyXmlConfig.get<boolean>('formatOnSave');
            let allowSingleQuoteInAttributeValue = prettyXmlConfig.get<boolean>('allowSingleQuoteInAttributeValue');
            let addSpaceBeforeSelfClosingTag = prettyXmlConfig.get<boolean>('addSpaceBeforeSelfClosingTag');
            let wrapCommentTextWithSpaces = prettyXmlConfig.get<boolean>('wrapCommentTextWithSpaces');
            let allowWhiteSpaceUnicodesInAttributeValues = prettyXmlConfig.get<boolean>('allowWhiteSpaceUnicodesInAttributeValues');

            var settings = new Settings(spacelength,
                                        usesinglequotes,
                                        useselfclosetag,
                                        formatOnSave,
                                        allowSingleQuoteInAttributeValue,
                                        addSpaceBeforeSelfClosingTag,
                                        wrapCommentTextWithSpaces,
                                        allowWhiteSpaceUnicodesInAttributeValues);

            var docText = DocumentHelper.getDocumentText();
            let formattedString: string = "";

            //format
            if (docText)
            {
                //electron-edge-js function for C# DLL
                var formatCSharp = edge.func({assemblyFile: dllPath,
                                              typeName: 'XmlFormatter.VSCode.PrettyXML',
                                              methodName: 'Format'});

                //DTO object for DLL
                var jsinput: JSInputDTO = new JSInputDTO(docText,
                                                         settings.IndentLength,
                                                         settings.UseSingleQuotes,
                                                         settings.UseSelfClosingTags,
                                                         settings.AllowSingleQuoteInAttributeValue,
                                                         settings.AddSpaceBeforeSelfClosingTag,
                                                         settings.WrapCommentTextWithSpaces,
                                                         settings.AllowWhiteSpaceUnicodesInAttributeValues);

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
                        throw error;
                    }
                });
                return formattedString;
            }
            else
            {
                throw new Error("Document text is not valid!");
            }
        }
        catch (exception)
        {
            var errorMessage = (exception as Error)?.message;
            vscode.window.showErrorMessage(errorMessage);
            console.error(error);
            throw error;
        }
    }
}