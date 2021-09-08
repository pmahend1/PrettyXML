import * as vscode from "vscode";
export class DocumentFilter implements vscode.DocumentFilter 
{
    language?: string;

    scheme?: string;

    pattern?: vscode.GlobPattern;

    constructor(language?: string, scheme?: string, pattern?: vscode.GlobPattern)
    {
        this.language = language ?? undefined;
        this.scheme = scheme ?? undefined;
        this.pattern = pattern ?? undefined;
    }
}