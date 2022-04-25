module.exports = {
    extends: ["plugin:vue/vue3-recommended", "prettier"],
    rules: {
        "vue/html-indent": off,
        "vue/html-self-closing": 0,
        "vue/max-attributes-per-line": 0,
    },
    parser: "vue-eslint-parser",
    parserOptions: {
        parser: "@typescript-eslint/parser",
        sourceType: "module",
    },
};
