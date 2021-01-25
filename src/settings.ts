/* eslint-disable @typescript-eslint/naming-convention */
export interface ISettings
{
    IndentLength: number;
    UseSingleQuotes: boolean;
    UseSelfClosingTags: boolean;
    FormatOnSave : boolean;
}

export const DefaultSettings: ISettings = {
    IndentLength: 2,
    UseSingleQuotes: false,
    UseSelfClosingTags: true,
    FormatOnSave : false,
};

export class Settings
{
    IndentLength?: number;
    UseSingleQuotes?: boolean;
    UseSelfClosingTags?: boolean ;
    FormatOnSave?:boolean;

    constructor(indentLengh?:number, useSingleQuotes?:boolean, useSelfClosingTags?:boolean, formatOnSave?:boolean)
    {
        this.IndentLength = indentLengh ?? DefaultSettings.IndentLength;
        this.UseSingleQuotes = useSingleQuotes ?? DefaultSettings.UseSingleQuotes;
        this.UseSelfClosingTags = useSelfClosingTags?? DefaultSettings.UseSelfClosingTags;
        this.FormatOnSave = formatOnSave ?? DefaultSettings.FormatOnSave;
    }
}


