import { describe, it, expect } from 'vitest';
import { appendEolIfMissing, preserveOriginalEol } from '../eolHelper';
import { Settings } from '../settings';
import { TextXmlFormatter } from '../regexFormatter';

// ---------------------------------------------------------------------------
// appendEolIfMissing — the pure helper
// ---------------------------------------------------------------------------
describe('appendEolIfMissing', () => {
    it('adds LF when text has no trailing newline', () => {
        const result = appendEolIfMissing('<Root />', '<Root />');
        expect(result).toBe('<Root />\n');
    });

    it('adds CRLF when formatted text contains CRLF', () => {
        const result = appendEolIfMissing('<Root>\r\n    <Child />\r\n</Root>', '<Root><Child/></Root>');
        expect(result).toBe('<Root>\r\n    <Child />\r\n</Root>\r\n');
    });

    it('adds CRLF when original text contains CRLF even if formatted does not', () => {
        const result = appendEolIfMissing('<Root />', '<Root />\r\n');
        expect(result).toBe('<Root />\r\n');
    });

    it('does not double-add when text already ends with LF', () => {
        const result = appendEolIfMissing('<Root />\n', '<Root />');
        expect(result).toBe('<Root />\n');
    });

    it('does not double-add when text already ends with CRLF', () => {
        const result = appendEolIfMissing('<Root />\r\n', '<Root />');
        expect(result).toBe('<Root />\r\n');
    });

    it('returns empty string unchanged', () => {
        const result = appendEolIfMissing('', '');
        expect(result).toBe('');
    });

    it('handles single character text', () => {
        const result = appendEolIfMissing('x', 'x');
        expect(result).toBe('x\n');
    });

    it('handles text that is just a newline', () => {
        const result = appendEolIfMissing('\n', '\n');
        expect(result).toBe('\n');
    });
});

// ---------------------------------------------------------------------------
// preserveOriginalEol — restore original EOL if DLL stripped it
// ---------------------------------------------------------------------------
describe('preserveOriginalEol', () => {
    it('restores LF when original ended with LF', () => {
        const result = preserveOriginalEol('<Root />', '<Root />\n');
        expect(result).toBe('<Root />\n');
    });

    it('restores CRLF when original ended with CRLF', () => {
        const result = preserveOriginalEol('<Root />', '<Root />\r\n');
        expect(result).toBe('<Root />\r\n');
    });

    it('does not add EOL when original had none', () => {
        const result = preserveOriginalEol('<Root />', '<Root />');
        expect(result).toBe('<Root />');
    });

    it('does not double-add when text already ends with LF', () => {
        const result = preserveOriginalEol('<Root />\n', '<Root />\n');
        expect(result).toBe('<Root />\n');
    });

    it('does not double-add when text already ends with CRLF', () => {
        const result = preserveOriginalEol('<Root />\r\n', '<Root />\r\n');
        expect(result).toBe('<Root />\r\n');
    });

    it('returns empty string unchanged', () => {
        const result = preserveOriginalEol('', '');
        expect(result).toBe('');
    });

    it('returns text unchanged when original is empty', () => {
        const result = preserveOriginalEol('<Root />', '');
        expect(result).toBe('<Root />');
    });
});

// ---------------------------------------------------------------------------
// TextXmlFormatter.formatXmlPretty — must NEVER append EOL
// (range formatter operates on selections, not whole files)
// ---------------------------------------------------------------------------
describe('TextXmlFormatter.formatXmlPretty', () => {
    const xmlInput = '<Root><Child/></Root>';

    it('never appends EOL regardless of addEmptyEol=true', () => {
        const settings = new Settings({ addEmptyEol: true });
        const formatter = new TextXmlFormatter(settings);
        const result = formatter.formatXmlPretty(xmlInput);
        expect(result).not.toMatch(/\n$/);
        expect(result).toContain('<Root>');
        expect(result).toContain('<Child />');
        expect(result).toContain('</Root>');
    });

    it('never appends EOL with addEmptyEol=false', () => {
        const settings = new Settings({ addEmptyEol: false });
        const formatter = new TextXmlFormatter(settings);
        const result = formatter.formatXmlPretty(xmlInput);
        expect(result).not.toMatch(/\n$/);
    });

    it('preserves no trailing newline for self-closing root', () => {
        const settings = new Settings({ addEmptyEol: true });
        const formatter = new TextXmlFormatter(settings);
        const result = formatter.formatXmlPretty('<Root />');
        expect(result).toBe('<Root />');
    });
});

// ---------------------------------------------------------------------------
// EOL full-document scenarios (testing the logic that Formatter.formatXml uses)
// The DLL is tested separately; here we simulate DLL output + EOL logic.
// ---------------------------------------------------------------------------
describe('Full document EOL behavior', () => {
    // Simulates what Formatter.formatXml does after getting DLL output
    function applyEolLogic(dllOutput: string, originalDocText: string, addEmptyEol: boolean): string {
        if (addEmptyEol) {
            return appendEolIfMissing(dllOutput, originalDocText);
        }
        return preserveOriginalEol(dllOutput, originalDocText);
    }

    const dllOutput = '<Root>\n    <Child />\n</Root>';  // DLL never adds trailing newline

    describe('addEmptyEol = ON', () => {
        it('adds EOL when document does not have one (case 2)', () => {
            const result = applyEolLogic(dllOutput, '<Root><Child/></Root>', true);
            expect(result).toBe(dllOutput + '\n');
        });

        it('no change when DLL output already has EOL (case 1)', () => {
            const outputWithEol = dllOutput + '\n';
            const result = applyEolLogic(outputWithEol, '<Root><Child/></Root>\n', true);
            expect(result).toBe(outputWithEol);
        });

        it('adds CRLF when original doc used CRLF', () => {
            const result = applyEolLogic(dllOutput, '<Root><Child/></Root>\r\n', true);
            expect(result).toBe(dllOutput + '\r\n');
        });
    });

    describe('addEmptyEol = OFF', () => {
        it('preserves EOL when original had LF (case 3)', () => {
            const result = applyEolLogic(dllOutput, '<Root><Child/></Root>\n', false);
            expect(result).toBe(dllOutput + '\n');
        });

        it('preserves EOL when original had CRLF (case 3)', () => {
            const result = applyEolLogic(dllOutput, '<Root><Child/></Root>\r\n', false);
            expect(result).toBe(dllOutput + '\r\n');
        });

        it('no change when neither has EOL (case 4)', () => {
            const result = applyEolLogic(dllOutput, '<Root><Child/></Root>', false);
            expect(result).toBe(dllOutput);
        });

        it('no change when DLL output already has EOL', () => {
            const outputWithEol = dllOutput + '\n';
            const result = applyEolLogic(outputWithEol, '<Root><Child/></Root>\n', false);
            expect(result).toBe(outputWithEol);
        });
    });
});

// ---------------------------------------------------------------------------
// Minimize — never gets EOL
// ---------------------------------------------------------------------------
describe('Minimize EOL behavior', () => {
    // Simulates Formatter.minimizeXml: preserveOriginalEol only
    function applyMinimizeLogic(dllOutput: string, originalDocText: string): string {
        return preserveOriginalEol(dllOutput, originalDocText);
    }

    it('does not add EOL when original had none', () => {
        const result = applyMinimizeLogic('<Root><Child/></Root>', '<Root>\n    <Child />\n</Root>');
        expect(result).not.toMatch(/\n$/);
    });

    it('preserves LF when original had LF', () => {
        const result = applyMinimizeLogic('<Root><Child/></Root>', '<Root>\n    <Child />\n</Root>\n');
        expect(result).toBe('<Root><Child/></Root>\n');
    });

    it('preserves CRLF when original had CRLF', () => {
        const result = applyMinimizeLogic('<Root><Child/></Root>', '<Root>\r\n    <Child />\r\n</Root>\r\n');
        expect(result).toBe('<Root><Child/></Root>\r\n');
    });
});

// ---------------------------------------------------------------------------
// Range formatter EOL — only at document end
// ---------------------------------------------------------------------------
describe('Range formatter appendEolIfNeeded', () => {
    // Mirrors RangeFormatterProvider.appendEolIfNeeded logic
    function rangeEolLogic(
        formattedText: string,
        originalText: string,
        addEmptyEol: boolean,
        isAtDocumentEnd: boolean,
    ): string {
        if (formattedText.length === 0) {
            return formattedText;
        }
        if (!isAtDocumentEnd) {
            return formattedText;
        }
        if (addEmptyEol) {
            return appendEolIfMissing(formattedText, originalText);
        }
        return preserveOriginalEol(formattedText, originalText);
    }

    const formatted = '<Root>\n    <Child />\n</Root>';

    it('adds EOL when selection is at document end and setting is ON', () => {
        const result = rangeEolLogic(formatted, '<Root><Child/></Root>', true, true);
        expect(result).toBe(formatted + '\n');
    });

    it('does not add EOL when selection is mid-document and setting is ON', () => {
        const result = rangeEolLogic(formatted, '<Root><Child/></Root>', true, false);
        expect(result).toBe(formatted);
    });

    it('preserves EOL at doc end when setting is OFF and original had EOL', () => {
        const result = rangeEolLogic(formatted, '<Root><Child/></Root>\n', false, true);
        expect(result).toBe(formatted + '\n');
    });

    it('does not add EOL when setting is OFF and original had no EOL', () => {
        const result = rangeEolLogic(formatted, '<Root><Child/></Root>', false, true);
        expect(result).toBe(formatted);
    });

    it('no EOL mid-doc regardless of setting or original', () => {
        const resultOn = rangeEolLogic(formatted, '<Root><Child/></Root>\n', true, false);
        expect(resultOn).toBe(formatted);
        const resultOff = rangeEolLogic(formatted, '<Root><Child/></Root>\n', false, false);
        expect(resultOff).toBe(formatted);
    });

    it('returns empty string unchanged even with setting ON at doc end', () => {
        const result = rangeEolLogic('', '', true, true);
        expect(result).toBe('');
    });

    it('does not double-add when formatted text already has EOL at doc end', () => {
        const result = rangeEolLogic(formatted + '\n', '<Root><Child/></Root>', true, true);
        expect(result).toBe(formatted + '\n');
    });

    it('uses CRLF when original text has CRLF at doc end', () => {
        const result = rangeEolLogic(formatted, '<Root><Child/></Root>\r\n', true, true);
        expect(result).toBe(formatted + '\r\n');
    });
});

// ---------------------------------------------------------------------------
// Edge Cases: Cross-Platform (Windows CRLF vs Linux/Unix/Mac LF)
// ---------------------------------------------------------------------------
describe('Cross-Platform EOL edge cases', () => {
    function applyEolLogic(dllOutput: string, originalDocText: string, addEmptyEol: boolean): string {
        if (addEmptyEol) {
            return appendEolIfMissing(dllOutput, originalDocText);
        }
        return preserveOriginalEol(dllOutput, originalDocText);
    }

    it('Windows file (CRLF throughout) preserves CRLF on format when addEmptyEol=ON', () => {
        const windowsOriginal = '<?xml version="1.0"?>\r\n<Root>\r\n<Child name="test"/>\r\n</Root>\r\n';
        const formattedOutput = '<Root>\n    <Child name="test" />\n</Root>';
        const result = applyEolLogic(formattedOutput, windowsOriginal, true);
        expect(result.endsWith('\r\n')).toBe(true);
        expect(result).toBe(formattedOutput + '\r\n');
    });

    it('Windows file (CRLF throughout) preserves CRLF on format when addEmptyEol=OFF', () => {
        const windowsOriginal = '<?xml version="1.0"?>\r\n<Root>\r\n<Child name="test"/>\r\n</Root>\r\n';
        const formattedOutput = '<Root>\n    <Child name="test" />\n</Root>';
        const result = applyEolLogic(formattedOutput, windowsOriginal, false);
        expect(result.endsWith('\r\n')).toBe(true);
        expect(result).toBe(formattedOutput + '\r\n');
    });

    it('Linux/Mac file (LF throughout) preserves LF on format when addEmptyEol=ON', () => {
        const linuxOriginal = '<?xml version="1.0"?>\n<Root>\n<Child name="test"/>\n</Root>\n';
        const formattedOutput = '<Root>\n    <Child name="test" />\n</Root>';
        const result = applyEolLogic(formattedOutput, linuxOriginal, true);
        expect(result.endsWith('\n')).toBe(true);
        expect(result.endsWith('\r\n')).toBe(false);
        expect(result).toBe(formattedOutput + '\n');
    });

    it('Linux/Mac file (LF throughout) preserves LF on format when addEmptyEol=OFF', () => {
        const linuxOriginal = '<?xml version="1.0"?>\n<Root>\n<Child name="test"/>\n</Root>\n';
        const formattedOutput = '<Root>\n    <Child name="test" />\n</Root>';
        const result = applyEolLogic(formattedOutput, linuxOriginal, false);
        expect(result.endsWith('\n')).toBe(true);
        expect(result.endsWith('\r\n')).toBe(false);
        expect(result).toBe(formattedOutput + '\n');
    });

    it('Mixed line endings (some LF, some CRLF) prefers CRLF if any CRLF is present', () => {
        const mixedOriginal = '<Root>\n  <Item1/>\r\n  <Item2/>\n</Root>';
        const formattedOutput = '<Root>\n    <Item1 />\n    <Item2 />\n</Root>';
        const result = appendEolIfMissing(formattedOutput, mixedOriginal);
        expect(result.endsWith('\r\n')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Edge Cases: Whitespace, Comments, CDATA, Unicode
// ---------------------------------------------------------------------------
describe('Formatting & Content edge cases', () => {
    it('Trailing whitespace before LF in original is detected as having EOL', () => {
        const original = '<Root><Child/></Root>   \n';
        const formatted = '<Root>\n    <Child />\n</Root>';
        const result = preserveOriginalEol(formatted, original);
        expect(result).toBe(formatted + '\n');
    });

    it('Trailing whitespace before CRLF in original is detected as having CRLF EOL', () => {
        const original = '<Root><Child/></Root>   \r\n';
        const formatted = '<Root>\n    <Child />\n</Root>';
        const result = preserveOriginalEol(formatted, original);
        expect(result).toBe(formatted + '\r\n');
    });

    it('Multiple trailing newlines in original results in single trailing EOL after format', () => {
        const original = '<Root><Child/></Root>\n\n\n';
        const formatted = '<Root>\n    <Child />\n</Root>';
        const result = preserveOriginalEol(formatted, original);
        expect(result).toBe(formatted + '\n');
    });

    it('Multiple trailing CRLF in original results in single trailing CRLF after format', () => {
        const original = '<Root><Child/></Root>\r\n\r\n\r\n';
        const formatted = '<Root>\n    <Child />\n</Root>';
        const result = preserveOriginalEol(formatted, original);
        expect(result).toBe(formatted + '\r\n');
    });

    it('CDATA section with embedded CRLF is handled cleanly', () => {
        const original = '<Root><![CDATA[line1\r\nline2]]></Root>\r\n';
        const formatted = '<Root>\n    <![CDATA[line1\r\nline2]]>\n</Root>';
        const result = appendEolIfMissing(formatted, original);
        expect(result).toBe(formatted + '\r\n');
    });

    it('XML with multiline comment containing CRLF is handled cleanly', () => {
        const original = '<Root><!-- note\r\nline2 --></Root>\r\n';
        const formatted = '<Root>\n    <!-- note\r\nline2 -->\n</Root>';
        const result = appendEolIfMissing(formatted, original);
        expect(result).toBe(formatted + '\r\n');
    });

    it('Unicode and surrogate pair emojis preserve EOL correctly', () => {
        const original = '<Root message="✨🔥🎉">👍</Root>\r\n';
        const formatted = '<Root message="✨🔥🎉">\n    👍\n</Root>';
        const result = preserveOriginalEol(formatted, original);
        expect(result).toBe(formatted + '\r\n');
    });

    it('Single XML element with no attributes and no children with CRLF', () => {
        const original = '<SelfClosing/>\r\n';
        const formatted = '<SelfClosing />';
        const result = appendEolIfMissing(formatted, original);
        expect(result).toBe('<SelfClosing />\r\n');
    });
});
