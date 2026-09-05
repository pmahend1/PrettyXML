import { defineConfig, globalIgnores } from "eslint/config";
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
        rules: {
            "@typescript-eslint/naming-convention": "warn",
            "curly": "warn",
            "eqeqeq": "warn",
            "no-throw-literal": "warn",
            "semi": "warn"
        }
    }
]);
