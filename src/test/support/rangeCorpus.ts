import { RangeCorpusEntry } from "./rangeCorpusEntry";

/*
 * The selections the range formatter has to answer for. Each is short enough to read as a diff in
 * the baseline report, and between them they cover every shape task 8's rules mention: balanced
 * subtrees and forests, the two tokenizer bugs, the fragment kinds the engine refuses, and the
 * unbalanced cases that only the tree formatter can serve.
 */
export const rangeCorpus: RangeCorpusEntry[] = [
    { name: "balanced subtree", fragment: "<Root><Child attr=\"1\"><Leaf/></Child></Root>" },
    { name: "balanced forest", fragment: "<a><b>1</b></a><a2/>" },
    { name: "attributes over the newline threshold", fragment: "<a x=\"1\" y=\"2\" z=\"3\"/>" },
    { name: "single attribute", fragment: "<a x=\"1\"/>" },
    { name: "empty element written long", fragment: "<a></a>" },
    { name: "comment only", fragment: "<!--   hello   -->" },
    { name: "cdata only", fragment: "<![CDATA[raw <stuff> here]]>" },
    { name: "text only", fragment: "just text" },
    { name: "mixed content", fragment: "<p>some <b>bold</b> text</p>" },
    { name: "nested three deep", fragment: "<a><b><c>deep</c></b></a>" },
    { name: "blank line between siblings", fragment: "<a/>\n\n<b/>" },
    { name: "already formatted, four space indent", fragment: "<a>\n    <b>t</b>\n</a>" },
    { name: "greater-than inside an attribute value", fragment: "<a b=\"x>y\"><c/></a>" },
    { name: "self-closing slash with trailing spaces", fragment: "<r><a /  ><b/></r>" },
    { name: "single-quoted attribute value", fragment: "<a x='1' y='2'/>" },
    { name: "apostrophe inside a double-quoted value", fragment: "<a x=\"it's\"/>" },
    { name: "namespace prefix bound outside the selection", fragment: "<xsl:template match=\"/\"><xsl:text>x</xsl:text></xsl:template>" },
    { name: "namespace prefix declared inside the selection", fragment: "<a xmlns:p=\"urn:x\"><p:b/></a>" },
    { name: "several namespace prefixes bound outside the selection", fragment: "<d:Grid x:Name=\"root\" m:Ignorable=\"d\"><d:Text/></d:Grid>" },
    { name: "undeclared entity", fragment: "<a>&myEntity;</a>" },
    { name: "declaration at the start of the selection", fragment: "<?xml version=\"1.0\"?><a/>" },
    { name: "doctype at the start of the selection", fragment: "<!DOCTYPE a><a/>" },
    { name: "processing instruction", fragment: "<?pi data?><a/>" },
    { name: "xml:space preserve inside the selection", fragment: "<a xml:space=\"preserve\">  keep   me  </a>" },
    { name: "orphan end tags", fragment: "</b></a>" },
    { name: "unclosed start tags", fragment: "<a><b>text" },
    { name: "selection ends mid-tag", fragment: "<a><b attr=\"v" },
    { name: "leading indentation on the first line", fragment: "        <a><b/></a>" },
];
