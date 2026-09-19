import { IndentationStyle } from "./indentationStyle";
import { Settings } from "./settings";
import { XmlFragmentParser } from "./xmlFragmentParser";
import { XmlFragmentRenderer } from "./xmlFragmentRenderer";
import { XmlFragmentTokenizer } from "./xmlFragmentTokenizer";

export class TextXmlFormatter {

    private readonly renderer: XmlFragmentRenderer;
    private readonly defaultIndentation: IndentationStyle;

    constructor(settings: Settings) {
        this.renderer = new XmlFragmentRenderer(settings);
        this.defaultIndentation = IndentationStyle.spaces(settings.indentLength ?? 4);
    }

    /*
     * Only the caller knows `indentation`: the document decides where the selection starts, the
     * editor decides whether a level is a tab or spaces. Without one, indentLength spaces per level.
     */
    public formatXmlPretty(xml: string, indentation: IndentationStyle = this.defaultIndentation): string {
        const nodes = XmlFragmentParser.parse(XmlFragmentTokenizer.tokenize(xml));
        return this.renderer.render(nodes, indentation);
    }
}
