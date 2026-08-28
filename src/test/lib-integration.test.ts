import { describe, it, expect } from 'vitest';
import * as childProcess from 'node:child_process';
import * as path from 'node:path';

const dllPath = path.resolve(process.cwd(), 'lib/XmlFormatter.CommandLine.dll');
function runDll(xmlString: string,
                actionKind: 'Format' | 'Minimize',
                formattingOptionOverrides: Record<string, unknown> = {}): Promise<string> {
    const input = JSON.stringify({
        xmlString,
        formattingOptions: {
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
            enableLogs: false,
            ...formattingOptionOverrides,
        },
        actionKind,
    });

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
        const result = await runDll('<Root><Child/></Root>', 'Format');
        expect(result).toContain('<Root>');
        expect(result).toContain('</Root>');
        expect(result).not.toMatch(/[\r\n]$/);
    }, 15000);

    it('Format output strips input trailing LF', async () => {
        const result = await runDll('<Root><Child/></Root>\n', 'Format');
        expect(result).not.toMatch(/[\r\n]$/);
    }, 15000);

    it('Format output strips input trailing CRLF', async () => {
        const result = await runDll('<Root><Child/></Root>\r\n', 'Format');
        expect(result).not.toMatch(/[\r\n]$/);
    }, 15000);

    it('Minimize output does not end with a trailing newline', async () => {
        const result = await runDll('<Root>\n    <Child />\n</Root>', 'Minimize');
        expect(result).not.toMatch(/[\r\n]$/);
        // Minimized should be a single line
        expect(result).not.toContain('\n');
    }, 15000);

    it('Format preserves internal CRLF in CDATA and comments without trailing newline', async () => {
        const input = '<Root><!-- comment\r\nline2 --><![CDATA[cdata\r\nline2]]></Root>\r\n';
        const result = await runDll(input, 'Format');
        expect(result).not.toMatch(/[\r\n]$/);
        expect(result).toContain('comment');
        expect(result).toContain('cdata');
    }, 15000);

    it('Format handles unicode characters with trailing CRLF cleanly', async () => {
        const input = '<Root greeting="こんにちは">✨ XML 🚀</Root>\r\n';
        const result = await runDll(input, 'Format');
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
            const result = await runDll(xslWithUmlauts, 'Format', { allowWhiteSpaceUnicodesInAttributeValues });
            expect(result).toContain('<xsl:text>ü</xsl:text>');
            expect(result).toContain('select="\'ü\'"');
            expect(result).not.toContain('&#x');
        },
        15000);

    it('Minimize keeps umlauts literal', async () => {
        const result = await runDll(xslWithUmlauts, 'Minimize');
        expect(result).toContain('<xsl:text>ü</xsl:text>');
        expect(result).not.toContain('&#x');
    }, 15000);

    it('Format keeps accented, CJK and astral characters literal in text and attributes', async () => {
        const result = await runDll('<Root a="Straße" b="こんにちは" c="😀">äöüß ✨ 🚀</Root>', 'Format');
        expect(result).toContain('a="Straße"');
        expect(result).toContain('b="こんにちは"');
        expect(result).toContain('c="😀"');
        expect(result).toContain('äöüß ✨ 🚀');
        expect(result).not.toContain('&#x');
    }, 15000);

    it('Format resolves numeric character references in the input to literal characters', async () => {
        const result = await runDll('<Root>&#xFC;</Root>', 'Format');
        expect(result).toContain('<Root>ü</Root>');
    }, 15000);

    /*
     * allowWhiteSpaceUnicodesInAttributeValues escapes whitespace unicodes only.
     * The #216 fix must not have widened it back into escaping every non-ASCII
     * character, nor narrowed it into dropping the whitespace escaping.
     */
    it('Format still escapes whitespace unicodes in attribute values when enabled', async () => {
        const input = '<Root a="line1&#10;line2&#9;tab" />';

        const enabled = await runDll(input, 'Format', { allowWhiteSpaceUnicodesInAttributeValues: true });
        expect(enabled).toContain('a="line1&#xA;line2&#x9;tab"');

        const disabled = await runDll(input, 'Format', { allowWhiteSpaceUnicodesInAttributeValues: false });
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
                                    'Format',
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
        const result = await runDll(input, 'Format', { preserveNewLines: true });
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
        const result = await runDll('<Root><xsl:text xmlns:xsl="u"> |&#160;Something</xsl:text></Root>', 'Format');
        const textNode = result.match(/>([^<]*)<\/xsl:text>/)?.[1] ?? '';
        expect(textNode).toContain('\u00A0');
        expect(textNode).not.toContain('\uFFFD');
        expect(textNode).toBe(' |\u00A0Something');
    }, 15000);

    it('#208 astral characters survive without lone surrogates', async () => {
        const result = await runDll('<Root a="\u{1F600}">\u{1F600} \u{1D11E} \u{10437}</Root>', 'Format');
        const textNode = result.match(/>([^<]*)<\/Root>/)?.[1] ?? '';
        expect(textNode).toBe('\u{1F600} \u{1D11E} \u{10437}');
        expect([...textNode].some(c => c.codePointAt(0)! >= 0xD800 && c.codePointAt(0)! <= 0xDFFF)).toBe(false);
    }, 15000);

    it('Formatting is idempotent for non-ASCII content', async () => {
        const input = '<Root a="Straße"><xsl:text xmlns:xsl="u"> |&#160;ü 😀</xsl:text></Root>';
        const first = await runDll(input, 'Format');
        const second = await runDll(first, 'Format');
        expect(second).toBe(first);
    }, 15000);
});
