import { describe, it, expect } from 'vitest';
import { TextXmlFormatter } from '../regexFormatter';
import { defaultSettings, Settings } from '../settings';

function format(xml: string, overrides: Partial<Settings> = {}): string {
    return new TextXmlFormatter({ ...defaultSettings, ...overrides }).formatXmlPretty(xml);
}

/*
 * Range/selection formatting never reaches the .NET engine, so it never had the
 * #216 escaping bug. These pin that down: the regex formatter must keep passing
 * non-ASCII through untouched, and must not gain escaping of its own.
 */
describe('TextXmlFormatter — non-ASCII characters are not escaped (#216)', () => {
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
