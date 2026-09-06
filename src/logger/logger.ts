import * as vscode from 'vscode';
import { constants } from '../constants';
import { ILogger } from './iLogger';
import { LogLevel } from './logLevel';

function isString(value: unknown): value is string {
    return Object.prototype.toString.call(value) === '[object String]';
}

export class Logger implements ILogger {
    private static _instance: Logger;
    private isDebug: boolean = false;

    public static get instance() {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }

        return Logger._instance;
    }

    public setDebug(isDebug: boolean) {
        this.isDebug = isDebug;
    }

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel(constants.extensionName);
        this.setIsEnabled();
    }

    private enableLogs?: boolean;
    public outputChannel: vscode.OutputChannel;

    public error(error: Error): void {
        if (error !== null) {
            this.log(LogLevel.error, error.stack ?? `${error.name} : ${error.message}`);
        }
    }

    public info(message: string): void {
        this.log(LogLevel.info, message);
    }

    public debug(message: string): void {
        this.log(LogLevel.debug, message);
    }

    public warning(message: string): void {
        this.log(LogLevel.warning, message);
    }

    private log(logLevel: LogLevel, message: string, data?: unknown): void {
        const logMessage = `[ ${logLevel} - ${new Date().toLocaleTimeString()}] ${message}`;
        if (this.enableLogs) {
            this.appendLine(logMessage);
            if (data) {
                const dataString = Logger.data2String(data);
                this.appendLine(dataString);
            }
        }
        if (this.isDebug) {
            console.log(logMessage);
            const dataString = Logger.data2String(data);
            if (data) {
                console.log(dataString);
            }
        }
    }

    public setIsEnabled(isEnabled: boolean = false) {
        this.enableLogs = isEnabled;
    }

    public get isEnabled(): boolean {
        return this.enableLogs === true;
    }

    private appendLine(value = '') {
        return this.outputChannel.appendLine(value);
    }

    private append(value: string) {
        return this.outputChannel.append(value);
    }

    private show() {
        this.outputChannel.show();
    }

    private static data2String(data: unknown): string {
        if (data instanceof Error) {
            if (isString(data.stack)) {
                return data.stack;
            }
            return (data as Error).message;
        }
        if (isString(data)) {
            return data;
        }
        return JSON.stringify(data, undefined, 2);
    }
}
