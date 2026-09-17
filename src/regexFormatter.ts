import { Settings } from "./settings";
import { XmlFragmentParser } from "./xmlFragmentParser";
import { XmlFragmentRenderer } from "./xmlFragmentRenderer";
import { XmlFragmentTokenizer } from "./xmlFragmentTokenizer";

export class TextXmlFormatter {

    private readonly indentSize: number;
    private readonly renderer: XmlFragmentRenderer;

    constructor(settings: Settings) {
        this.indentSize = settings.indentLength ?? 4;
        this.renderer = new XmlFragmentRenderer(settings);
    }

    public formatXmlPretty(xml: string): string {
        const nodes = XmlFragmentParser.parse(XmlFragmentTokenizer.tokenize(xml));
        const startLevel = Math.floor(TextXmlFormatter.readStartIndent(xml) / this.indentSize);
        return this.renderer.render(nodes, startLevel);
    }

    /*
     * Today's starting depth is guessed from the leading whitespace of the input, which only works
     * when the selection happens to begin with a space. Rule 4 replaces the guess with a base
     * column the provider passes in; that is an observable change and belongs to 8e.
     */
    private static readStartIndent(xml: string): number {
        if (xml.startsWith(" ") === false) {
            return 0;
        }
        const firstTagIndex = xml.indexOf("<");
        return firstTagIndex > 0 ? firstTagIndex : 0;
    }
}
