// vue.config.js
module.exports = {
    assetsDir: "static",
    outputDir: "../server",
    indexPath: "./templates/index.html",
    configureWebpack: {
        resolve: {
            alias: {
                vue$: "vue/dist/vue.esm.js", // 'vue/dist/vue.common.js' for webpack 1
            },
        },
    },
};
