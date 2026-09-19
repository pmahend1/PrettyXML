export interface RangeCorpusEntry {
    /** Reads as the heading it becomes in the divergence baseline. */
    name: string;

    /** The selection, exactly as the range provider would receive it from `document.getText`. */
    fragment: string;
}
