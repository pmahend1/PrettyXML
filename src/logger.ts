import * as vscode from 'vscode';

export interface ILogger {
    info(message: string): void;
    error(error: Error): void;
    warning(message: string): void;
    debug(message: string): void;
    log(message: string): void;
    outputChannel: vscode.OutputChannel;
    updateConfiguration(isEnabled: boolean): void;
}

function isString(value: unknown): value is string {
    return Object.prototype.toString.call(value) === '[object String]';
}

export class ConsoleLogger implements ILogger {
    private static _instance: ConsoleLogger;

    public static get instance() {
        if (!ConsoleLogger._instance) {
            ConsoleLogger._instance = new ConsoleLogger();
        }

        return ConsoleLogger._instance;
    }

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel("PrettyXML log");
        this.updateConfiguration();
    }

    private enableLogs?: boolean;
    public outputChannel: vscode.OutputChannel;

    public error(error: Error): void {
        if (error !== null){
            this.log(error.stack ?? `${error.name} : ${error.message}`);
        }
    }

    public info(message: string): void {
        this.log(message);
    }

    public debug(message: string): void {
        this.log(message);
    }

    public warning(message: string): void {
        this.log(message);
    }

    public log(message: string, data?: unknown): void {
        if (this.enableLogs) {
            this.appendLine(
                `[Log - ${new Date().toLocaleTimeString()}] ${message}`
            );
            if (data) {
                this.appendLine(ConsoleLogger.data2String(data));
            }
        }
    }

    public updateConfiguration(isEnabled: boolean = false) {
        this.enableLogs = isEnabled;
    }

    public appendLine(value = '') {
        return this.outputChannel.appendLine(value);
    }

    public append(value: string) {
        return this.outputChannel.append(value);
    }

    public show() {
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