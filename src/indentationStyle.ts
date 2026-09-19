/*
 * How a selection is indented: the whitespace its first line carries, and one level of indentation.
 * Both are strings rather than column counts - a tab is one character and tabSize columns wide, so
 * a count cannot describe a tab-indented document without a width everyone has to agree on.
 */
export class IndentationStyle {

    private readonly depths: string[] = [];

    public readonly baseIndent: string;
    public readonly unit: string;

    constructor(baseIndent: string, unit: string) {
        this.baseIndent = baseIndent;
        this.unit = unit;
    }

    public static spaces(indentLength: number, baseColumn: number = 0): IndentationStyle {
        return new IndentationStyle(" ".repeat(baseColumn), " ".repeat(indentLength));
    }

    public forDepth(depth: number): string {
        let indentation = this.depths[depth];
        if (indentation === undefined) {
            indentation = this.baseIndent + this.unit.repeat(depth);
            this.depths[depth] = indentation;
        }
        return indentation;
    }

    /*
     * An offset into the start tag cannot be written in whole tabs, so a continuation line carries
     * the element's own indentation and then spaces - which holds at any rendered tab width.
     */
    public alignedUnderColumn(depth: number, offset: number): string {
        return this.forDepth(depth) + " ".repeat(offset);
    }
}
