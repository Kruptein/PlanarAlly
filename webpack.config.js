const path = require("path");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: {
        // planarally: "./ts_src/game/planarally.ts",
        // assets: "./ts_src/assetManager/assets.ts",
        test: "./ts_src/app.ts",
    },
    output: {
        filename: "[name].[hash].js",
        path: path.resolve(__dirname, "PlanarAlly", "static", "js"),
        publicPath: "/static/js/",
    },
    devtool: "inline-source-map",
    resolve: {
        extensions: [".ts", ".js", ".vue"],
        alias: {
            vue$: "vue/dist/vue.esm.js",
        },
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader",
            },
            {
                test: /\.tsx?$/,
                use: [
                    { loader: "cache-loader" },
                    {
                        loader: "thread-loader",
                        options: {
                            workers: require("os").cpus().length - 1,
                        },
                    },
                    {
                        loader: "ts-loader",
                        options: {
                            happyPackMode: true,
                            appendTsSuffixTo: [/\.vue$/],
                        },
                    },
                ],
            },
            {
                test: /\.js$/,
                loader: "source-map-loader",
                enforce: "pre",
                exclude: [/node_modules\/vue-color/, /node_modules\/vue-slider-component/],
            },
            {
                test: /\.css$/,
                use: ["vue-style-loader", "css-loader"],
            },
        ],
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true }),
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            chunks: ["test"],
            template: path.resolve("ts_src", "app.html"),
            filename: path.resolve(__dirname, "PlanarAlly", "templates", "app.jinja2"),
        })
        // new HtmlWebpackPlugin({
        //     chunks: ["planarally"],
        //     template: path.resolve(__dirname, "PlanarAlly", "templates", "planarally.pre.jinja2"),
        //     filename: path.resolve(__dirname, "PlanarAlly", "templates", "planarally.jinja2"),
        // }),
        // new HtmlWebpackPlugin({
        //     chunks: ["assets"],
        //     template: path.resolve(__dirname, "PlanarAlly", "templates", "assets.pre.jinja2"),
        //     filename: path.resolve(__dirname, "PlanarAlly", "templates", "assets.jinja2"),
        // }),
    ],
};

if (process.env.NODE_ENV === "production") {
    module.exports.devtool = "#source-map";
    // http://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false,
            },
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true,
        }),
    ]);
}
