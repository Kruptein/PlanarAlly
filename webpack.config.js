const path = require('path');

module.exports = {
    entry: './PlanarAlly/client/src/planarally.ts',
    output: {
        filename: 'planarally.js',
        path: path.resolve(__dirname, 'PlanarAlly', 'static', 'js')
    },
    mode: 'development',
    devtool: 'inline-source-map',
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                options: {
                    errorsAsWarnings: true
                }
            },
            {
                test: /\.js$/,
                loader: "source-map-loader",
                enforce: "pre"
            }
        ]
    },
};