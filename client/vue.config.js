// vue.config.js

const CircularDependencyPlugin = require('circular-dependency-plugin');

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
        plugins: [
            new CircularDependencyPlugin({
                exclude: /a\.js|node_modules/,
                failOnError: true,
                allowAsyncCycles: false,
                cwd: process.cwd(),
            })
        ]
    },
};
