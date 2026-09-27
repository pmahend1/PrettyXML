import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EngineFormatter } from './support/engineFormatter';
import { FormattingActionKind } from '../formattingActionKind';
import { ISettings } from '../settings';

/*
 * The README and the settings descriptions in package.json are the spec for what each option does;
 * the engine repo documents none of it. Every example there runs through the DLL here, so an engine
 * that drifts from the documentation fails in CI rather than in a user's file. Comparing the engine
 * with Format Selection, or with itself on a second format, never caught that: 6.9.0 shipped two
 * such regressions and both sat in the README's own examples.
 *
 * Settings are the package.json defaults (EngineFormatter.baselineSettings), less the declaration the
 * README examples leave out, plus the setting each example shows.
 */

// A Windows checkout gives the README CRLF line endings.
const readme = readFileSync(path.resolve(process.cwd(), 'README.md'), 'utf8').replace(/\r\n/g, '\n');

async function format(xml: string, overrides: Partial<ISettings>, actionKind = FormattingActionKind.format): Promise<string> {
    return (await EngineFormatter.format(xml, actionKind, overrides)).replace(/\r\n/g, '\n');
}

function readExample(kind: 'Input' | 'Output', number: number): string {
    const match = new RegExp(`#### ${kind} ${number}\\n\\n\`\`\`xml\\n([\\s\\S]*?)\\n\`\`\``, 'u').exec(readme);
    if (match === null) {
        throw new Error(`README has no ${kind} ${number} xml block`);
    }
    return match[1];
}

// The setting each README example is written for, by its number.
const readmeExamples: [number, Partial<ISettings>][] = [
    [1, { attributesInNewlineThreshold: 2 }],
    [2, { attributesInNewlineThreshold: 2 }],
    [3, { positionAllAttributesOnFirstLine: true, wildCardedExceptionsForPositionAllAttributesOnFirstLine: ['Content*'] }],
    [4, { addEmptyLineBetweenElements: true }],
    [5, { preserveNewLines: false }],
    [6, { preserveNewLines: true }],
    [7, { preserveCommentPlacement: false }],
    [8, { preserveCommentPlacement: true }],
    [9, { escapeInvisibleNonAsciiCharacters: false }],
    [10, { escapeInvisibleNonAsciiCharacters: true }],
];

describe('The engine does what the README examples show', () => {
    it('knows the setting of every example in the README', () => {
        const numbers = [...readme.matchAll(/^#### Input (\d+)$/gmu)].map(match => Number(match[1]));
        expect(numbers).toEqual(readmeExamples.map(([number]) => number));
    });

    it.each(readmeExamples)('formats README example %i under %j', async (number, overrides) => {
        expect(await format(readExample('Input', number), overrides)).toBe(readExample('Output', number));
    }, 15000);
});

describe('The engine does what the settings descriptions say', () => {
    // [the description's claim, input, settings, what the output contains]
    const claims: [string, string, Partial<ISettings>, string][] = [
        ['indentSpaceLength', '<r><a/></r>', { indentLength: 2 }, '<r>\n  <a />\n</r>'],
        ['useSingleQuotes checked', '<a Attribute="Value"/>', { useSingleQuotes: true }, 'Attribute=\'Value\''],
        ['useSingleQuotes unchecked', '<a Attribute=\'Value\'/>', {}, 'Attribute="Value"'],
        ['useSelfClosingTag checked', '<r><Foo></Foo></r>', { addSpaceBeforeSelfClosingTag: false }, '<Foo/>'],
        ['useSelfClosingTag unchecked', '<r><Foo></Foo></r>', { useSelfClosingTags: false }, '<Foo></Foo>'],
        ['allowSingleQuoteInAttributeValue checked', '<a Attribute="Value\'has\'apostrphoes"/>', {}, 'Attribute="Value\'has\'apostrphoes"'],
        ['allowSingleQuoteInAttributeValue unchecked', '<a Attribute="Value\'has\'apostrphoes"/>', { allowSingleQuoteInAttributeValue: false }, 'Attribute="Value&apos;has&apos;apostrphoes"'],
        ['allowSingleQuoteInAttributeValue ignored under useSingleQuotes', '<a b="it\'s"/>', { useSingleQuotes: true }, 'b=\'it&apos;s\''],
        ['addSpaceBeforeSelfClosingTag checked', '<Foo/>', {}, '<Foo />'],
        ['addSpaceBeforeSelfClosingTag unchecked', '<Foo />', { addSpaceBeforeSelfClosingTag: false }, '<Foo/>'],
        ['wrapCommentTextWithSpaces checked', '<r><!--Comment Text--></r>', {}, '<!-- Comment Text -->'],
        ['wrapCommentTextWithSpaces unchecked', '<r><!-- Comment Text --></r>', { wrapCommentTextWithSpaces: false }, '<!--Comment Text-->'],
        ['wrapCommentTextWithSpaces ignored under preserveWhiteSpacesInComment', '<r><!--    Comment    --></r>', { preserveWhiteSpacesInComment: true }, '<!--    Comment    -->'],
        ['allowWhiteSpaceUnicodesInAttributeValues checked: &#10;', '<a b="x&#10;y"/>', {}, 'b="x&#xA;y"'],
        ['allowWhiteSpaceUnicodesInAttributeValues checked: &#9;', '<a b="x&#9;y"/>', {}, 'b="x&#x9;y"'],
        ['allowWhiteSpaceUnicodesInAttributeValues checked: &#x9;', '<a b="x&#x9;y"/>', {}, 'b="x&#x9;y"'],
        ['allowWhiteSpaceUnicodesInAttributeValues checked: >', '<a b="{i18n>LabelText}"/>', {}, 'b="{i18n>LabelText}"'],
        ['allowWhiteSpaceUnicodesInAttributeValues unchecked: &#10;', '<a b="x&#10;y"/>', { allowWhiteSpaceUnicodesInAttributeValues: false }, 'b="x\ny"'],
        ['allowWhiteSpaceUnicodesInAttributeValues unchecked: &#9;', '<a b="x&#9;y"/>', { allowWhiteSpaceUnicodesInAttributeValues: false }, 'b="x\ty"'],
        ['allowWhiteSpaceUnicodesInAttributeValues unchecked: >', '<a b="x>y"/>', { allowWhiteSpaceUnicodesInAttributeValues: false }, 'b="x&gt;y"'],
        ['positionFirstAttributeOnSameLine checked', '<Element Attribute="Value" B="2"/>', {}, '<Element Attribute="Value"\n'],
        ['positionFirstAttributeOnSameLine unchecked', '<Element Attribute="Value" B="2"/>', { positionFirstAttributeOnSameLine: false }, '<Element\n    Attribute="Value"\n'],
        ['positionFirstAttributeOnSameLine unchecked, ignored under positionAllAttributesOnFirstLine', '<Element Attribute1="Value1" Attribute2="Value2"/>', { positionFirstAttributeOnSameLine: false, positionAllAttributesOnFirstLine: true }, '<Element Attribute1="Value1" Attribute2="Value2" />'],
        ['positionAllAttributesOnFirstLine checked', '<Element Attribute1="Value1" Attribute2="Value2"/>', { positionAllAttributesOnFirstLine: true }, '<Element Attribute1="Value1" Attribute2="Value2" />'],
        ['positionAllAttributesOnFirstLine unchecked', '<Element Attribute1="Value1" Attribute2="Value2"/>', {}, '<Element Attribute1="Value1"\n         Attribute2="Value2" />'],
        ['preserveWhiteSpacesInComment unchecked', '<r><!--    Comment    --></r>', { wrapCommentTextWithSpaces: false }, '<!--Comment-->'],
        ['addSpaceBeforeEndOfXmlDeclaration checked', '<?xml version="1.0" encoding="utf-8"?><Root/>', { addSpaceBeforeEndOfXmlDeclaration: true }, '<?xml version="1.0" encoding="utf-8" ?>'],
        ['addSpaceBeforeEndOfXmlDeclaration unchecked', '<?xml version="1.0" encoding="utf-8" ?><Root/>', {}, '<?xml version="1.0" encoding="utf-8"?>'],
        ['addXmlDeclarationIfMissing checked', '<Root><Element/></Root>', { addXmlDeclarationIfMissing: true }, '<?xml version="1.0" encoding="UTF-8"?>\n<Root>\n    <Element />\n</Root>'],
        ['attributesInNewlineThreshold only with positionFirstAttributeOnSameLine', '<a x="1" y="2"/>', { positionFirstAttributeOnSameLine: false, attributesInNewlineThreshold: 2 }, '<a\n    x="1"\n    y="2" />'],
        ['addEmptyLineBetweenElements, none before the first or after the last', '<r><a/><b/><c/></r>', { addEmptyLineBetweenElements: true }, '<r>\n    <a />\n\n    <b />\n\n    <c />\n</r>'],
        ['escapeInvisibleNonAsciiCharacters leaves characters that draw something literal', '<r a="ü日😀">ü日😀</r>', { escapeInvisibleNonAsciiCharacters: true }, 'a="ü日😀">ü日😀'],
    ];

    it.each(claims)('%s', async (_claim, xml, overrides, expected) => {
        expect(await format(xml, overrides)).toContain(expected);
    }, 15000);

    // [the description's claim, input, settings, what the output must not contain]
    const absences: [string, string, Partial<ISettings>, string][] = [
        ['addXmlDeclarationIfMissing unchecked', '<Root><Element/></Root>', {}, '<?xml'],
        ['addEmptyLineBetweenElements only among more than two elements', '<r><a/><b/></r>', { addEmptyLineBetweenElements: true }, '\n\n'],
    ];

    it.each(absences)('%s', async (_claim, xml, overrides, absent) => {
        expect(await format(xml, overrides)).not.toContain(absent);
    }, 15000);

    it('addXmlDeclarationIfMissing applies to Minimize too', async () => {
        expect(await format('<Root><Element/></Root>', { addXmlDeclarationIfMissing: true }, FormattingActionKind.minimize)).toMatch(/^<\?xml /u);
        expect(await format('<Root><Element/></Root>', {}, FormattingActionKind.minimize)).not.toContain('<?xml');
    }, 15000);
});
