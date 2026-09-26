// The engine's _lastNodeType, cut down to what decides whether the next child starts a line.
export enum PrecedingContent {
    // One line of character data: the next child is written onto it.
    text = "Text",

    // A start, self-closing or end tag - CDATA stays on the line after one.
    element = "Element",

    // Anything else, a text run that wrote lines of its own included.
    other = "Other",
}
