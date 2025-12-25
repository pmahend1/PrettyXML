import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { defaultSettings, Settings } from "./settings";
import * as childProcess from "child_process";
import * as path from "path";
import { JsonInputDto } from "./jsonInputDto";
import { FormattingActionKind } from "./formattingActionKind";
import { Logger } from "./logger";
import { Constants } from "./constants";

export class Formatter {
    private extensionContext: vscode.ExtensionContext;
    private dllPath: string = "";

    public settings: Settings = defaultSettings;
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
                Logger.instance.warning("Error in finding extension path. Throwing error from initialize");
                throw new Error('Error in finding extension path');
            }
            this.dllPath = path.join(this.extensionContext.extensionPath, "lib", "XmlFormatter.CommandLine.dll");

            Logger.instance.info(`dllPath : ${this.dllPath}`);
        }
        catch (error) {
            if (error instanceof Error) {
                Logger.instance.error(error);
                throw error;
            }
        }
    }

    public loadSettings() {
        //get settings
        Logger.instance.info("loadSettings start");
        let prettyXmlConfig = vscode.workspace.getConfiguration(`${Constants.prettyxml}.${Constants.settings}`);

        let spacelength = prettyXmlConfig.get<number>(Constants.Settings.indentSpaceLength);
        let usesinglequotes = prettyXmlConfig.get<boolean>(Constants.Settings.useSingleQuotes);
        let useselfclosetag = prettyXmlConfig.get<boolean>(Constants.Settings.useSelfClosingTag);
        let formatOnSave = prettyXmlConfig.get<boolean>(Constants.Settings.formatOnSave);
        let allowSingleQuoteInAttributeValue = prettyXmlConfig.get<boolean>(Constants.Settings.allowSingleQuoteInAttributeValue);
        let addSpaceBeforeSelfClosingTag = prettyXmlConfig.get<boolean>(Constants.Settings.addSpaceBeforeSelfClosingTag);
        let wrapCommentTextWithSpaces = prettyXmlConfig.get<boolean>(Constants.Settings.wrapCommentTextWithSpaces);
        let allowWhiteSpaceUnicodesInAttributeValues = prettyXmlConfig.get<boolean>(Constants.Settings.allowWhiteSpaceUnicodesInAttributeValues);
        let positionFirstAttributeOnSameLine = prettyXmlConfig.get<boolean>(Constants.Settings.positionFirstAttributeOnSameLine);
        let positionAllAttributesOnFirstLine = prettyXmlConfig.get<boolean>(Constants.Settings.positionAllAttributesOnFirstLine);
        let preserveWhiteSpacesInComment = prettyXmlConfig.get<boolean>(Constants.Settings.preserveWhiteSpacesInComment);
        let addSpaceBeforeEndOfXmlDeclaration = prettyXmlConfig.get<boolean>(Constants.Settings.addSpaceBeforeEndOfXmlDeclaration);
        let addXmlDeclarationIfMissing = prettyXmlConfig.get<boolean>(Constants.Settings.addXmlDeclarationIfMissing);
        let attributesInNewlineThreshold = prettyXmlConfig.get<number>(Constants.Settings.attributesInNewlineThreshold);
        let wildCardedExceptionsForPositionAllAttributesOnFirstLine = prettyXmlConfig.get<Array<string>>(Constants.Settings.wildCardedExceptionsForPositionAllAttributesOnFirstLine);
        let addEmptyLineBetweenElements = prettyXmlConfig.get<boolean>(Constants.Settings.addEmptyLineBetweenElements);
        let preserveNewLines = prettyXmlConfig.get<boolean>(Constants.Settings.preserveNewLines);
        let enableLogs = prettyXmlConfig.get<boolean>(Constants.Settings.enableLogs);
        Logger.instance.setIsEnabled(enableLogs);

        this.settings = {
            indentLength: spacelength,
            useSingleQuotes: usesinglequotes,
            useSelfClosingTags: useselfclosetag,
            formatOnSave: formatOnSave,
            allowSingleQuoteInAttributeValue: allowSingleQuoteInAttributeValue,
            addSpaceBeforeSelfClosingTag: addSpaceBeforeSelfClosingTag,
            wrapCommentTextWithSpaces: wrapCommentTextWithSpaces,
            allowWhiteSpaceUnicodesInAttributeValues: allowWhiteSpaceUnicodesInAttributeValues,
            positionFirstAttributeOnSameLine: positionFirstAttributeOnSameLine,
            positionAllAttributesOnFirstLine: positionAllAttributesOnFirstLine,
            preserveWhiteSpacesInComment: preserveWhiteSpacesInComment,
            addSpaceBeforeEndOfXmlDeclaration: addSpaceBeforeEndOfXmlDeclaration,
            addXmlDeclarationIfMissing: addXmlDeclarationIfMissing,
            attributesInNewlineThreshold: attributesInNewlineThreshold,
            wildCardedExceptionsForPositionAllAttributesOnFirstLine: wildCardedExceptionsForPositionAllAttributesOnFirstLine,
            addEmptyLineBetweenElements: addEmptyLineBetweenElements,
            preserveNewLines: preserveNewLines,
            enableLogs: enableLogs,
        };

        Logger.instance.info(`Settings : ${JSON.stringify(this.settings)}`);

        Logger.instance.info("loadSettings end");
    }

    public async formatXml(docText: string = ""): Promise<string> {
        Logger.instance.info("formatXml start");
        let formattedString: string = "";

        if (!docText) {
            Logger.instance.warning("docText is null. Fetching from DocumentHelper");
            docText = DocumentHelper.getDocumentText();
        }

        if (docText) {
            formattedString = await this.formatWithCommandLine(docText, FormattingActionKind.format);
            Logger.instance.info(`Formatted text: ${formattedString}`);
            Logger.instance.info("formatXml end");
            return formattedString;
        }
        else {
            Logger.instance.warning("Document text is not valid!. Throwing error from formatXml");
            throw new Error("Document text is not valid!");
        }
    }

    async minimizeXml(): Promise<string> {
        Logger.instance.info("minimizeXml start");
        let minimizedXmlText: string = "";
        var docText = DocumentHelper.getDocumentText();
        if (docText) {
            minimizedXmlText = await this.formatWithCommandLine(docText, FormattingActionKind.minimize);
            Logger.instance.info(`minimizedXmlText: ${minimizedXmlText}`);
            return minimizedXmlText;
        }
        else {
            Logger.instance.warning("Document text is invalid!. Throwing error from minimizeXml");
            throw new Error('Document text is invalid!');
        }
    }

    public async formatWithCommandLine(docText: string, actionKind: FormattingActionKind): Promise<string> {
        try {
            Logger.instance.info("formatWithCommandLine start");
            var jsinput: JsonInputDto = new JsonInputDto(docText, actionKind, this.settings);
            var inputstr = JSON.stringify(jsinput);
            Logger.instance.info(`converted input to json ${inputstr}`);
            const cli = childProcess.spawn('dotnet', [this.dllPath], { stdio: ['pipe'] });

            Logger.instance.info(`Starting dotnet childProcess at ${this.dllPath} `);
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
                        Logger.instance.warning(`childProcess errored with exitCode ${exitCode}`);
                        reject(stdErrData);
                    }
                    else {
                        Logger.instance.info(`childProcess stdOutData:  ${stdOutData}`);
                        resolve(stdOutData);
                    }
                });
            });

            cli.stdin.end(inputstr, "utf-8");
            return promise;
        }
        catch (error) {
            if (error instanceof Error) {
                Logger.instance.error(error);
            }
            else if (typeof error === "string") {
                Logger.instance.warning(error);
            }
            Logger.instance.warning("Error formatting with command line. Make sure you have dotnet 8 installed and it is added to PATH.");
            throw new Error('Error formatting with command line. Make sure you have dotnet 8 installed and it is added to PATH.');
        }
    }
}
