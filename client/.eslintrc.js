module.exports = {
    root: true,
    env: {
        node: true,
    },
    extends: ["plugin:@typescript-eslint/recommended", "plugin:vue/essential", "@vue/typescript", "@vue/prettier"],
    rules: {
        // "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
        "no-console": "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-angle-bracket-type-assertion": "off",
        "@typescript-eslint/explicit-member-accessibility": [2, { accessibility: "no-public" }],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-function-return-type": [2, { allowExpressions: true }],
        "@typescript-eslint/no-use-before-define": 0,
        "no-constant-condition": "off",
        "@typescript-eslint/no-unused-vars": [2, { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
        "no-unused-vars": "off",
        "no-dupe-class-members": "off"
    },
    parserOptions: {
        parser: "@typescript-eslint/parser",
        ecmaFeatures: {
            "jsx": false
        }
    },
};
