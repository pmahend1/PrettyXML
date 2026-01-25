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
    addXmlDeclarationIfMissing: boolean;
    attributesInNewlineThreshold: number;
    wildCardedExceptionsForPositionAllAttributesOnFirstLine?: [string];
    addEmptyLineBetweenElements: boolean;
    preserveNewLines: boolean;
    preserveCommentPlacement: boolean;
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
    addXmlDeclarationIfMissing: true,
    attributesInNewlineThreshold: 1,
    wildCardedExceptionsForPositionAllAttributesOnFirstLine: undefined,
    addEmptyLineBetweenElements: false,
    preserveNewLines: false,
    preserveCommentPlacement: false,
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
    addSpaceBeforeEndOfXmlDeclaration?: boolean;
    addXmlDeclarationIfMissing?: boolean;
    attributesInNewlineThreshold?: number;
    wildCardedExceptionsForPositionAllAttributesOnFirstLine?: string[];
    addEmptyLineBetweenElements?: boolean;
    preserveNewLines?: boolean;
    preserveCommentPlacement?: boolean;
    enableLogs?: boolean;

    constructor({
        indentLength,
        useSingleQuotes,
        useSelfClosingTags,
        formatOnSave,
        allowSingleQuoteInAttributeValue,
        addSpaceBeforeSelfClosingTag,
        wrapCommentTextWithSpaces,
        allowWhiteSpaceUnicodesInAttributeValues,
        positionFirstAttributeOnSameLine,
        positionAllAttributesOnFirstLine,
        preserveWhiteSpacesInComment,
        addSpaceBeforeEndOfXmlDeclaration,
        addXmlDeclarationIfMissing,
        attributesInNewlineThreshold,
        wildCardedExceptionsForPositionAllAttributesOnFirstLine,
        addEmptyLineBetweenElements,
        preserveNewLines,
        preserveCommentPlacement,
        enableLogs
    }: Partial<ISettings> = {}) {
        this.indentLength = indentLength ?? defaultSettings.indentLength;
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
        this.addXmlDeclarationIfMissing = addXmlDeclarationIfMissing ?? defaultSettings.addXmlDeclarationIfMissing;
        this.attributesInNewlineThreshold = attributesInNewlineThreshold ?? defaultSettings.attributesInNewlineThreshold;
        this.wildCardedExceptionsForPositionAllAttributesOnFirstLine = wildCardedExceptionsForPositionAllAttributesOnFirstLine;
        this.addEmptyLineBetweenElements = addEmptyLineBetweenElements ?? defaultSettings.addEmptyLineBetweenElements;
        this.preserveNewLines = preserveNewLines ?? defaultSettings.preserveNewLines;
        this.preserveCommentPlacement = preserveCommentPlacement ?? defaultSettings.preserveCommentPlacement;
        this.enableLogs = enableLogs ?? defaultSettings.enableLogs;
    }
}
