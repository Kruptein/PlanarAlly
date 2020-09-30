// vue.config.js

// const CircularDependencyPlugin = require("circular-dependency-plugin");
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
    assetsDir: process.env.PA_BASEPATH + "/" + process.env.NODE_ENV === "production" ? "static" : "dev-static",
    outputDir: "../server",
    indexPath: "./templates/index.html",
    publicPath: process.env.PA_BASEPATH,

    configureWebpack: {
        devtool: "source-map",
        resolve: {
            alias: {
                vue$: "vue/dist/vue.esm.js", // 'vue/dist/vue.common.js' for webpack 1
            },
        },
        // plugins: [
        //     new CircularDependencyPlugin({
        //         exclude: /a\.js|node_modules/,
        //         failOnError: false,
        //         allowAsyncCycles: false,
        //         cwd: process.cwd(),
        //     }),
        //     new BundleAnalyzerPlugin({ analyzerPort: process.env.VUE_CLI_MODERN_BUILD ? 8888 : 9999 }),
        // ],
    },

    parallel: require("os").cpus().length > 1 && !process.env.CIRCLECI,

    pluginOptions: {
        i18n: {
            locale: "en",
            fallbackLocale: "en",
            localeDir: "locales",
            enableInSFC: true,
        },
    },
};
