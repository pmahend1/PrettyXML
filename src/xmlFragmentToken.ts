import { XmlFragmentTokenKind } from "./xmlFragmentTokenKind";

export interface XmlFragmentToken {
    kind: XmlFragmentTokenKind;

    /** The source text, byte for byte. Concatenating every token's text rebuilds the input. */
    text: string;

    /** Where `text` begins in the string the tokenizer was given. */
    offset: number;
}
