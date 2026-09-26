import { describe, it, expect } from 'vitest';
import { IndentationStyle } from '../indentationStyle';
import { TextXmlFormatter } from '../regexFormatter';
import { defaultSettings, Settings } from '../settings';

function format(xml: string, overrides: Partial<Settings> = {}, baseColumn: number = 0): string {
    const settings = { ...defaultSettings, ...overrides };
    return new TextXmlFormatter(settings).formatXmlPretty(xml, IndentationStyle.spaces(settings.indentLength, baseColumn));
}

// The same formatter with the editor's indentation: a tab per level, from whatever the base is.
function formatWithTabs(xml: string, baseIndent: string = '', overrides: Partial<Settings> = {}): string {
    const settings = { ...defaultSettings, ...overrides };
    return new TextXmlFormatter(settings).formatXmlPretty(xml, new IndentationStyle(baseIndent, '\t'));
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

    // The #208 data loss: the trim takes XML whitespace only, so the edge character survives either
    // way - escaped with the option on, literal with it off.
    it('keeps an invisible character at the edge of a text node', () => {
        expect(format('<Root>\u00A0first\nsecond</Root>')).toContain('\u00A0first');
        expect(format('<Root>\u00A0first</Root>')).toBe('<Root>\u00A0first</Root>');
        expect(format('<Root>\u00A0first</Root>', escaping)).toContain('&#xA0;first');
    });

    // NBSP is character data, not the whitespace between two tags, so the run makes this mixed
    // content and glues the two elements onto one line. The engine reads it the same way.
    it('keeps a text run made only of invisible characters between two elements', () => {
        expect(format('<Root><A/>\u00A0<B/></Root>')).toBe('<Root>\n    <A />\u00A0<B />\n</Root>');
        expect(format('<Root><A/>\u00A0<B/></Root>', escaping)).toBe('<Root>\n    <A />&#xA0;<B />\n</Root>');
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

/*
 * The tree renderer first walked the tree by recursion and overflowed the call stack somewhere
 * between 3,700 and 8,000 levels of nesting, where the flat scanner before it had no limit at all.
 * An indent of zero keeps the output linear in the depth, so these measure the walk and not memory.
 */
describe('TextXmlFormatter — deep nesting', () => {
    const depth = 100000;
    const flat = { indentLength: 0 };

    it('formats a closed selection nested deeper than the call stack reaches', () => {
        const xml = '<a>'.repeat(depth) + 'x' + '</a>'.repeat(depth);
        expect(format(xml, flat)).toBe('<a>\n'.repeat(depth - 1) + '<a>x</a>' + '\n</a>'.repeat(depth - 1));
    });

    it('formats an unclosed selection nested deeper than the call stack reaches', () => {
        expect(format('<a>'.repeat(depth) + 'x', flat)).toBe('<a>\n'.repeat(depth) + 'x');
    });
});

describe('TextXmlFormatter — positionFirstAttributeOnSameLine', () => {
    const own = { positionFirstAttributeOnSameLine: false };

    it('puts every attribute on a line of its own, one indent in', () => {
        expect(format('<r><a b="1" c="2"/></r>', own)).toBe('<r>\n    <a\n        b="1"\n        c="2" />\n</r>');
    });

    it('wraps a single attribute too, because the threshold does not apply', () => {
        expect(format('<a b="1"/>', { ...own, attributesInNewlineThreshold: 5 })).toBe('<a\n    b="1" />');
    });

    it('closes a start tag with content after its last attribute', () => {
        expect(format('<a b="1"><c/></a>', { ...own, indentLength: 2 })).toBe('<a\n  b="1">\n  <c />\n</a>');
    });

    it('leaves an element without attributes on one line', () => {
        expect(format('<a/>', own)).toBe('<a />');
    });

    it('is overridden by positionAllAttributesOnFirstLine', () => {
        expect(format('<a b="1" c="2"/>', { ...own, positionAllAttributesOnFirstLine: true })).toBe('<a b="1" c="2" />');
    });

    it('keeps the threshold and alignment when on', () => {
        expect(format('<a b="1" c="2"/>', { attributesInNewlineThreshold: 2 })).toBe('<a b="1" c="2" />');
        expect(format('<a b="1" c="2"/>', { attributesInNewlineThreshold: 1 })).toBe('<a b="1"\n   c="2" />');
    });

    it('is idempotent', () => {
        const once = format('<r><a b="1" c="2"><d e="3"/></a></r>', own);
        expect(format(once, own)).toBe(once);
    });
});

describe('TextXmlFormatter — options the tree unlocks', () => {
    it('keeps a text-only element on one line and its text as written', () => {
        expect(format('<r><b> t </b></r>')).toBe('<r>\n    <b> t </b>\n</r>');
    });

    it('does not self-close an empty element', () => {
        expect(format('<a></a>', { useSelfClosingTags: true })).toBe('<a></a>');
    });

    it('treats an invalid exception pattern as matching nothing', () => {
        const settings = { positionAllAttributesOnFirstLine: true, wildCardedExceptionsForPositionAllAttributesOnFirstLine: ['('] };
        expect(format('<a b="1" c="2"/>', settings)).toBe('<a b="1" c="2" />');
    });

    it('leaves a comment that starts the selection on its own line', () => {
        expect(format('<!-- c --><a/>', { preserveCommentPlacement: true })).toBe('<!-- c -->\n<a />');
    });

    // Nothing inside started a line, so the end tag does not start one either - the engine's rule.
    it('keeps the end tag on the line of the comments kept in place before it', () => {
        expect(format('<r><b><!-- c --></b></r>', { preserveCommentPlacement: true })).toBe('<r>\n    <b><!-- c --></b>\n</r>');
        expect(format('<b><!-- c --><!-- d --></b>', { preserveCommentPlacement: true })).toBe('<b><!-- c --><!-- d --></b>');
        expect(format('<b><!-- c --><d/></b>', { preserveCommentPlacement: true })).toBe('<b><!-- c -->\n    <d />\n</b>');
    });

    it('keeps the end tag on a line of its own when only whitespace was inside', () => {
        expect(format('<a>\n</a>', { preserveNewLines: true })).toBe('<a>\n</a>');
    });

    it('drops the blank lines of whitespace-only content spanning lines', () => {
        expect(format('<a>\n\n</a>', { preserveNewLines: true })).toBe('<a>\n</a>');
        expect(format('<r><a>\n\n   \n</a></r>', { preserveNewLines: true })).toBe('<r>\n    <a>\n    </a>\n</r>');
    });

    // As the engine does: it never loads whitespace-only content unless preserveNewLines asks for it.
    it('drops whitespace-only content unless preserving new lines', () => {
        expect(format('<a> </a>')).toBe('<a></a>');
        expect(format('<a>\n</a>')).toBe('<a></a>');
        expect(format('<xsl:text> </xsl:text>', { preserveNewLines: true })).toBe('<xsl:text> </xsl:text>');
    });

    it('does not escape apostrophes in a single-quoted value', () => {
        expect(format('<a c="it\'s"/>', { allowSingleQuoteInAttributeValue: false, useSingleQuotes: true })).toBe('<a c="it\'s" />');
    });

    it('leaves a processing instruction that is not the declaration alone', () => {
        expect(format('<?xml-stylesheet href="a.xsl"?>', { addSpaceBeforeEndOfXmlDeclaration: true })).toBe('<?xml-stylesheet href="a.xsl"?>');
    });

    /*
     * The engine counts indentation as siblings under preserveNewLines, so it adds a blank line
     * before a closing tag on the second format. The range formatter ignores that whitespace.
     */
    it('adds no blank line before a closing tag when preserving new lines', () => {
        const settings = { addEmptyLineBetweenElements: true, preserveNewLines: true };
        expect(format('<r>\n    <a/>\n    <b/>\n    <c/>\n</r>', settings)).toBe('<r>\n    <a />\n\n    <b />\n\n    <c />\n</r>');
    });

    it('keeps a comment on its element\'s line rather than after a blank line', () => {
        const settings = { addEmptyLineBetweenElements: true, preserveCommentPlacement: true };
        expect(format('<r><a/> <!-- x --><b/><c/></r>', settings)).toBe('<r>\n    <a /><!-- x -->\n    <b />\n\n    <c />\n</r>');
    });

    it('never writes two blank lines in a row', () => {
        const result = format('<r><a/>\n\n\n<b/>\n\n<c/></r>', { addEmptyLineBetweenElements: true, preserveNewLines: true });
        expect(result).not.toContain('\n\n\n');
    });

    it.each([
        { addEmptyLineBetweenElements: true, preserveNewLines: true },
        { preserveCommentPlacement: true },
        { allowSingleQuoteInAttributeValue: false },
        { addSpaceBeforeEndOfXmlDeclaration: true },
    ])('is idempotent under %o', settings => {
        const once = format('<?xml version="1.0"?><r><a b="it\'s"/><!-- x -->\n<c>t</c>\n\n<d/></r>', settings);
        expect(format(once, settings)).toBe(once);
    });
});

describe('TextXmlFormatter — an end tag closes what it names (rule 2)', () => {
    it('closes the element it names and leaves what was open inside it open', () => {
        expect(format('<a><b></a><c/>')).toBe('<a>\n    <b>\n</a>\n<c />');
    });

    it('leaves an end tag naming nothing open at the depth it stands', () => {
        expect(format('<a>x</z></a>')).toBe('<a>\n    x\n    </z>\n</a>');
    });

    it('does not step the depth back for an end tag that closes nothing', () => {
        expect(format('</b></a><c/>', {}, 4)).toBe('    </b>\n    </a>\n    <c />');
    });

    it('opens a depth for a start tag the selection never closes (rule 3)', () => {
        expect(format('<a><b>text')).toBe('<a>\n    <b>\n        text');
    });
});

describe('TextXmlFormatter — the base column is passed in (rule 4)', () => {
    it('writes every line from the base column', () => {
        expect(format('<a><b/></a>', {}, 8)).toBe('        <a>\n            <b />\n        </a>');
    });

    it('no longer reads a starting depth out of the selected text', () => {
        expect(format('        <a><b/></a>')).toBe('<a>\n    <b />\n</a>');
    });

    it('aligns wrapped attributes from the base column', () => {
        expect(format('<a b="1" c="2"/>', {}, 4)).toBe('    <a b="1"\n       c="2" />');
    });

    it('is idempotent at a base column, indentation included', () => {
        const once = format('<a><b>t</b>\n<c/></a>', {}, 4);
        expect(format(once, {}, 4)).toBe(once);
    });

    it('drops a blank line the selection begins with', () => {
        const settings = { preserveNewLines: true };
        const once = format('\n\n<a/>\n\n<b/>', settings);
        expect(once).toBe('<a />\n\n<b />');
        expect(format(once, settings)).toBe(once);
    });
});

describe('TextXmlFormatter — the indentation character comes from the caller', () => {
    it('writes one tab per level when a tab is the unit', () => {
        expect(formatWithTabs('<a><b/></a>')).toBe('<a>\n\t<b />\n</a>');
    });

    it('writes every line from a tab base indent', () => {
        expect(formatWithTabs('<a><b/></a>', '\t\t')).toBe('\t\t<a>\n\t\t\t<b />\n\t\t</a>');
    });

    it('is idempotent under tabs, base indent included', () => {
        const once = formatWithTabs('<a><b>t</b>\n<c/></a>', '\t');
        expect(formatWithTabs(once, '\t')).toBe(once);
    });

    /*
     * A wrapped attribute list is the one place a tab cannot say what is meant: the continuation
     * has to start at a column inside the start tag. It carries the element's own indentation and
     * then spaces, so the two lines line up however wide the editor draws a tab.
     */
    it('aligns a wrapped attribute list with spaces under a tab indent', () => {
        expect(formatWithTabs('<a b="1" c="2"/>', '\t')).toBe('\t<a b="1"\n\t   c="2" />');
    });

    it('is idempotent with a wrapped attribute list under tabs', () => {
        const once = formatWithTabs('<r><a b="1" c="2"><d/></a></r>', '\t');
        expect(once).toBe('\t<r>\n\t\t<a b="1"\n\t\t   c="2">\n\t\t\t<d />\n\t\t</a>\n\t</r>');
        expect(formatWithTabs(once, '\t')).toBe(once);
    });

    it('indents an attribute list of its own onto the next level in tabs', () => {
        const settings = { positionFirstAttributeOnSameLine: false };
        expect(formatWithTabs('<a b="1" c="2"/>', '', settings)).toBe('<a\n\tb="1"\n\tc="2" />');
    });

    // The base is the first line's whitespace as written, so a space-indented line in a
    // tab-indented document keeps its spaces rather than being re-measured into tabs.
    it('keeps a base indent that disagrees with the unit exactly as it was', () => {
        const once = formatWithTabs('<a><b/></a>', '  ');
        expect(once).toBe('  <a>\n  \t<b />\n  </a>');
        expect(formatWithTabs(once, '  ')).toBe(once);
    });
});

describe('TextXmlFormatter — a selection cut mid-token keeps its bytes (rule 5)', () => {
    it('leaves the front half of a tag exactly as it was', () => {
        expect(format('<a><b attr="v  ')).toBe('<a>\n    <b attr="v  ');
    });

    it('does not escape inside the front half of a tag', () => {
        const nbsp = '<a><b attr="\u00a0';
        expect(format(nbsp, { escapeInvisibleNonAsciiCharacters: true })).toBe('<a>\n    <b attr="\u00a0');
    });

    it('leaves the tail of a tag the selection starts inside on its own line, unindented', () => {
        expect(format(' x"><b/></a>', {}, 4)).toBe(' x">\n    <b />\n    </a>');
    });

    it('still indents leading text that is not a cut tag', () => {
        expect(format('  just text  <a/>', {}, 4)).toBe('    just text\n    <a />');
    });

    // NBSP is content, not indentation: trimEnd() would delete it (#216). XML whitespace still goes.
    it('keeps a non-breaking space at the end of the cut tag', () => {
        expect(format('attr="x"> ')).toBe('attr="x"> ');
        expect(format('attr="x">  ')).toBe('attr="x">');
    });
});

describe('TextXmlFormatter — xml:space="preserve" (rule 6)', () => {
    it('keeps the content of the element carrying it as written', () => {
        const xml = '<r><pre xml:space="preserve">  a\n   b  <i>x</i>  </pre><b/></r>';
        expect(format(xml)).toBe('<r>\n    <pre xml:space="preserve">  a\n   b  <i>x</i>  </pre>\n    <b />\n</r>');
    });

    it('formats the preserving element\'s own start tag', () => {
        expect(format('<a xml:space=\'preserve\'>  x  </a>')).toBe('<a xml:space="preserve">  x  </a>');
    });

    it('keeps the rest of the selection when the preserving element is never closed', () => {
        expect(format('<r><pre xml:space="preserve">  a\n  b')).toBe('<r>\n    <pre xml:space="preserve">  a\n  b');
    });

    it('keeps the markup inside it as written too', () => {
        expect(format('<r><pre xml:space="preserve"><a/>  <b/></pre></r>')).toBe('<r>\n    <pre xml:space="preserve"><a/>  <b/></pre>\n</r>');
    });

    it('does not read xml:space out of another attribute\'s value', () => {
        expect(format('<a b="xml:space=\'preserve\'"><c/>  <d/></a>')).toBe('<a b="xml:space=\'preserve\'">\n    <c />\n    <d />\n</a>');
    });

    it('formats an element whose xml:space is default', () => {
        expect(format('<r><pre xml:space="default"><a/>  <b/></pre></r>')).toBe('<r>\n    <pre xml:space="default">\n        <a />\n        <b />\n    </pre>\n</r>');
    });

    it('is idempotent', () => {
        const once = format('<r><pre xml:space="preserve">  a\n   b  </pre><c/></r>');
        expect(format(once)).toBe(once);
    });
});

/*
 * Mixed content - character data beside markup. The engine keeps such an element on one line, and
 * once the content will not fit, starts a line for every child that is not character data and does
 * not follow text. rangeDifferential.test.ts checks both against it.
 */
describe('TextXmlFormatter — mixed content', () => {
    it('keeps an element mixing text and markup on one line', () => {
        expect(format('<p>some <b>bold</b> text</p>')).toBe('<p>some <b>bold</b> text</p>');
    });

    it('keeps several children and the text between them on one line', () => {
        expect(format('<p>a <b>x</b> mid <i>y</i> z</p>')).toBe('<p>a <b>x</b> mid <i>y</i> z</p>');
    });

    it('keeps nested mixed content on one line', () => {
        expect(format('<p>a <b>bold <i>it</i> tail</b> z</p>')).toBe('<p>a <b>bold <i>it</i> tail</b> z</p>');
    });

    it('formats the markup it keeps inline rather than copying it', () => {
        expect(format('<p>a <br/> b</p>')).toBe('<p>a <br /> b</p>');
        expect(format('<p>a <b id=\'1\'>x</b> c</p>', { useSingleQuotes: false })).toBe('<p>a <b id="1">x</b> c</p>');
    });

    it('keeps a comment and a CDATA section inline beside text', () => {
        expect(format('<p>a <!--   c   --> b</p>')).toBe('<p>a <!-- c --> b</p>');
        expect(format('<p>a <![CDATA[raw]]> b</p>')).toBe('<p>a <![CDATA[raw]]> b</p>');
    });

    it('indents an inline element normally when it sits in a tree', () => {
        expect(format('<r><p>a <b>c</b> d</p><q><s/></q></r>'))
            .toBe('<r>\n    <p>a <b>c</b> d</p>\n    <q>\n        <s />\n    </q>\n</r>');
    });

    // The whitespace a formatted document puts between its elements is not character data.
    it('does not read the whitespace between two elements as mixed content', () => {
        expect(format('<p><a/> <b/></p>')).toBe('<p>\n    <a />\n    <b />\n</p>');
        expect(format('<p><a/>\n<b/></p>')).toBe('<p>\n    <a />\n    <b />\n</p>');
    });

    it('lays out an element whose content is all markup as a block', () => {
        expect(format('<p><b>x</b><i>y</i></p>')).toBe('<p>\n    <b>x</b>\n    <i>y</i>\n</p>');
    });

    it('breaks out an element whose inline content will not fit on one line', () => {
        expect(format('<p>a <b>x\ny</b> z</p>')).toBe('<p>\n    a\n    <b>\n        x\n        y\n    </b>\n    z\n</p>');
    });

    it('leaves a child carrying xml:space="preserve" to rule 6 rather than inlining it', () => {
        expect(format('<p>a <pre xml:space="preserve">  x  </pre> b</p>'))
            .toBe('<p>\n    a\n    <pre xml:space="preserve">  x  </pre>\n    b\n</p>');
    });

    it('does not inline a child whose attributes wrapped over several lines', () => {
        const wrapped = format('<p>a <b x="1" y="2" z="3">t</b> c</p>', { attributesInNewlineThreshold: 1 });
        expect(wrapped).toBe('<p>\n    a\n    <b x="1"\n       y="2"\n       z="3">t</b>\n    c\n</p>');
    });

    // A run of markup glued together by the text between it shares one line, as in the engine.
    it('starts a line for a child that does not follow text', () => {
        expect(format('<r><a/>x<b/></r>')).toBe('<r>\n    <a />x<b />\n</r>');
        expect(format('<r><a/>x<b/><c/></r>')).toBe('<r>\n    <a />x<b />\n    <c />\n</r>');
        expect(format('<r><a/><b/>x<c/></r>')).toBe('<r>\n    <a />\n    <b />x<c />\n</r>');
    });

    it('keeps leading character data on the start tag\'s line', () => {
        expect(format('<r>x<a/><b/></r>')).toBe('<r>x<a />\n    <b />\n</r>');
    });

    // An end tag gets a line of its own exactly when something inside started one, as in the engine.
    it('keeps the end tag on the start tag\'s line when no child started a line', () => {
        expect(format('<p>some <b>bold</b></p>')).toBe('<p>some <b>bold</b></p>');
        expect(format('<p>a<br/></p>')).toBe('<p>a<br /></p>');
        expect(format('<r><p>some <b>bold</b></p><q/></r>')).toBe('<r>\n    <p>some <b>bold</b></p>\n    <q />\n</r>');
    });

    it('writes the end tag on its own line once a child started one', () => {
        expect(format('<r><a/>x</r>')).toBe('<r>\n    <a />x\n</r>');
        expect(format('<p><b>bold</b> text</p>')).toBe('<p>\n    <b>bold</b> text\n</p>');
    });

    it('keeps a comment in place in mixed content under preserveCommentPlacement', () => {
        const settings = { preserveCommentPlacement: true };
        expect(format('<p>x<b>y</b><!-- c --></p>', settings)).toBe('<p>x<b>y</b><!-- c --></p>');
        expect(format('<p><!-- c -->x<b/></p>', settings)).toBe('<p><!-- c -->x<b /></p>');
        expect(format('<p>x<b/>\n<!-- c --></p>', settings)).toBe('<p>x<b />\n    <!-- c -->\n</p>');
    });

    // Whitespace alone is not character data, so it glues nothing - the space becomes a line break.
    it('starts a line for a child that follows whitespace alone', () => {
        expect(format('<p>x<b>1</b> <b>2</b>z</p>')).toBe('<p>x<b>1</b>\n    <b>2</b>z\n</p>');
        expect(format('<p>x <b/> <i/> z</p>')).toBe('<p>x <b />\n    <i /> z\n</p>');
    });

    it('glues CDATA to an element before it but not to a comment', () => {
        expect(format('<p><a/><![CDATA[d]]></p>')).toBe('<p>\n    <a /><![CDATA[d]]>\n</p>');
        expect(format('<p>x<!-- c --><![CDATA[d]]></p>')).toBe('<p>x<!-- c -->\n    <![CDATA[d]]>\n</p>');
    });

    it('leaves already-formatted mixed content exactly as it found it', () => {
        const formatted = '<p>\n    some\n    <b>bold</b>\n    text\n</p>';
        expect(format(formatted)).toBe(formatted);
    });

    it('is idempotent in the inline, grouped and block forms', () => {
        const shapes = [
            '<p>some <b>bold</b> text</p>',
            '<p>\n    some\n    <b>bold</b>\n    text\n</p>',
            '<p>a <b>x\ny</b> z</p>',
            '<r><a/>x<b/></r>',
            '<r><a/>x</r>',
            '<r>x<a/><b/></r>',
            '<p>some <b>bold</b></p>',
            '<r><a/> <b/></r>',
            '<r><!-- k --><a/>x</r>',
            '<p>x<b>1</b> <b>2</b>z</p>',
            '<p>x<b>y</b><!-- c --></p>',
            '<p><a/><![CDATA[d]]></p>',
        ];
        for (const xml of shapes) {
            const once = format(xml);
            expect(format(once)).toBe(once);
        }
    });
});

describe('TextXmlFormatter — a text run spanning several lines', () => {
    it('writes each line at the content\'s own column', () => {
        expect(format('<p>line one\nline two\nline three</p>'))
            .toBe('<p>\n    line one\n    line two\n    line three\n</p>');
    });

    it('re-indents at the depth the run actually sits at', () => {
        expect(format('<r><s><p>l1\nl2</p></s></r>'))
            .toBe('<r>\n    <s>\n        <p>\n            l1\n            l2\n        </p>\n    </s>\n</r>');
    });

    it('normalizes whatever indentation each line arrived with', () => {
        expect(format('<r><p>  l1\n      l2  </p></r>')).toBe('<r>\n    <p>\n        l1\n        l2\n    </p>\n</r>');
        expect(format('<r><p>l1\n\tl2</p></r>')).toBe('<r>\n    <p>\n        l1\n        l2\n    </p>\n</r>');
        expect(format('<r><p>l1\r\nl2</p></r>')).toBe('<r>\n    <p>\n        l1\n        l2\n    </p>\n</r>');
    });

    it('keeps every interior blank line, with or without preserveNewLines', () => {
        expect(format('<p>l1\n\nl2</p>')).toBe('<p>\n    l1\n\n    l2\n</p>');
        expect(format('<p>l1\n\nl2</p>', { preserveNewLines: true })).toBe('<p>\n    l1\n\n    l2\n</p>');
        expect(format('<p>l1\n\n\nl2</p>')).toBe('<p>\n    l1\n\n\n    l2\n</p>');
        expect(format('<p>l1\n   \nl2</p>')).toBe('<p>\n    l1\n\n    l2\n</p>');
    });

    it('keeps a blank line at either end of the run but not the rest of a line it shares', () => {
        expect(format('<p>\n\nl1\n\n</p>')).toBe('<p>\n\n    l1\n\n</p>');
        expect(format('<p>  \nl1\n  </p>')).toBe('<p>\n    l1\n</p>');
    });

    it('drops a trailing blank line once something before the run started a line', () => {
        expect(format('<p><b/>l1\n\nl2\n\n</p>')).toBe('<p>\n    <b />\n    l1\n\n    l2\n</p>');
        expect(format('<p><b/>\n\nl1\n\n<c/></p>')).toBe('<p>\n    <b />\n\n    l1\n\n    <c />\n</p>');
    });

    it('keeps a comment on the run\'s last line rather than after its trailing blank line', () => {
        const settings = { preserveCommentPlacement: true };
        const once = format('<e>a\nb\n\n<!-- c --><f/></e>', settings);
        expect(once).toBe('<e>\n    a\n    b<!-- c -->\n    <f />\n</e>');
        expect(format(once, settings)).toBe(once);
    });

    it('does not begin a selection with a blank line', () => {
        expect(format('\n\nl1\n\nl2')).toBe('l1\n\nl2');
    });

    it('does not re-indent a CDATA section that spans several lines', () => {
        expect(format('<r><p><![CDATA[l1\nl2]]></p></r>')).toBe('<r>\n    <p>\n        <![CDATA[l1\nl2]]>\n    </p>\n</r>');
    });

    it('is idempotent', () => {
        const shapes = [
            '<r><s><p>  l1\n      l2  </p></s></r>',
            '<r><p>\n\nl1\n\n\nl2\n\n</p></r>',
            '<r><p><b/>l1\n\nl2\n\n</p></r>',
            '<r><p><b/>\n\nl1\n\n<c/></p></r>',
        ];
        for (const xml of shapes) {
            const once = format(xml);
            expect(format(once)).toBe(once);
        }
    });
});

// Mixed content and the editor's tabs are independent, but only their combination ships.
describe('TextXmlFormatter — mixed content under a tab indent', () => {
    it('keeps an inline element on one line from a tab base', () => {
        expect(formatWithTabs('<p>some <b>bold</b> text</p>', '\t')).toBe('\t<p>some <b>bold</b> text</p>');
    });

    it('indents a grouped run with tabs', () => {
        expect(formatWithTabs('<r><a/>x<b/></r>', '\t')).toBe('\t<r>\n\t\t<a />x<b />\n\t</r>');
        expect(formatWithTabs('<r>x<a/><b/></r>', '\t')).toBe('\t<r>x<a />\n\t\t<b />\n\t</r>');
    });

    it('re-indents a multi-line text run with tabs', () => {
        expect(formatWithTabs('<r><s><p>l1\nl2</p></s></r>', '\t'))
            .toBe('\t<r>\n\t\t<s>\n\t\t\t<p>\n\t\t\t\tl1\n\t\t\t\tl2\n\t\t\t</p>\n\t\t</s>\n\t</r>');
    });

    it('is idempotent in every form under tabs', () => {
        const shapes = [
            '<p>some <b>bold</b> text</p>',
            '<r><a/>x<b/></r>',
            '<r><a/>x</r>',
            '<p>a <b>x\ny</b> z</p>',
            '<r><s><p>l1\nl2</p></s></r>',
            '<r>x<a/><b/></r>',
        ];
        for (const xml of shapes) {
            const once = formatWithTabs(xml, '\t');
            expect(formatWithTabs(once, '\t')).toBe(once);
        }
    });
});
