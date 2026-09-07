import * as childProcess from "node:child_process";
import * as path from "node:path";
import { EngineResult } from "./engineResult";
import { FormattingActionKind } from "../../formattingActionKind";
import { JsonInputDto } from "../../jsonInputDto";
import { ISettings, Settings } from "../../settings";

/*
 * The one place the test suite talks to the .NET engine. Every payload is built through
 * JsonInputDto and Settings so the suite sends exactly what the extension sends - a hand-written
 * copy of the wire contract is what let the harness drift through the 2.3.1 -> 3.0.0 rename and
 * fail all 17 lib-integration tests while the extension itself was fine.
 */
export class EngineFormatter {

    private static readonly dllPath = path.resolve(process.cwd(), "lib/XmlFormatter.CommandLine.dll");

    /*
     * Every option stated rather than inherited from defaultSettings: a test that reads as
     * "engine output for these settings" must not change meaning when a default moves.
     * addXmlDeclarationIfMissing is off because a declaration injected into a formatted result
     * would show up as a diff in every single case.
     */
    public static readonly baselineSettings: Partial<ISettings> = {
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
    };

    /*
     * Returns the engine's exit code and both streams rather than throwing, because "the engine
     * refuses this input" is a result the differential harness records rather than an error.
     */
    public static run(
        xml: string,
        actionKind: FormattingActionKind = FormattingActionKind.format,
        formattingOptionOverrides: Partial<ISettings> = {}
    ): Promise<EngineResult> {
        const settings = new Settings({ ...EngineFormatter.baselineSettings, ...formattingOptionOverrides });
        const input = JSON.stringify(new JsonInputDto(xml, actionKind, settings));

        const cli = childProcess.spawn("dotnet", [EngineFormatter.dllPath], { stdio: ["pipe", "pipe", "pipe"] });

        let stdout = "";
        let stderr = "";

        cli.stdout.setEncoding("utf8");
        cli.stdout.on("data", data => { stdout += data; });

        cli.stderr.setEncoding("utf8");
        cli.stderr.on("data", data => { stderr += data; });

        return new Promise<EngineResult>(resolve => {
            cli.on("close", exitCode => { resolve({ exitCode, stdout, stderr }); });
            cli.stdin.end(input, "utf-8");
        });
    }

    public static async format(
        xml: string,
        actionKind: FormattingActionKind = FormattingActionKind.format,
        formattingOptionOverrides: Partial<ISettings> = {}
    ): Promise<string> {
        const result = await EngineFormatter.run(xml, actionKind, formattingOptionOverrides);
        if (result.exitCode !== 0) {
            throw new Error(`DLL exited with code ${result.exitCode}: ${result.stderr}`);
        }
        return result.stdout;
    }

    /*
     * The engine reports a parse failure as an unhandled exception, so stderr is a .NET stack
     * trace. The harness only wants the sentence, and without the "Line 1, position 27" tail -
     * that moves with the synthetic root's length and would make the baseline record the
     * root's shape rather than the input's problem.
     */
    public static describeFailure(result: EngineResult): string {
        const message = result.stderr.split("\n")[0] ?? "";
        const afterExceptionType = message.replace(/^Unhandled exception\.\s*\S+:\s*/u, "");
        return afterExceptionType.replace(/\s*Line \d+, position \d+\.\s*$/u, "").trim();
    }
}
