import { describe, it, expect } from 'vitest';
import * as childProcess from 'node:child_process';
import * as path from 'node:path';
import { FormattingActionKind } from '../formattingActionKind';
import { JsonInputDto } from '../jsonInputDto';
import { ISettings, Settings } from '../settings';

const dllPath = path.resolve(process.cwd(), 'lib/XmlFormatter.CommandLine.dll');

function runDll(
    xmlString: string,
    actionKind: FormattingActionKind,
    formattingOptionOverrides: Partial<ISettings> = {}): Promise<string> {
    const settings = new Settings({
        indentLength: 4,
        useSingleQuotes: false,
        useSelfClosingTags: true,
        formatOnSave: false,
        allowSingleQuoteInAttributeValue: true,
        addSpaceBeforeSelfClosingTag: true,
        wrapCommentTextWithSpaces: true,
        allowWhiteSpaceUnicodesInAttributeValues: true,
        positionFirstAttributeOnSameLine: true,
        positionAllAttributesOnFirstLine: false,
        preserveWhiteSpacesInComment: false,
        addSpaceBeforeEndOfXmlDeclaration: false,
        addXmlDeclarationIfMissing: false,
        attributesInNewlineThreshold: 1,
        addEmptyLineBetweenElements: false,
        addEmptyEol: false,
        preserveNewLines: false,
        preserveCommentPlacement: false,
        escapeInvisibleNonAsciiCharacters: false,
        enableLogs: false,
        ...formattingOptionOverrides,
    });

    const input = JSON.stringify(new JsonInputDto(xmlString, actionKind, settings));

    const cli = childProcess.spawn('dotnet', [dllPath], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    cli.stdout.setEncoding('utf8');
    cli.stdout.on('data', (data) => { stdout += data; });

    cli.stderr.setEncoding('utf8');
    cli.stderr.on('data', (data) => { stderr += data; });

    return new Promise<string>((resolve, reject) => {
        cli.on('close', (exitCode) => {
            if (exitCode !== 0) {
                reject(new Error(`DLL exited with code ${exitCode}: ${stderr}`));
            } else {
                resolve(stdout);
            }
        });
        cli.stdin.end(input, 'utf-8');
    });
}

describe('DLL integration — EOL behavior', () => {
    it('Format output does not end with a trailing newline', async () => {
        const result = await runDll('<Root><Child/></Root>', FormattingActionKind.format);
        expect(result).toContain('<Root>');
        expect(result).toContain('</Root>');
        expect(result).not.toMatch(/[\r\n]$/);
    }, 15000);

    it('Format output strips input trailing LF', async () => {
        const result = await runDll('<Root><Child/></Root>\n', FormattingActionKind.format);
        expect(result).not.toMatch(/[\r\n]$/);
    }, 15000);

    it('Format output strips input trailing CRLF', async () => {
        const result = await runDll('<Root><Child/></Root>\r\n', FormattingActionKind.format);
        expect(result).not.toMatch(/[\r\n]$/);
    }, 15000);

    it('Minimize output does not end with a trailing newline', async () => {
        const result = await runDll('<Root>\n    <Child />\n</Root>', FormattingActionKind.minimize);
        expect(result).not.toMatch(/[\r\n]$/);
        // Minimized should be a single line
        expect(result).not.toContain('\n');
    }, 15000);

    it('Format preserves internal CRLF in CDATA and comments without trailing newline', async () => {
        const input = '<Root><!-- comment\r\nline2 --><![CDATA[cdata\r\nline2]]></Root>\r\n';
        const result = await runDll(input, FormattingActionKind.format);
        expect(result).not.toMatch(/[\r\n]$/);
        expect(result).toContain('comment');
        expect(result).toContain('cdata');
    }, 15000);

    it('Format handles unicode characters with trailing CRLF cleanly', async () => {
        const input = '<Root greeting="こんにちは">✨ XML 🚀</Root>\r\n';
        const result = await runDll(input, FormattingActionKind.format);
        expect(result).not.toMatch(/[\r\n]$/);
        expect(result).toContain('greeting="こんにちは"');
        expect(result).toContain('✨ XML 🚀');
    }, 15000);
});

describe('DLL integration — non-ASCII characters are not escaped (#216)', () => {
    const xslWithUmlauts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0">',
        '<xsl:template match="/"><xsl:text>ü</xsl:text><xsl:sequence select="\'ü\'" /></xsl:template>',
        '</xsl:stylesheet>',
    ].join('\n');

    it.each([true, false])(
        'Format keeps umlauts literal with allowWhiteSpaceUnicodesInAttributeValues=%s',
        async (allowWhiteSpaceUnicodesInAttributeValues) => {
            const result = await runDll(xslWithUmlauts, FormattingActionKind.format, { allowWhiteSpaceUnicodesInAttributeValues });
            expect(result).toContain('<xsl:text>ü</xsl:text>');
            expect(result).toContain('select="\'ü\'"');
            expect(result).not.toContain('&#x');
        },
        15000);

    it('Minimize keeps umlauts literal', async () => {
        const result = await runDll(xslWithUmlauts, FormattingActionKind.minimize);
        expect(result).toContain('<xsl:text>ü</xsl:text>');
        expect(result).not.toContain('&#x');
    }, 15000);

    it('Format keeps accented, CJK and astral characters literal in text and attributes', async () => {
        const result = await runDll('<Root a="Straße" b="こんにちは" c="😀">äöüß ✨ 🚀</Root>', FormattingActionKind.format);
        expect(result).toContain('a="Straße"');
        expect(result).toContain('b="こんにちは"');
        expect(result).toContain('c="😀"');
        expect(result).toContain('äöüß ✨ 🚀');
        expect(result).not.toContain('&#x');
    }, 15000);

    it('Format resolves numeric character references in the input to literal characters', async () => {
        const result = await runDll('<Root>&#xFC;</Root>', FormattingActionKind.format);
        expect(result).toContain('<Root>ü</Root>');
    }, 15000);

    /*
     * allowWhiteSpaceUnicodesInAttributeValues escapes whitespace unicodes only.
     * The #216 fix must not have widened it back into escaping every non-ASCII
     * character, nor narrowed it into dropping the whitespace escaping.
     */
    it('Format still escapes whitespace unicodes in attribute values when enabled', async () => {
        const input = '<Root a="line1&#10;line2&#9;tab" />';

        const enabled = await runDll(input, FormattingActionKind.format, { allowWhiteSpaceUnicodesInAttributeValues: true });
        expect(enabled).toContain('a="line1&#xA;line2&#x9;tab"');

        const disabled = await runDll(input, FormattingActionKind.format, { allowWhiteSpaceUnicodesInAttributeValues: false });
        expect(disabled).toContain('a="line1\nline2\ttab"');
    }, 15000);
});

describe('DLL integration — earlier unicode fixes stay fixed (#208, #209, #211)', () => {
    /*
     * #211: whitespace unicodes in attribute values must survive as entities.
     * Engine 2.2.0 turned &#xD; into a literal CR, corrupting the transform's
     * line endings. The #216 fix must not reopen that.
     */
    it('#211 keeps &#xD;&#xA; escaped in attribute values', async () => {
        const result = await runDll('<Root sep="&#xD;&#xA;" b="x" />',
            FormattingActionKind.format,
            { allowWhiteSpaceUnicodesInAttributeValues: true });
        expect(result).toContain('sep="&#xD;&#xA;"');
        expect(result).not.toContain('\r');
    }, 15000);

    it('#209 retains a lone space inside xsl:text when preserveNewLines is on', async () => {
        const input = [
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0">',
            '<xsl:template match="/"><xsl:value-of select="a" /><xsl:text> </xsl:text><xsl:value-of select="b" /></xsl:template>',
            '</xsl:stylesheet>',
        ].join('\n');
        const result = await runDll(input, FormattingActionKind.format, { preserveNewLines: true });
        expect(result).toContain('<xsl:text> </xsl:text>');
        expect(result).not.toContain('<xsl:text />');
    }, 15000);

    /*
     * #208: &#160; in element text. The #216 fix stops re-escaping it, so it
     * comes back as a literal U+00A0 rather than as an entity. That is the same
     * XML, and what must never return is the corruption the issue reported:
     * a replacement character, a lone surrogate, or a plain space.
     */
    it('#208 emits a real non-breaking space, not a corrupted character', async () => {
        const result = await runDll('<Root><xsl:text xmlns:xsl="u"> |&#160;Something</xsl:text></Root>', FormattingActionKind.format);
        const textNode = result.match(/>([^<]*)<\/xsl:text>/)?.[1] ?? '';
        expect(textNode).toContain('\u00A0');
        expect(textNode).not.toContain('\uFFFD');
        expect(textNode).toBe(' |\u00A0Something');
    }, 15000);

    it('#208 astral characters survive without lone surrogates', async () => {
        const result = await runDll('<Root a="\u{1F600}">\u{1F600} \u{1D11E} \u{10437}</Root>', FormattingActionKind.format);
        const textNode = result.match(/>([^<]*)<\/Root>/)?.[1] ?? '';
        expect(textNode).toBe('\u{1F600} \u{1D11E} \u{10437}');
        expect([...textNode].some(c => c.codePointAt(0)! >= 0xD800 && c.codePointAt(0)! <= 0xDFFF)).toBe(false);
    }, 15000);

    it('Formatting is idempotent for non-ASCII content', async () => {
        const input = '<Root a="Straße"><xsl:text xmlns:xsl="u"> |&#160;ü 😀</xsl:text></Root>';
        const first = await runDll(input, FormattingActionKind.format);
        const second = await runDll(first, FormattingActionKind.format);
        expect(second).toBe(first);
    }, 15000);
});

/*
 * escapeInvisibleNonAsciiCharacters (#42) escapes the non-ASCII characters that
 * draw nothing and nothing else. It is the narrow half of what v2.3.0 used to do
 * to every non-ASCII character, which is what #216 removed - so every test here
 * asserting an escape has a counterpart asserting a visible character is left
 * alone. Invisible characters are written as \u escapes rather than as
 * themselves throughout, since the subject matter is characters you cannot see.
 */
describe('DLL integration — escapeInvisibleNonAsciiCharacters (#42)', () => {
    const nbsp = '\u00A0';
    const zwsp = '\u200B';

    it('Off leaves invisible non-ASCII characters literal', async () => {
        const result = await runDll(`<Root a="x${nbsp}y">a${zwsp}b</Root>`,
            FormattingActionKind.format,
            { escapeInvisibleNonAsciiCharacters: false });
        expect(result).toBe(`<Root a="x${nbsp}y">a${zwsp}b</Root>`);
        expect(result).not.toContain('&#x');
    }, 15000);

    it('On escapes invisible non-ASCII characters in text and attribute values', async () => {
        const result = await runDll(`<Root a="x${nbsp}y">a${zwsp}b</Root>`,
            FormattingActionKind.format,
            { escapeInvisibleNonAsciiCharacters: true });
        expect(result).toBe('<Root a="x&#xA0;y">a&#x200B;b</Root>');
    }, 15000);

    it('On resolves an input character reference and writes it back as one', async () => {
        const result = await runDll('<Root>a&#xA0;b</Root>',
            FormattingActionKind.format,
            { escapeInvisibleNonAsciiCharacters: true });
        expect(result).toBe('<Root>a&#xA0;b</Root>');
    }, 15000);

    /*
     * The point of the option being named for *invisible* characters: with it on,
     * the #216 fix must still hold for everything that draws something.
     */
    it.each([true, false])(
        'Visible non-ASCII characters stay literal with escapeInvisibleNonAsciiCharacters=%s',
        async (escapeInvisibleNonAsciiCharacters) => {
            const result = await runDll('<Root a="Straße" b="日本">ü 日 \u{1F600} €</Root>',
                FormattingActionKind.format,
                { escapeInvisibleNonAsciiCharacters });
            expect(result).toContain('a="Straße"');
            expect(result).toContain('b="日本"');
            expect(result).toContain('ü 日 \u{1F600} €');
            expect(result).not.toContain('&#x');
        },
        15000);

    /*
     * The set is decided by Unicode general category - Zs/Zl/Zp separators, Cf
     * format characters and the C1 controls - rather than by a hand-kept list of
     * the characters someone has reported.
     */
    it.each([
        ['U+00A0 no-break space (Zs)', '\u00A0', '&#xA0;'],
        ['U+2003 em space (Zs)', '\u2003', '&#x2003;'],
        ['U+3000 ideographic space (Zs)', '\u3000', '&#x3000;'],
        ['U+2028 line separator (Zl)', '\u2028', '&#x2028;'],
        ['U+200B zero width space (Cf)', '\u200B', '&#x200B;'],
        ['U+200E left-to-right mark (Cf)', '\u200E', '&#x200E;'],
        ['U+2060 word joiner (Cf)', '\u2060', '&#x2060;'],
        ['U+00AD soft hyphen (Cf)', '\u00AD', '&#xAD;'],
        ['U+FEFF zero width no-break space (Cf)', '\uFEFF', '&#xFEFF;'],
        ['U+0085 next line (Cc)', '\u0085', '&#x85;'],
    ])('On escapes %s', async (_name, character, expected) => {
        const result = await runDll(`<Root>a${character}b</Root>`,
            FormattingActionKind.format,
            { escapeInvisibleNonAsciiCharacters: true });
        expect(result).toBe(`<Root>a${expected}b</Root>`);
    }, 15000);

    /*
     * A combining mark is not invisible: U+0301 draws the accent, and the letter
     * under it is wrong without it.
     */
    it('On leaves a combining mark literal', async () => {
        const result = await runDll('<Root>e\u0301</Root>',
            FormattingActionKind.format,
            { escapeInvisibleNonAsciiCharacters: true });
        expect(result).toBe('<Root>e\u0301</Root>');
    }, 15000);

    /*
     * Escaping the halves of a surrogate pair separately would emit
     * &#xDB40;&#xDC20;, which no parser reads back. The pair is read whole.
     */
    it('On writes an invisible character outside the basic plane as one reference', async () => {
        const result = await runDll('<Root>a\u{E0020}b</Root>',
            FormattingActionKind.format,
            { escapeInvisibleNonAsciiCharacters: true });
        expect(result).toBe('<Root>a&#xE0020;b</Root>');
        expect(result).not.toContain('&#xDB40;');
    }, 15000);

    /*
     * The boundary with allowWhiteSpaceUnicodesInAttributeValues. Tab, newline
     * and CR are invisible too and belong to that option alone; this one starts
     * above ASCII. They partition the invisible characters and neither defers to
     * the other, so an attribute can come out holding a literal tab next to an
     * escaped NBSP. That reads as a contradiction and is the specification.
     */
    it.each([
        [false, false, `a="tab\tgap${nbsp}end"`],
        [false, true, 'a="tab\tgap&#xA0;end"'],
        [true, false, `a="tab&#x9;gap${nbsp}end"`],
        [true, true, 'a="tab&#x9;gap&#xA0;end"'],
    ])('The two escaping options decide different characters (allowWhiteSpaceUnicodes=%s, escapeInvisibleNonAscii=%s)',
        async (allowWhiteSpaceUnicodesInAttributeValues, escapeInvisibleNonAsciiCharacters, expected) => {
            const result = await runDll('<r a="tab&#x9;gap&#xA0;end" />',
                FormattingActionKind.format,
                { allowWhiteSpaceUnicodesInAttributeValues, escapeInvisibleNonAsciiCharacters });
            expect(result).toContain(expected);
        },
        15000);

    /*
     * CDATA and comments resolve no character references, so writing one into
     * either would replace the character with the six characters that spell its
     * name - a content change, not an escaping. Both are left alone.
     */
    it.each([true, false])(
        'CDATA content is untouched with escapeInvisibleNonAsciiCharacters=%s',
        async (escapeInvisibleNonAsciiCharacters) => {
            const result = await runDll(`<Root><![CDATA[a${nbsp}b]]></Root>`,
                FormattingActionKind.format,
                { escapeInvisibleNonAsciiCharacters });
            expect(result).toContain(`<![CDATA[a${nbsp}b]]>`);
            expect(result).not.toContain('&#xA0;');
        },
        15000);

    it.each([true, false])(
        'Comment content is untouched with escapeInvisibleNonAsciiCharacters=%s',
        async (escapeInvisibleNonAsciiCharacters) => {
            const result = await runDll(`<Root><!--a${nbsp}b--></Root>`,
                FormattingActionKind.format,
                { escapeInvisibleNonAsciiCharacters });
            expect(result).toContain(`<!-- a${nbsp}b -->`);
            expect(result).not.toContain('&#xA0;');
        },
        15000);

    /*
     * The case the option earns its place on, and a stronger form of #208 than
     * the issue describes: Trim() counts NBSP as whitespace, and the reflow
     * branch trims every line of a multi-line text node. Off, an NBSP at the
     * edge of a reflowed line is not merely invisible - it is deleted.
     */
    it('Off a NBSP at the edge of a reflowed line is lost', async () => {
        const result = await runDll(`<r>\n  ${nbsp}first\nsecond${nbsp}\n</r>`,
            FormattingActionKind.format,
            { escapeInvisibleNonAsciiCharacters: false });
        expect(result).not.toContain(nbsp);
    }, 15000);

    it('On a NBSP at the edge of a reflowed line survives', async () => {
        const result = await runDll(`<r>\n  ${nbsp}first\nsecond${nbsp}\n</r>`,
            FormattingActionKind.format,
            { escapeInvisibleNonAsciiCharacters: true });
        expect(result).toContain('&#xA0;first');
        expect(result).toContain('second&#xA0;');
    }, 15000);

    it('On formatting is idempotent', async () => {
        const input = `<Root a="x${nbsp}y">a${zwsp} b${nbsp}ü \u{1F600}</Root>`;
        const first = await runDll(input, FormattingActionKind.format, { escapeInvisibleNonAsciiCharacters: true });
        const second = await runDll(first, FormattingActionKind.format, { escapeInvisibleNonAsciiCharacters: true });
        expect(second).toBe(first);
    }, 15000);

    /*
     * Minimize consults no Options at all - it writes through XmlWriter directly.
     * The setting is documented as a Prettify XML setting, and this pins that
     * scope so a later engine change cannot widen it unnoticed.
     */
    it.each([true, false])(
        'Minimize is unaffected by escapeInvisibleNonAsciiCharacters=%s',
        async (escapeInvisibleNonAsciiCharacters) => {
            const result = await runDll(`<Root a="x${nbsp}y">a${zwsp}b</Root>`,
                FormattingActionKind.minimize,
                { escapeInvisibleNonAsciiCharacters });
            expect(result).toContain(`a="x${nbsp}y"`);
            expect(result).toContain(`>a${zwsp}b<`);
            expect(result).not.toContain('&#x');
        },
        15000);
});
