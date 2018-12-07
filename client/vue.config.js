// vue.config.js
module.exports = {
    outputDir: "../server/static",
    indexPath: "../templates/index.html",
    configureWebpack: {
        resolve: {
            alias: {
                vue$: "vue/dist/vue.esm.js", // 'vue/dist/vue.common.js' for webpack 1
            },
        },
    },
};
