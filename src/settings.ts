/* eslint-disable @typescript-eslint/naming-convention */
export interface ISettings
{
    IndentLength: number;
    UseSingleQuotes: boolean;
    UseSelfClosingTags: boolean;
    FormatOnSave: boolean;
    AllowSingleQuoteInAttributeValue: boolean;
    AddSpaceBeforeSelfClosingTag: boolean;
    WrapCommentTextWithSpaces: boolean;
    AllowWhiteSpaceUnicodesInAttributeValues: boolean;
    PositionFirstAttributeOnSameLine: boolean;
    PositionAllAttributesOnFirstLine: boolean;
    PreserveWhiteSpacesInComment: boolean;
    EnableLogs: boolean;
}

export const DefaultSettings: ISettings = {
                                            IndentLength: 4,
                                            UseSingleQuotes: false,
                                            UseSelfClosingTags: true,
                                            FormatOnSave: false,
                                            AllowSingleQuoteInAttributeValue: true,
                                            AddSpaceBeforeSelfClosingTag: true,
                                            WrapCommentTextWithSpaces: true,
                                            AllowWhiteSpaceUnicodesInAttributeValues: true,
                                            PositionFirstAttributeOnSameLine: true,
                                            PositionAllAttributesOnFirstLine: false,
                                            PreserveWhiteSpacesInComment: false,
                                            EnableLogs: false
                                          };

export class Settings
{
    IndentLength?: number;
    UseSingleQuotes?: boolean;
    UseSelfClosingTags?: boolean;
    FormatOnSave?: boolean;
    AllowSingleQuoteInAttributeValue?: boolean;
    AddSpaceBeforeSelfClosingTag?: boolean;
    WrapCommentTextWithSpaces?: boolean;
    AllowWhiteSpaceUnicodesInAttributeValues?: boolean;
    PositionFirstAttributeOnSameLine?: boolean;
    PositionAllAttributesOnFirstLine?: boolean;
    PreserveWhiteSpacesInComment?: boolean;
    EnableLogs?: boolean;

    constructor(indentLengh?: number,
                useSingleQuotes?: boolean,
                useSelfClosingTags?: boolean,
                formatOnSave?: boolean,
                allowSingleQuoteInAttributeValue?: boolean,
                addSpaceBeforeSelfClosingTag?: boolean,
                wrapCommentTextWithSpaces?: boolean,
                allowWhiteSpaceUnicodesInAttributeValues?: boolean,
                positionFirstAttributeOnSameLine?: boolean,
                positionAllAttributesOnFirstLine?: boolean,
                preserveWhiteSpacesInComment?: boolean,
                enableLogs?: boolean)
    {
        this.IndentLength = indentLengh ?? DefaultSettings.IndentLength;
        this.UseSingleQuotes = useSingleQuotes ?? DefaultSettings.UseSingleQuotes;
        this.UseSelfClosingTags = useSelfClosingTags ?? DefaultSettings.UseSelfClosingTags;
        this.FormatOnSave = formatOnSave ?? DefaultSettings.FormatOnSave;
        this.AllowSingleQuoteInAttributeValue = allowSingleQuoteInAttributeValue ?? DefaultSettings.AllowSingleQuoteInAttributeValue;
        this.AddSpaceBeforeSelfClosingTag = addSpaceBeforeSelfClosingTag ?? DefaultSettings.AddSpaceBeforeSelfClosingTag;
        this.WrapCommentTextWithSpaces = wrapCommentTextWithSpaces ?? DefaultSettings.WrapCommentTextWithSpaces;
        this.AllowWhiteSpaceUnicodesInAttributeValues = allowWhiteSpaceUnicodesInAttributeValues ?? DefaultSettings.AllowWhiteSpaceUnicodesInAttributeValues;
        this.PositionFirstAttributeOnSameLine = positionFirstAttributeOnSameLine ?? DefaultSettings.PositionFirstAttributeOnSameLine;
        this.PositionAllAttributesOnFirstLine = positionAllAttributesOnFirstLine ?? DefaultSettings.PositionAllAttributesOnFirstLine;
        this.PreserveWhiteSpacesInComment = preserveWhiteSpacesInComment ?? DefaultSettings.PreserveWhiteSpacesInComment;
        this.EnableLogs = enableLogs ?? DefaultSettings.EnableLogs;
    }
}
