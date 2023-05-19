import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { DefaultSettings, Settings } from "./settings";
import * as childProcess from "child_process";
import * as path from "path";
import { JsonInputDto } from "./jsonInputDto";
import { FormattingActionKind } from "./formattingActionKind";
import { ConsoleLogger } from "./logger";

export class Formatter {
    private extensionContext: vscode.ExtensionContext;
    private dllPath: string = "";

    public settings: Settings = DefaultSettings;
    constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        this.initialize();
        this.loadSettings();
    }

    private initialize() {
        try {

            let extPath: string = this.extensionContext.extensionPath;
            //extension path was not found
            if (extPath === "") {
                vscode.window.showErrorMessage('Error in finding extension path');
                ConsoleLogger.instance.info("Error in finding extension path. Throwing error from initialize");
                throw new Error('Error in finding extension path');
            }
            this.dllPath = path.join(this.extensionContext.extensionPath, "lib", "XmlFormatter.CommandLine.dll");

            ConsoleLogger.instance.info(`dllPath : ${this.dllPath}`);
        }
        catch (error) {
            ConsoleLogger.instance.error(error as Error);
            throw error;
        }
    }

    public loadSettings() {
        //get settings
        ConsoleLogger.instance.info("loadSettings start");
        let prettyXmlConfig = vscode.workspace.getConfiguration('prettyxml.settings');

        let spacelength = prettyXmlConfig.get<number>('indentSpaceLength');
        let usesinglequotes = prettyXmlConfig.get<boolean>('useSingleQuotes');
        let useselfclosetag = prettyXmlConfig.get<boolean>('useSelfClosingTag');
        let formatOnSave = prettyXmlConfig.get<boolean>('formatOnSave');
        let allowSingleQuoteInAttributeValue = prettyXmlConfig.get<boolean>('allowSingleQuoteInAttributeValue');
        let addSpaceBeforeSelfClosingTag = prettyXmlConfig.get<boolean>('addSpaceBeforeSelfClosingTag');
        let wrapCommentTextWithSpaces = prettyXmlConfig.get<boolean>('wrapCommentTextWithSpaces');
        let allowWhiteSpaceUnicodesInAttributeValues = prettyXmlConfig.get<boolean>('allowWhiteSpaceUnicodesInAttributeValues');
        let positionFirstAttributeOnSameLine = prettyXmlConfig.get<boolean>('positionFirstAttributeOnSameLine');
        let positionAllAttributesOnFirstLine = prettyXmlConfig.get<boolean>('positionAllAttributesOnFirstLine');
        let enableLogs = prettyXmlConfig.get<boolean>('enableLogs');

        this.settings = new Settings(spacelength,
            usesinglequotes,
            useselfclosetag,
            formatOnSave,
            allowSingleQuoteInAttributeValue,
            addSpaceBeforeSelfClosingTag,
            wrapCommentTextWithSpaces,
            allowWhiteSpaceUnicodesInAttributeValues,
            positionFirstAttributeOnSameLine,
            positionAllAttributesOnFirstLine,
            enableLogs);

        ConsoleLogger.instance.updateConfiguration(enableLogs);
        ConsoleLogger.instance.info("loadSettings end");
    }

    public async formatXml(docText: string = ""): Promise<string> {
        ConsoleLogger.instance.info("formatXml start");
        let formattedString: string = "";

        if (!docText) {
            ConsoleLogger.instance.info("docText is null. Fetching from DocumentHelper");
            docText = DocumentHelper.getDocumentText();
        }

        if (docText) {
            formattedString = await this.formatWithCommandLine(docText, FormattingActionKind.format);
            ConsoleLogger.instance.info(`Formatted text: ${formattedString}`);
            ConsoleLogger.instance.info("formatXml end");
            return formattedString;
        }
        else {
            ConsoleLogger.instance.info("Document text is not valid!. Throwing error from formatXml");
            throw new Error("Document text is not valid!");
        }
    }

    async minimizeXml(): Promise<string> {
        ConsoleLogger.instance.info("minimizeXml start");
        let minimizedXmlText: string = "";
        var docText = DocumentHelper.getDocumentText();
        if (docText) {
            minimizedXmlText = await this.formatWithCommandLine(docText, FormattingActionKind.minimize);
            ConsoleLogger.instance.info(`minimizedXmlText: ${minimizedXmlText}`);
            return minimizedXmlText;
        }
        else {
            ConsoleLogger.instance.info("Document text is invalid!. Throwing error from minimizeXml");
            throw new Error('Document text is invalid!');
        }
    }

    public async formatWithCommandLine(docText: string, actionKind: FormattingActionKind): Promise<string> {
        try {
            ConsoleLogger.instance.info("formatWithCommandLine start");
            var jsinput: JsonInputDto = new JsonInputDto(docText, actionKind, this.settings);
            var inputstr = JSON.stringify(jsinput);
            ConsoleLogger.instance.info(`converted input to json ${inputstr}`);
            const cli = childProcess.spawn('dotnet', [this.dllPath], { stdio: ['pipe'] });

            ConsoleLogger.instance.info(`Starting dotnet childProcess at ${this.dllPath} `);
            let stdOutData = "";
            let stdErrData = "";

            cli.stdout.setEncoding("utf8");
            cli.stdout.on("data", data => {
                stdOutData += data;
            });

            cli.stderr.setEncoding("utf8");
            cli.stderr.on("data", data => {
                stdErrData += data;
            });

            let promise = new Promise<string>((resolve, reject) => {
                cli.on("close", (exitCode: Number) => {
                    if (exitCode !== 0) {
                        ConsoleLogger.instance.info(`childProcess errored with exitCode ${ exitCode }`);
                        reject(stdErrData);
                    }
                    else {
                        ConsoleLogger.instance.info(`childProcess stdOutData:  ${ stdOutData }`);
                        resolve(stdOutData);
                    }
                });
            });

            cli.stdin.end(inputstr, "utf-8");
            return promise;
        }
        catch (error) {
            let err = error as Error;
            ConsoleLogger.instance.error(err);
            ConsoleLogger.instance.info("Error formatting with command line. Make sure you have dotnet 6+ installed and it is added to PATH.");
            throw new Error('Error formatting with command line. Make sure you have dotnet 6+ installed and it is added to PATH.');
        }
    }
}
