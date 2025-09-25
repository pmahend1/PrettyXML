export const Constants = {
    extensionName: "Pretty XML",
    prettyxml: "prettyxml",
    settings: "settings",
    changeLogUrl: "https://github.com/pmahend1/PrettyXML/blob/main/CHANGELOG.md",
    vsMarketplaceReviewUrl: "https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml&ssr=false#review-details",
    openVsxReviewUrl: "https://open-vsx.org/extension/PrateekMahendrakar/prettyxml/reviews",
    codium: "codium",

    Settings: {
        indentSpaceLength: "indentSpaceLength",
        useSingleQuotes: "useSingleQuotes",
        useSelfClosingTag: "useSelfClosingTag",
        formatOnSave: "formatOnSave",
        allowSingleQuoteInAttributeValue: "allowSingleQuoteInAttributeValue",
        addSpaceBeforeSelfClosingTag: "addSpaceBeforeSelfClosingTag",
        wrapCommentTextWithSpaces: "wrapCommentTextWithSpaces",
        allowWhiteSpaceUnicodesInAttributeValues: "allowWhiteSpaceUnicodesInAttributeValues",
        positionFirstAttributeOnSameLine: "positionFirstAttributeOnSameLine",
        positionAllAttributesOnFirstLine: "positionAllAttributesOnFirstLine",
        preserveWhiteSpacesInComment: "preserveWhiteSpacesInComment",
        addSpaceBeforeEndOfXmlDeclaration: "addSpaceBeforeEndOfXmlDeclaration",
        addXmlDeclarationIfMissing: "addXmlDeclarationIfMissing",
        attributesInNewlineThreshold: "attributesInNewlineThreshold",
        wildCardedExceptionsForPositionAllAttributesOnFirstLine: "wildCardedExceptionsForPositionAllAttributesOnFirstLine",
        addEmptyLineBetweenElements: "addEmptyLineBetweenElements",
        enableLogs: "enableLogs",
    },

    LanguageIDs: {
        xml: "xml",
        xsd: "xsd",
        xaml: "xaml"
    },

    Commands: {
        prettifyxml: `prettyxml.prettifyxml`,
        minimize: `prettyxml.minimizexml`,
    }
} as const;