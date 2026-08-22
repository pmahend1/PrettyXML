import { describe, it, expect } from 'vitest';
import * as childProcess from 'node:child_process';
import * as path from 'node:path';

const dllPath = path.resolve(process.cwd(), 'lib/XmlFormatter.CommandLine.dll');
function runDll(xmlString: string, actionKind: 'Format' | 'Minimize'): Promise<string> {
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
        expect(result).toContain('&#x3053;&#x3093;&#x306B;&#x3061;&#x306F;');
        expect(result).toContain('&#x2728; XML &#x1F680;');
    }, 15000);
});
