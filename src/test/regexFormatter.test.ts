import { describe, it, expect } from 'vitest';
import { TextXmlFormatter } from '../regexFormatter';
import { defaultSettings, Settings } from '../settings';

function format(xml: string, overrides: Partial<Settings> = {}): string {
    return new TextXmlFormatter({ ...defaultSettings, ...overrides }).formatXmlPretty(xml);
}

/*
 * Range/selection formatting never reaches the .NET engine, so it never had the
 * #216 escaping bug. These pin that down: the regex formatter must keep passing
 * *visible* non-ASCII through untouched. Escaping the invisible ones is a separate,
 * opt-in behavior that only escapeInvisibleNonAsciiCharacters turns on - the block
 * below covers it - so these stay green either way, the default being false.
 */
describe('TextXmlFormatter — visible non-ASCII characters are not escaped (#216)', () => {
    it('keeps umlauts literal in element text', () => {
        const result = format('<xsl:template match="/"><xsl:text>ü</xsl:text></xsl:template>');
        expect(result).toContain('ü');
        expect(result).not.toContain('&#x');
    });

    it('keeps umlauts literal in attribute values', () => {
        const result = format('<xsl:sequence select="\'ü\'" />');
        expect(result).toContain('select="\'ü\'"');
        expect(result).not.toContain('&#x');
    });

    it('keeps accented, CJK and astral characters literal', () => {
        const result = format('<Root a="Straße" b="こんにちは" c="😀">äöüß ✨ 🚀</Root>');
        expect(result).toContain('a="Straße"');
        expect(result).toContain('b="こんにちは"');
        expect(result).toContain('c="😀"');
        expect(result).toContain('äöüß ✨ 🚀');
        expect(result).not.toContain('&#x');
    });

    it('leaves numeric character references in the input untouched', () => {
        expect(format('<Root>&#xFC;</Root>')).toContain('&#xFC;');
    });

    it('keeps non-ASCII literal while normalizing attribute quotes', () => {
        expect(format('<Root a=\'ü\' b=\'x\' />', { useSingleQuotes: false })).toContain('a="ü"');
        expect(format('<Root a="ü" b="x" />', { useSingleQuotes: true })).toContain("a='ü'");
    });

    it('keeps non-ASCII literal in element and attribute names', () => {
        const result = format('<Grüße straße="1" />');
        expect(result).toContain('<Grüße');
        expect(result).toContain('straße="1"');
    });

    it('keeps non-ASCII literal in comments and CDATA', () => {
        const result = format('<Root><!-- über --><![CDATA[äöü]]></Root>', { wrapCommentTextWithSpaces: true });
        expect(result).toContain('<!-- über -->');
        expect(result).toContain('<![CDATA[äöü]]>');
    });
});

/*
 * escapeInvisibleNonAsciiCharacters reaches range formatting too. The rules are read off the
 * engine's TryReadInvisibleNonAscii, not off the option name: at or above U+0080 only, by Unicode
 * category rather than by a list, surrogate pairs whole, uppercase hex, and text and attribute
 * values only.
 */
describe('TextXmlFormatter \u2014 escapeInvisibleNonAsciiCharacters', () => {
    const escaping = { escapeInvisibleNonAsciiCharacters: true };

    it('leaves invisible characters literal when the option is off', () => {
        const result = format('<Line note="10\u00A0km">Total\u00A0price</Line>');
        expect(result).toContain('note="10\u00A0km"');
        expect(result).toContain('Total\u00A0price');
        expect(result).not.toContain('&#x');
    });

    it('escapes a non-breaking space in element text', () => {
        expect(format('<Line>Total\u00A0price</Line>', escaping)).toContain('Total&#xA0;price');
    });

    it('escapes a non-breaking space in an attribute value', () => {
        expect(format('<Line note="10\u00A0km" />', escaping)).toContain('note="10&#xA0;km"');
    });

    it('escapes zero-width and bidi format characters', () => {
        const result = format('<Root a="x\u200By">A\u200BB\u200EC\uFEFFD</Root>', escaping);
        expect(result).toContain('a="x&#x200B;y"');
        expect(result).toContain('A&#x200B;B&#x200E;C&#xFEFF;D');
    });

    it('escapes C1 controls and leaves tab, newline and carriage return alone', () => {
        const result = format('<Root a="x\u0085y">p\tq</Root>', escaping);
        expect(result).toContain('a="x&#x85;y"');
        expect(result).toContain('p\tq');
        expect(result).not.toContain('&#x9;');
    });

    it('reads a surrogate pair as one code point', () => {
        const result = format('<Root>tag\u{E0020}space</Root>', escaping);
        expect(result).toContain('tag&#xE0020;space');
        expect(result).not.toContain('&#xDB40;');
    });

    it('writes the hex in uppercase', () => {
        expect(format('<Root>a\u200Fb</Root>', escaping)).toContain('&#x200F;');
    });

    it('keeps visible non-ASCII literal while escaping the invisible ones', () => {
        const result = format('<Root a="M\u00FCller\u00A0GmbH">\u65E5 \u{1F600}\u200B</Root>', escaping);
        expect(result).toContain('a="M\u00FCller&#xA0;GmbH"');
        expect(result).toContain('\u65E5 \u{1F600}&#x200B;');
    });

    it('leaves comments and CDATA untouched - neither resolves character references', () => {
        const result = format('<Root><!-- a\u00A0b --><![CDATA[c\u00A0d]]></Root>', escaping);
        expect(result).toContain('<!-- a\u00A0b -->');
        expect(result).toContain('<![CDATA[c\u00A0d]]>');
        expect(result).not.toContain('&#xA0;');
    });

    it('leaves element and attribute names alone', () => {
        const result = format('<Gr\u200B\u00FC stra\u200B\u00DFe="1\u200B" />', escaping);
        expect(result).toContain('<Gr\u200B\u00FC');
        expect(result).toContain('stra\u200B\u00DFe="1&#x200B;"');
    });

    /*
     * The #208 data loss and the reason escaping has to run before the trim: JS trim() counts NBSP
     * as whitespace, so the edge character is deleted with the option off and survives with it on.
     */
    it('keeps an invisible character at the edge of a text node', () => {
        const dropped = format('<Root>\u00A0first</Root>');
        expect(dropped).toContain('first');
        expect(dropped).not.toContain('\u00A0');

        expect(format('<Root>\u00A0first</Root>', escaping)).toContain('&#xA0;first');
    });

    it('emits a text node made only of invisible characters, as the engine does', () => {
        expect(format('<Root><A>\u00A0</A></Root>')).not.toContain('&#xA0;');
        expect(format('<Root><A>\u00A0</A></Root>', escaping)).toContain('&#xA0;');
    });

    it('escapes while normalizing attribute quotes', () => {
        const single = format('<Root a="x\u00A0y" />', { ...escaping, useSingleQuotes: true });
        expect(single).toContain("a='x&#xA0;y'");
        const double = format("<Root a='x\u00A0y' />", { ...escaping, useSingleQuotes: false });
        expect(double).toContain('a="x&#xA0;y"');
    });

    it('keeps the spacing around an unnormalized attribute\'s equals sign', () => {
        const result = format('<Root a = "x\u00A0y" />', escaping);
        expect(result).toContain('a = "x&#xA0;y"');
    });
});

/*
 * The two bugs the tokenizer exists to fix. Both destroyed real documents and neither needed a
 * tree - they are here rather than in the tokenizer's own suite because what the user sees is the
 * formatted selection, not the token stream.
 */
describe('TextXmlFormatter — the tokenizer bugs', () => {
    it('keeps a tag whose attribute value contains a greater-than sign in one piece', () => {
        expect(format('<a b="x>y"><c/></a>')).toBe('<a b="x>y">\n    <c />\n</a>');
    });

    it('keeps a single-quoted value containing a greater-than sign in one piece', () => {
        expect(format('<a b=\'x>y\'/>', { useSingleQuotes: true })).toBe("<a b='x>y' />");
    });

    /*
     * `<a /  >` rendered self-closed while the depth counter was still incremented, so every line
     * after it in the selection came out one level too deep - and formatting twice never settled.
     */
    it('does not open a depth for a self-closing tag with spaces before its bracket', () => {
        expect(format('<r><a /  ><b/></r>')).toBe('<r>\n    <a />\n    <b />\n</r>');
    });

    it('formats a selection carrying both bugs idempotently', () => {
        const once = format('<r><a /  ><b c="x>y"/></r>');
        expect(format(once)).toBe(once);
    });

    /*
     * A third one the tokenizer settles on the way past: only `<!DOCTYPE` used to be recognized as
     * a declaration, so every other `<!...>` fell through to the start-tag branch and opened a
     * depth that nothing ever closed.
     */
    it('does not open a depth for a markup declaration that is not a DOCTYPE', () => {
        expect(format('<r><!ENTITY e "x"><a/></r>')).toBe('<r>\n    <!ENTITY e "x">\n    <a />\n</r>');
    });

    it('keeps a DOCTYPE whose internal subset contains a greater-than sign in one piece', () => {
        expect(format('<!DOCTYPE a [<!ENTITY e "x">]><a/>')).toBe('<!DOCTYPE a [<!ENTITY e "x">]>\n<a />');
    });
});
