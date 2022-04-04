import { error } from "console";
import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { JSInputDTO } from "./jsinputdto";
import { DefaultSettings, Settings } from "./settings";
import * as childProcess from "child_process";
import * as path from "path";
import { JsonInputDto } from "./jsonInputDto";
import { FormattingActionKind } from "./formattingActionKind";

export class Formatter
{
    private extensionContext: vscode.ExtensionContext;
    private dllPath: string = "";

    private edge: any;

    private runWithCommandLine: boolean = false;

    public settings: Settings = DefaultSettings;
    constructor(context: vscode.ExtensionContext)
    {
        this.extensionContext = context;
        this.initialize();
        this.loadSettings();
    }

    private initialize()
    {
        try 
        {
            let extPath: string = this.extensionContext.extensionPath;
            //extension path was not found
            if (extPath === "")
            {
                vscode.window.showErrorMessage('Error in finding extension path');
                throw new Error('Error in finding extension path');
            }
            this.dllPath = path.join(extPath, '/lib/XmlFormatter.VSCode.dll');
            switch (process.platform)
            {
                //if Mac then use different binary
                case 'darwin':
                    this.edge = require('electron-edge-js-mac/lib/edge');
                    break;
                case 'linux':
                    // edge binaries not buildable
                    this.runWithCommandLine = true;
                    break;
                case 'win32':
                    this.edge = require('electron-edge-js/lib/edge');
                    break;
                default:
                    vscode.window.showWarningMessage(`${ process.platform } may be not be supported. If the extension doesnt work , please file a bug report.`);
                    this.edge = require('electron-edge-js/lib/edge');
                    break;
            }
        }
        catch (error)
        {
            var errorMessage = (error as Error)?.message;
            if (this.isElectronEdgeException(errorMessage))
            {
                this.runWithCommandLine = true;
            }
            else
            {
                throw error;
            }
        }
    }

    public loadSettings()
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

    public async formatXml(): Promise<string>
    {
        let formattedString: string = "";
        var docText = DocumentHelper.getDocumentText();

        if (docText)
        {
            if (this.runWithCommandLine)
            {
                formattedString = await this.formatWithCommandLine(docText, FormattingActionKind.format);
                return formattedString;
            }
            else
            {
                try
                {
                    //electron-edge-js function for C# DLL
                    var formatCSharp = this.edge.func({ assemblyFile: this.dllPath,
                                                        typeName: 'XmlFormatter.VSCode.PrettyXML',
                                                        methodName: 'Format' });

                    //DTO object for DLL
                    var jsinput: JSInputDTO = new JSInputDTO(docText,
                                                             this.settings.IndentLength,
                                                             this.settings.UseSingleQuotes,
                                                             this.settings.UseSelfClosingTags,
                                                             this.settings.AllowSingleQuoteInAttributeValue,
                                                             this.settings.AddSpaceBeforeSelfClosingTag,
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
                catch (exception)
                {
                    var errorMessage = (exception as Error)?.message;
                    if (this.isElectronEdgeException(errorMessage))
                    {
                        this.runWithCommandLine = true;
                        formattedString = await this.formatWithCommandLine(docText, FormattingActionKind.format);
                        return formattedString;
                    }
                    else
                    {
                        throw error;
                    }
                }

            }
        }
        else
        {
            throw new Error("Document text is not valid!");
        }
    }

    async minimizeXml(): Promise<string>
    {
        let minimizedXmlText: string = "";
        var docText = DocumentHelper.getDocumentText();
        if (docText)
        {
            if (this.runWithCommandLine)
            {
                minimizedXmlText = await this.formatWithCommandLine(docText, FormattingActionKind.minimize);
                return minimizedXmlText;
            }
            else
            {
                try
                {
                    //electron-edge-js function for C# DLL
                    var minimizeXmlCsharp = this.edge.func({ assemblyFile: this.dllPath,
                                                             typeName: 'XmlFormatter.VSCode.PrettyXML',
                                                             methodName: 'Minimize' });


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
                catch (error)
                {
                    var errorMessage = (error as Error)?.message;
                    if (this.isElectronEdgeException(errorMessage))
                    {
                        this.runWithCommandLine = true;
                        minimizedXmlText = await this.formatWithCommandLine(docText, FormattingActionKind.minimize);
                        return minimizedXmlText;
                    }
                    else
                    {
                        throw error;
                    }
                }

            }
        }
        else
        {
            throw new Error('Document text is invalid!');
        }
    }

    public async formatWithCommandLine(docText: string, actionKind: FormattingActionKind): Promise<string>
    {
        try
        {
            let dllPath = path.join(this.extensionContext.extensionPath, "lib", "XmlFormatter.CommadLine.dll");

            var jsinput: JsonInputDto = new JsonInputDto(docText, actionKind, this.settings);
            var inputstr = JSON.stringify(jsinput);

            const cli = childProcess.spawn('dotnet', [ dllPath ], { stdio: [ 'pipe' ] });

            let stdOutData = "";
            let stdErrData = "";

            cli.stdout.setEncoding("utf8");
            cli.stdout.on("data", data =>
            {
                stdOutData += data;
            });

            cli.stderr.setEncoding("utf8");
            cli.stderr.on("data", data =>
            {
                stdErrData += data;
            });

            let promise = new Promise<string>((resolve, reject) =>
            {
                cli.on("close", (exitCode: Number) =>
                {
                    if (exitCode !== 0)
                    {
                        reject(stdErrData);
                    }
                    else
                    {
                        resolve(stdOutData);
                    }
                });
            });

            cli.stdin.end(inputstr, "utf-8");
            return promise;
        }
        catch (error)
        {
            throw new Error('Error formatting with command line. Make sure you have dotnet 5+ installed and it is added to PATH.');
        }

    }

    private isElectronEdgeException(errorMessage: string): boolean
    {
        if (errorMessage)
        {
            errorMessage = errorMessage.toLocaleLowerCase();
            if (errorMessage.includes('edge module has not been pre-compiled for node.js') ||
                errorMessage.includes('edge module has not been pre-compiled for electron') ||
                (errorMessage.includes('module did not self-register') && errorMessage.includes('edge-js'))) 
            {
                return true;
            }
            else
            {
                vscode.window.showErrorMessage(errorMessage);
                console.error(error);
                return false;
            }
        }
        else
        {
            return false;
        }
    }
}
