export interface ISettings {
    indentLength: number;
    useSingleQuotes: boolean;
    useSelfClosingTags: boolean;
    formatOnSave: boolean;
    allowSingleQuoteInAttributeValue: boolean;
    addSpaceBeforeSelfClosingTag: boolean;
    wrapCommentTextWithSpaces: boolean;
    allowWhiteSpaceUnicodesInAttributeValues: boolean;
    positionFirstAttributeOnSameLine: boolean;
    positionAllAttributesOnFirstLine: boolean;
    preserveWhiteSpacesInComment: boolean;
    addSpaceBeforeEndOfXmlDeclaration: boolean;
    enableLogs: boolean;
}

export const defaultSettings: ISettings = {
    indentLength: 4,
    useSingleQuotes: false,
    useSelfClosingTags: true,
    formatOnSave: false,
    allowSingleQuoteInAttributeValue: true,
    addSpaceBeforeSelfClosingTag: true,
    wrapCommentTextWithSpaces: true,
    allowWhiteSpaceUnicodesInAttributeValues: true,
    positionFirstAttributeOnSameLine: true,
    positionAllAttributesOnFirstLine: false,
    preserveWhiteSpacesInComment: false,
    addSpaceBeforeEndOfXmlDeclaration: false,
    enableLogs: false
};

export class Settings {
    indentLength?: number;
    useSingleQuotes?: boolean;
    useSelfClosingTags?: boolean;
    formatOnSave?: boolean;
    allowSingleQuoteInAttributeValue?: boolean;
    addSpaceBeforeSelfClosingTag?: boolean;
    wrapCommentTextWithSpaces?: boolean;
    allowWhiteSpaceUnicodesInAttributeValues?: boolean;
    positionFirstAttributeOnSameLine?: boolean;
    positionAllAttributesOnFirstLine?: boolean;
    preserveWhiteSpacesInComment?: boolean;
    addSpaceBeforeEndOfXmlDeclaration: boolean;
    enableLogs?: boolean;

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
        addSpaceBeforeEndOfXmlDeclaration?: boolean,
        enableLogs?: boolean) {
        this.indentLength = indentLengh ?? defaultSettings.indentLength;
        this.useSingleQuotes = useSingleQuotes ?? defaultSettings.useSingleQuotes;
        this.useSelfClosingTags = useSelfClosingTags ?? defaultSettings.useSelfClosingTags;
        this.formatOnSave = formatOnSave ?? defaultSettings.formatOnSave;
        this.allowSingleQuoteInAttributeValue = allowSingleQuoteInAttributeValue ?? defaultSettings.allowSingleQuoteInAttributeValue;
        this.addSpaceBeforeSelfClosingTag = addSpaceBeforeSelfClosingTag ?? defaultSettings.addSpaceBeforeSelfClosingTag;
        this.wrapCommentTextWithSpaces = wrapCommentTextWithSpaces ?? defaultSettings.wrapCommentTextWithSpaces;
        this.allowWhiteSpaceUnicodesInAttributeValues = allowWhiteSpaceUnicodesInAttributeValues ?? defaultSettings.allowWhiteSpaceUnicodesInAttributeValues;
        this.positionFirstAttributeOnSameLine = positionFirstAttributeOnSameLine ?? defaultSettings.positionFirstAttributeOnSameLine;
        this.positionAllAttributesOnFirstLine = positionAllAttributesOnFirstLine ?? defaultSettings.positionAllAttributesOnFirstLine;
        this.preserveWhiteSpacesInComment = preserveWhiteSpacesInComment ?? defaultSettings.preserveWhiteSpacesInComment;
        this.addSpaceBeforeEndOfXmlDeclaration = addSpaceBeforeEndOfXmlDeclaration ?? defaultSettings.addSpaceBeforeEndOfXmlDeclaration;
        this.enableLogs = enableLogs ?? defaultSettings.enableLogs;
    }
}
