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
    AllowSingleQuoteInAttributeValue?: boolean;

    constructor(xmlString: string, indentLength: number = DefaultSettings.IndentLength, useSingleQuotes: boolean = DefaultSettings.UseSingleQuotes, useSelfClosingTags: boolean = DefaultSettings.UseSelfClosingTags, allowSingleQuoteInAttributeValue: boolean = DefaultSettings.AllowSingleQuoteInAttributeValue)
    {
        this.XMLString = xmlString;
        this.IndentLength = indentLength;
        this.UseSingleQuotes = useSingleQuotes;
        this.UseSelfClosingTags = useSelfClosingTags;
        this.AllowSingleQuoteInAttributeValue = allowSingleQuoteInAttributeValue;
    }
}
