import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            // `vscode` only exists inside the extension host; the suite gets a stub instead.
            vscode: fileURLToPath(new URL('./src/test/mocks/vscode.ts', import.meta.url))
        }
    },
    test: {
        include: ['src/test/**/*.test.ts'],
    },
});
