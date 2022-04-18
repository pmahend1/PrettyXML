import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
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
            this.dllPath = path.join(this.extensionContext.extensionPath, "lib", "XmlFormatter.CommadLine.dll");
        }
        catch (error)
        {
            var errorMessage = (error as Error)?.message;
            throw error;
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
            formattedString = await this.formatWithCommandLine(docText, FormattingActionKind.format);
            return formattedString;
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
            minimizedXmlText = await this.formatWithCommandLine(docText, FormattingActionKind.minimize);
            return minimizedXmlText;
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
            var jsinput: JsonInputDto = new JsonInputDto(docText, actionKind, this.settings);
            var inputstr = JSON.stringify(jsinput);

            const cli = childProcess.spawn('dotnet', [ this.dllPath ], { stdio: [ 'pipe' ] });

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
}
