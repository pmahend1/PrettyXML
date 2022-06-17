/* eslint-disable @typescript-eslint/naming-convention */

import { DefaultSettings } from "./settings";

export class JSInputDTO
{
    XMLString: string;
    IndentLength: number;
    UseSingleQuotes: boolean;
    UseSelfClosingTags: boolean;
    AllowSingleQuoteInAttributeValue: boolean;
    AddSpaceBeforeSelfClosingTag: boolean;
    WrapCommentTextWithSpaces: boolean;
    AllowWhiteSpaceUnicodesInAttributeValues: boolean;
    PositionFirstAttributeOnSameLine: boolean;

    constructor(xmlString: string,
                indentLength: number = DefaultSettings.IndentLength,
                useSingleQuotes: boolean = DefaultSettings.UseSingleQuotes,
                useSelfClosingTags: boolean = DefaultSettings.UseSelfClosingTags,
                allowSingleQuoteInAttributeValue: boolean = DefaultSettings.AllowSingleQuoteInAttributeValue,
                addSpaceBeforeSelfClosingTag: boolean = DefaultSettings.AddSpaceBeforeSelfClosingTag,
                wrapCommentTextWithSpaces: boolean = DefaultSettings.WrapCommentTextWithSpaces,
                allowWhiteSpaceUnicodesInAttributeValues: boolean = DefaultSettings.AllowWhiteSpaceUnicodesInAttributeValues,
                positionFirstAttributeOnSameLine: boolean = DefaultSettings.PositionFirstAttributeOnSameLine)
    {
        this.XMLString = xmlString;
        this.IndentLength = indentLength;
        this.UseSingleQuotes = useSingleQuotes;
        this.UseSelfClosingTags = useSelfClosingTags;
        this.AllowSingleQuoteInAttributeValue = allowSingleQuoteInAttributeValue;
        this.AddSpaceBeforeSelfClosingTag = addSpaceBeforeSelfClosingTag;
        this.WrapCommentTextWithSpaces = wrapCommentTextWithSpaces;
        this.AllowWhiteSpaceUnicodesInAttributeValues = allowWhiteSpaceUnicodesInAttributeValues;
        this.PositionFirstAttributeOnSameLine = positionFirstAttributeOnSameLine;
    }
}
