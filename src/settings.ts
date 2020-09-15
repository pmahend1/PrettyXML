/* eslint-disable @typescript-eslint/naming-convention */
export interface ISettings
{
    IndentLength: number;
    UseSingleQuotes: boolean;
    UseSelfClosingTags: boolean;

}

export const DefaultSettings: ISettings = {
    IndentLength: 2,
    UseSingleQuotes: false,
    UseSelfClosingTags: true,
};

export class Settings
{
    IndentLength?: number;
    UseSingleQuotes?: boolean;
    UseSelfClosingTags?: boolean ;

    constructor(indentLengh?:number, useSingleQuotes?:boolean, useSelfClosingTags?:boolean)
    {
        this.IndentLength = indentLengh ?? DefaultSettings.IndentLength;
        this.UseSingleQuotes = useSingleQuotes ?? DefaultSettings.UseSingleQuotes;
        this.UseSelfClosingTags = useSelfClosingTags?? DefaultSettings.UseSelfClosingTags;
    }
}


