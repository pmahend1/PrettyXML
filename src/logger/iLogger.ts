import * as vscode from 'vscode';

export interface ILogger {
    info(message: string): void;
    error(error: Error): void;
    warning(message: string): void;
    debug(message: string): void;
    outputChannel: vscode.OutputChannel;
    setIsEnabled(isEnabled: boolean): void;
    readonly isEnabled: boolean;
}
