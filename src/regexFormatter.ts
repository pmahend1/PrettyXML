import { Settings } from "./settings";
import { XmlFragmentParser } from "./xmlFragmentParser";
import { XmlFragmentRenderer } from "./xmlFragmentRenderer";
import { XmlFragmentTokenizer } from "./xmlFragmentTokenizer";

export class TextXmlFormatter {

    private readonly renderer: XmlFragmentRenderer;

    constructor(settings: Settings) {
        this.renderer = new XmlFragmentRenderer(settings);
    }

    // `baseColumn` is the indentation the selection starts at, which only its caller can know.
    public formatXmlPretty(xml: string, baseColumn: number = 0): string {
        const nodes = XmlFragmentParser.parse(XmlFragmentTokenizer.tokenize(xml));
        return this.renderer.render(nodes, baseColumn);
    }
}
