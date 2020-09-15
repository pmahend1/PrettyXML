/* eslint-disable @typescript-eslint/naming-convention */

import { DefaultSettings } from "./settings";


interface IJSInputDto
{
    XMLString: string;
    IndentLength?: number;
    UseSingleQuotes?: boolean;
    UseSelfClosingTags?: boolean;
}


export class JSInputDTO
{
    XMLString: string;
    IndentLength: number;
    UseSingleQuotes: boolean;
    UseSelfClosingTags: boolean;

    constructor(XMLString: string,
        IndentLength: number = DefaultSettings.IndentLength,
        UseSingleQuotes: boolean = DefaultSettings.UseSingleQuotes,
        UseSelfClosingTags: boolean = DefaultSettings.UseSelfClosingTags)
    {
        this.XMLString = XMLString;
        this.IndentLength = IndentLength;
        this.UseSingleQuotes = UseSingleQuotes;
        this.UseSelfClosingTags = UseSelfClosingTags;
    }

}
