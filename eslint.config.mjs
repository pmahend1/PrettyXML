import { defineConfig, globalIgnores } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores([
        "out/**",
        "dist/**",
        "lib/**",
        "webpack.config.js",
        "src/test/**"
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
