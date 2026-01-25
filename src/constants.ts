export const Constants = {
    extensionName: "Pretty XML",
    prettyxml: "prettyxml",
    id: "PrateekMahendrakar.prettyxml",
    settings: "settings",
    changeLogUrl: "https://github.com/pmahend1/PrettyXML/blob/main/CHANGELOG.md",
    vsMarketplaceReviewUrl: "https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml&ssr=false#review-details",
    openVsxReviewUrl: "https://open-vsx.org/extension/PrateekMahendrakar/prettyxml/reviews",
    codium: "codium",
    defaultEditor: "editor.defaultFormatter",

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
        preserveNewLines: "preserveNewLines",
        preserveCommentPlacement: "preserveCommentPlacement",
        enableLogs: "enableLogs",
    },

    LanguageIDs: {
        xml: "xml",
        xsd: "xsd",
        xaml: "xaml",
        xsl: "xsl",
        xslt: "xslt"
    },

    Commands: {
        prettifyxml: `prettyxml.prettifyxml`,
        minimize: `prettyxml.minimizexml`,
    }
} as const;