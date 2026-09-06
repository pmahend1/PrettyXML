/*
 * The extension host supplies `vscode` at runtime, so the module does not exist under
 * vitest. `vitest.config.mts` aliases it here, stubbing only the surface Logger touches:
 * an output channel whose lines the tests can read back through `appendedLines`.
 */

export const appendedLines: string[] = [];

export function clearAppendedLines(): void {
    appendedLines.length = 0;
}

export const window = {
    createOutputChannel: (name: string) => ({
        name: name,
        appendLine: (value: string) => {
            appendedLines.push(value);
        },
        append: (value: string) => {
            appendedLines.push(value);
        },
        show: () => { },
        dispose: () => { }
    })
};
