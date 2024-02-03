/* eslint-disable @typescript-eslint/naming-convention */

import { defaultSettings } from "./settings";

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
                indentLength: number = defaultSettings.indentLength,
                useSingleQuotes: boolean = defaultSettings.useSingleQuotes,
                useSelfClosingTags: boolean = defaultSettings.useSelfClosingTags,
                allowSingleQuoteInAttributeValue: boolean = defaultSettings.allowSingleQuoteInAttributeValue,
                addSpaceBeforeSelfClosingTag: boolean = defaultSettings.addSpaceBeforeSelfClosingTag,
                wrapCommentTextWithSpaces: boolean = defaultSettings.wrapCommentTextWithSpaces,
                allowWhiteSpaceUnicodesInAttributeValues: boolean = defaultSettings.allowWhiteSpaceUnicodesInAttributeValues,
                positionFirstAttributeOnSameLine: boolean = defaultSettings.positionFirstAttributeOnSameLine)
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
