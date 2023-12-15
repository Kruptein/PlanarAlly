module.exports = {
    extends: [
        "plugin:vue/vue3-recommended",
        "prettier",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:@typescript-eslint/strict",
        "plugin:import/recommended",
        "plugin:import/typescript",
    ],
    rules: {
        "@typescript-eslint/await-thenable": 2,
        "@typescript-eslint/consistent-type-assertions": [2, { assertionStyle: "as" }],
        "@typescript-eslint/consistent-type-imports": 2,
        "@typescript-eslint/explicit-function-return-type": [2, { allowExpressions: true }],
        "@typescript-eslint/explicit-member-accessibility": [2, { accessibility: "no-public" }],
        "@typescript-eslint/method-signature-style": "error",
        "@typescript-eslint/no-angle-bracket-type-assertion": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unused-vars": "off", // handled by tsconfig noUnusedLocals
        "@typescript-eslint/no-use-before-define": 0,
        "@typescript-eslint/require-await": "error",
        "@typescript-eslint/strict-boolean-expressions": 2,
        "@typescript-eslint/no-unnecessary-condition": 0,
        "@typescript-eslint/no-dynamic-delete": 0, // to check into
        "@typescript-eslint/consistent-type-imports": "error",
        "prefer-const": [process.env.CI === undefined ? 1 : 2],
        "import/no-unused-modules": [process.env.CI === undefined ? 0 : 2, { unusedExports: true }],
        "import/order": [
            process.env.CI === undefined ? 1 : 2,
            {
                alphabetize: { order: "asc", caseInsensitive: true },
                "newlines-between": "always",
                pathGroups: [{ pattern: "@/**", group: "parent", position: "before" }],
            },
        ],
        "vue/no-unused-components": [process.env.CI === undefined ? 1 : 2],
        "no-console": "off",
        "no-constant-condition": "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
        "no-dupe-class-members": "off",
        "no-empty-function": "off",
        "no-unused-vars": "off",
        // "prettier/prettier": [process.env.CI === undefined ? 1 : 2],
        "vue/multi-word-component-names": "off",
    },
    overrides: [
        {
            files: "*.vue",
            rules: {
                "import/default": 0,
            },
        },
    ],
    settings: {
        "import/resolver": {
            typescript: {
                extensions: [".js", ".ts", ".d.ts", ".vue"],
            },
        },
        "import/extensions": [".ts", ".vue"],
    },
    parser: "vue-eslint-parser",
    parserOptions: {
        parser: "@typescript-eslint/parser",
        ecmaFeatures: {
            jsx: false,
        },
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        extraFileExtensions: [".vue"],
    },
};
