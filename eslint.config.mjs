import { defineConfig, globalIgnores } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default defineConfig([
    // Build output carries `eslint-disable` comments copied from source; without
    // these, `eslint .` reports unknown-rule errors against the compiled JS.
    globalIgnores([
        "out/**",
        "dist/**",
        "lib/**",
        "webpack.config.js"
    ]),
    {
        files: ["src/**/*.ts"],
        extends: [tseslint.configs.base],
        plugins: {
            "@stylistic": stylistic
        },
        rules: {
            "@typescript-eslint/naming-convention": "warn",
            "@stylistic/semi": "warn",
            "curly": "error",
            "eqeqeq": "error",
            "no-throw-literal": "error"
        }
    }
]);
