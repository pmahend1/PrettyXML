import * as vscode from "vscode";
import { DocumentHelper } from "./documentHelper";
import { defaultSettings, Settings } from "./settings";
import * as childProcess from "node:child_process";
import * as path from "node:path";
import { JsonInputDto } from "./jsonInputDto";
import { FormattingActionKind } from "./formattingActionKind";
import { Logger } from "./logger";
import { constants } from "./constants";
import { appendEolIfMissing, preserveOriginalEol } from "./eolHelper";

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
        let prettyXmlConfig = vscode.workspace.getConfiguration(`${constants.prettyxml}.${constants.settingsText}`);

        let spacelength = prettyXmlConfig.get<number>(constants.settings.indentSpaceLength);
        let usesinglequotes = prettyXmlConfig.get<boolean>(constants.settings.useSingleQuotes);
        let useselfclosetag = prettyXmlConfig.get<boolean>(constants.settings.useSelfClosingTag);
        let formatOnSave = prettyXmlConfig.get<boolean>(constants.settings.formatOnSave);
        let allowSingleQuoteInAttributeValue = prettyXmlConfig.get<boolean>(constants.settings.allowSingleQuoteInAttributeValue);
        let addSpaceBeforeSelfClosingTag = prettyXmlConfig.get<boolean>(constants.settings.addSpaceBeforeSelfClosingTag);
        let wrapCommentTextWithSpaces = prettyXmlConfig.get<boolean>(constants.settings.wrapCommentTextWithSpaces);
        let allowWhiteSpaceUnicodesInAttributeValues = prettyXmlConfig.get<boolean>(constants.settings.allowWhiteSpaceUnicodesInAttributeValues);
        let positionFirstAttributeOnSameLine = prettyXmlConfig.get<boolean>(constants.settings.positionFirstAttributeOnSameLine);
        let positionAllAttributesOnFirstLine = prettyXmlConfig.get<boolean>(constants.settings.positionAllAttributesOnFirstLine);
        let preserveWhiteSpacesInComment = prettyXmlConfig.get<boolean>(constants.settings.preserveWhiteSpacesInComment);
        let addSpaceBeforeEndOfXmlDeclaration = prettyXmlConfig.get<boolean>(constants.settings.addSpaceBeforeEndOfXmlDeclaration);
        let addXmlDeclarationIfMissing = prettyXmlConfig.get<boolean>(constants.settings.addXmlDeclarationIfMissing);
        let attributesInNewlineThreshold = prettyXmlConfig.get<number>(constants.settings.attributesInNewlineThreshold);
        let wildCardedExceptionsForPositionAllAttributesOnFirstLine = prettyXmlConfig.get<Array<string>>(constants.settings.wildCardedExceptionsForPositionAllAttributesOnFirstLine);
        let addEmptyLineBetweenElements = prettyXmlConfig.get<boolean>(constants.settings.addEmptyLineBetweenElements);
        let addEmptyEol = prettyXmlConfig.get<boolean>(constants.settings.addEmptyEol);
        let preserveNewLines = prettyXmlConfig.get<boolean>(constants.settings.preserveNewLines);
        let preserveCommentPlacement = prettyXmlConfig.get<boolean>(constants.settings.preserveCommentPlacement);
        let enableLogs = prettyXmlConfig.get<boolean>(constants.settings.enableLogs);
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
            addEmptyEol: addEmptyEol,
            preserveNewLines: preserveNewLines,
            preserveCommentPlacement: preserveCommentPlacement,
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
            if (this.settings.addEmptyEol) {
                formattedString = appendEolIfMissing(formattedString, docText);
            } else {
                formattedString = preserveOriginalEol(formattedString, docText);
            }
            Logger.instance.info(`Formatted text: ${formattedString}`);
            Logger.instance.info("formatXml end");
            return formattedString;
        }
        else {
            Logger.instance.warning("Document text is not valid!. Throwing error from formatXml");
            throw new Error("Document text is not valid!");
        }
    }

    public async minimizeXml(): Promise<string> {
        Logger.instance.info("minimizeXml start");
        let minimizedXmlText: string = "";
        let docText = DocumentHelper.getDocumentText();
        if (docText) {
            minimizedXmlText = await this.formatWithCommandLine(docText, FormattingActionKind.minimize);
            minimizedXmlText = preserveOriginalEol(minimizedXmlText, docText);
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
