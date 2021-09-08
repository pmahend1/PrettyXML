import { error } from "console";
import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { JSInputDTO } from "./jsinputdto";
import { DefaultSettings, Settings } from "./settings";

export class Formatter
{
    private extensionContext: vscode.ExtensionContext;
    private dllPath: string = "";

    private edge: any;

    public settings: Settings = DefaultSettings;
    constructor(context: vscode.ExtensionContext)
    {
        this.extensionContext = context;
        this.initialize();
        this.loadSettings();
    }

    private initialize()
    {
        let extPath: string = this.extensionContext.extensionPath;
        //extension path was not found
        if (extPath === "")
        {
            vscode.window.showErrorMessage('Error in finding extension path');
            throw new Error('Error in finding extension path');
        }
        this.dllPath = extPath + `//lib//XmlFormatter.VSCode.dll`;
        switch (process.platform)
        {
            //if Mac then use different binary
            case 'darwin':
                this.edge = require('electron-edge-js-mac/lib/edge');
                break;
            case 'win32':
            default:
                this.edge = require('electron-edge-js/lib/edge');
                break;
        }
    }

    private loadSettings()
    {
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

        this.settings = new Settings(spacelength,
                                     usesinglequotes,
                                     useselfclosetag,
                                     formatOnSave,
                                     allowSingleQuoteInAttributeValue,
                                     addSpaceBeforeSelfClosingTag,
                                     wrapCommentTextWithSpaces,
                                     allowWhiteSpaceUnicodesInAttributeValues);
    }

    async formatXml(): Promise<string>
    {
        try
        {
            this.loadSettings();
            
            var docText = DocumentHelper.getDocumentText();
            let formattedString: string = "";

            //format
            if (docText)
            {
                //electron-edge-js function for C# DLL
                var formatCSharp = this.edge.func({
                                                    assemblyFile: this.dllPath,
                                                    typeName: 'XmlFormatter.VSCode.PrettyXML',
                                                    methodName: 'Format'
                                                  });

                //DTO object for DLL
                var jsinput: JSInputDTO = new JSInputDTO(docText,
                                                         this.settings.IndentLength,
                                                         this.settings.UseSingleQuotes,
                                                         this.settings.UseSelfClosingTags,
                                                         this.settings.AllowSingleQuoteInAttributeValue,
                                                         this. settings.AddSpaceBeforeSelfClosingTag,
                                                         this.settings.WrapCommentTextWithSpaces,
                                                         this.settings.AllowWhiteSpaceUnicodesInAttributeValues);

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

    async minimizeXml(): Promise<string>
    {
        this.loadSettings();

        var docText = DocumentHelper.getDocumentText();
        if (docText)
        {
            //electron-edge-js function for C# DLL
            var minimizeXmlCsharp = this.edge.func({
                                                     assemblyFile: this.dllPath,
                                                     typeName: 'XmlFormatter.VSCode.PrettyXML',
                                                     methodName: 'Minimize',
                                                   });

            let minimizedXmlText: string = "";
            await minimizeXmlCsharp(docText, function (error: Error, result: any)
            {
                if (result)
                {
                    minimizedXmlText = result;
                }
                else if (error)
                {
                    vscode.window.showErrorMessage(error.message);
                    console.error(error);
                    throw error;
                }
            });
            return minimizedXmlText;
        }
        else
        {
            throw new Error('Document text is invalid!');
        }
    }
}