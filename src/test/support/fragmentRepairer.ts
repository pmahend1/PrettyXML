import { RepairedFragment } from "./repairedFragment";

/*
 * The "enclose the selection in a synthetic root and let the engine format it" option, built far
 * enough to be measured.
 *
 * A selection is a fragment and XmlDocument.LoadXml rejects a fragment, so the engine can only be
 * reached by making the fragment into a document: enclose it in a synthetic root, hoist a leading
 * declaration or DOCTYPE above that root because both are illegal anywhere else, and bind every
 * namespace prefix the fragment uses to a placeholder URI because the real binding usually lives
 * on an ancestor outside the selection. Format, then strip the synthetic root and one indent level
 * back off.
 *
 * What this deliberately does NOT do is balance an unbalanced fragment. Appending the missing end
 * tags does make the parse succeed, but the result cannot be turned back into the user's fragment:
 * the engine merges `<b></b>` into `<b />`, so a selection of `</b></a>` prepended with `<a><b>`
 * comes back as a two-element subtree with no way to tell the synthetic markup from the real. Rule
 * 2 and rule 3 of the incomplete-tree spec are the tree formatter's job; this class reports an
 * unbalanced fragment as undelegable and stops.
 *
 * This lives under test support on purpose. It is the oracle for the tree formatter, not the
 * shipping path - promoting it is a decision for 8e, after the baseline says what it buys.
 */
export class FragmentRepairer {

    public static readonly syntheticRootName = "PrettyXmlSyntheticRoot";

    /*
     * Quote-aware, unlike the mega-regex in TextXmlFormatter: the start-tag alternative consumes
     * whole quoted attribute values, so a `>` inside one does not end the tag. `<a b="x>y">` is
     * the case the shipping formatter shreds today.
     */
    private static readonly tokenRegex = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE(?:[^>[]|\[[^\]]*\])*>|<\?[\s\S]*?\?>|<\/[^>]*>|<[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/gu;

    private static readonly elementPrefixRegex = /^<\/?([A-Za-z_][\w.-]*):/u;

    private static readonly attributePrefixRegex = /(?:^|\s)([A-Za-z_][\w.-]*):[\w.-]+\s*=/gu;

    public static repair(fragment: string): RepairedFragment {
        const tokens = [...fragment.matchAll(FragmentRepairer.tokenRegex)];

        const midTokenRejection = FragmentRepairer.findMidTokenText(fragment, tokens);
        if (midTokenRejection !== "") {
            return FragmentRepairer.reject(midTokenRejection);
        }

        let prologue = "";
        let bodyStart = 0;
        let hasSeenContent = false;

        const openElementNames: string[] = [];
        const prefixes = new Set<string>();

        for (const token of tokens) {
            const [text] = token;
            const index = token.index;
            const isPrologueNode = text.startsWith("<?xml") || text.startsWith("<!DOCTYPE");

            if (isPrologueNode) {
                if (hasSeenContent || fragment.slice(bodyStart, index).trim() !== "") {
                    return FragmentRepairer.reject("declaration or DOCTYPE inside the selection");
                }
                prologue += text;
                bodyStart = index + text.length;
                continue;
            }

            hasSeenContent = true;

            if (text.startsWith("<!") || text.startsWith("<?")) {
                continue;
            }

            FragmentRepairer.collectPrefixes(text, prefixes);

            if (text.startsWith("</")) {
                const name = FragmentRepairer.readName(text.slice(2));
                const openIndex = openElementNames.lastIndexOf(name);
                if (openIndex < 0) {
                    return FragmentRepairer.reject(`unbalanced: </${name}> closes nothing in the selection`);
                }
                openElementNames.length = openIndex;
                continue;
            }

            if (/\/\s*>$/u.test(text) === false) {
                openElementNames.push(FragmentRepairer.readName(text.slice(1)));
            }
        }

        if (openElementNames.length > 0) {
            return FragmentRepairer.reject(`unbalanced: <${openElementNames[0]}> is never closed in the selection`);
        }

        const syntheticPrefixes = [...prefixes].sort();
        const declarations = syntheticPrefixes.map(prefix => ` xmlns:${prefix}="urn:prettyxml-synthetic:${prefix}"`).join("");
        const root = FragmentRepairer.syntheticRootName;
        const body = fragment.slice(bodyStart);

        return {
            document: `${prologue}<${root}${declarations}>${body}</${root}>`,
            rejection: "",
            syntheticPrefixes: syntheticPrefixes,
        };
    }

    /*
     * Takes the engine's formatted document back to the fragment the user selected: drop the
     * synthetic root's own two lines and pull everything between them left by one indent level.
     * Whatever the engine wrote above the root - a hoisted declaration or DOCTYPE - was part of
     * the selection and is kept.
     */
    public static stripSyntheticRoot(engineOutput: string, indentLength: number): string {
        const root = FragmentRepairer.syntheticRootName;
        const lines = engineOutput.split("\n");
        const rootLineIndex = lines.findIndex(line => line.trimStart().startsWith(`<${root}`));
        if (rootLineIndex < 0) {
            throw new Error(`No <${root}> in the engine output to strip: ${engineOutput}`);
        }

        const prologueLines = lines.slice(0, rootLineIndex);
        const rootTagEndIndex = FragmentRepairer.findStartTagEndLine(lines, rootLineIndex);
        const rootTagEndLine = lines[rootTagEndIndex];
        const closingTag = `</${root}>`;

        // Content the engine kept inline - top-level text, CDATA, mixed content - stays on one line.
        if (rootTagEndLine.endsWith(closingTag)) {
            const inline = rootTagEndLine.slice(
                rootTagEndLine.indexOf(">") + 1,
                rootTagEndLine.length - closingTag.length
            );
            return [...prologueLines, inline].join("\n");
        }

        let lastLineIndex = lines.length - 1;
        while (lastLineIndex > rootTagEndIndex && lines[lastLineIndex].trimStart() !== closingTag) {
            lastLineIndex--;
        }

        const indent = " ".repeat(indentLength);
        const body = lines
            .slice(rootTagEndIndex + 1, lastLineIndex)
            .map(line => line.startsWith(indent) ? line.slice(indentLength) : line);

        return [...prologueLines, ...body].join("\n");
    }

    /*
     * The synthetic root carries one xmlns attribute per prefix the fragment uses, and past the
     * newline threshold the engine wraps its own start tag over several lines like any other. The
     * synthetic root is only fully consumed at the line where that tag's unquoted `>` lands.
     */
    private static findStartTagEndLine(lines: string[], startIndex: number): number {
        let quote = "";
        for (let index = startIndex; index < lines.length; index++) {
            for (const character of lines[index]) {
                if (quote !== "") {
                    if (character === quote) {
                        quote = "";
                    }
                } else if (character === "\"" || character === "'") {
                    quote = character;
                } else if (character === ">") {
                    return index;
                }
            }
        }
        throw new Error(`The synthetic root's start tag never closes: ${lines.join("\n")}`);
    }

    /*
     * Rule 5: a selection that starts or ends mid-token is not XML and any attempt to format it
     * corrupts it. A `<` left in a text run is the signature - the scanner found no closing `>`
     * for it, so the run is the front half of a tag.
     */
    private static findMidTokenText(fragment: string, tokens: RegExpExecArray[]): string {
        let lastEnd = 0;
        for (const token of tokens) {
            if (fragment.slice(lastEnd, token.index).includes("<")) {
                return "selection contains a partial tag";
            }
            lastEnd = token.index + token[0].length;
        }
        return fragment.slice(lastEnd).includes("<") ? "selection ends mid-token" : "";
    }

    /*
     * `xml` is bound by the specification and rebinding it is an error; `xmlns` is a declaration,
     * not a use. Everything else gets a placeholder binding - an inner declaration of the same
     * prefix shadows it, so a fragment that carries its own xmlns is unaffected.
     *
     * Names only. A prefix inside an attribute *value* - `match="xsl:template"` - is an XPath the
     * parser never resolves, and declaring it would put an attribute on the synthetic root that
     * nothing needs, for every value that happens to contain a colon.
     */
    private static collectPrefixes(tag: string, prefixes: Set<string>): void {
        const elementPrefix = tag.match(FragmentRepairer.elementPrefixRegex);
        if (elementPrefix !== null) {
            FragmentRepairer.addPrefix(elementPrefix[1], prefixes);
        }

        for (const match of tag.matchAll(FragmentRepairer.attributePrefixRegex)) {
            FragmentRepairer.addPrefix(match[1], prefixes);
        }
    }

    private static addPrefix(prefix: string, prefixes: Set<string>): void {
        if (prefix !== "xml" && prefix !== "xmlns") {
            prefixes.add(prefix);
        }
    }

    private static readName(afterAngleBracket: string): string {
        return afterAngleBracket.trim().split(/[\s/>]/u)[0];
    }

    private static reject(reason: string): RepairedFragment {
        return { document: "", rejection: reason, syntheticPrefixes: [] };
    }
}
