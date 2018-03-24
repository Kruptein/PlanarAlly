const path = require('path');

module.exports = {
    entry: './PlanarAlly/client/src/planarally.ts',
    output: {
        filename: 'planarally.js',
        path: path.resolve(__dirname, 'PlanarAlly', 'static', 'js')
    },
    devtool: 'source-map',
    resolve: {
        extensions: [".webpack.js", ".web.js", ".tx", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader"
            },
            {
                test: /\.js$/,
                loader: "source-map-loader",
                enforce: "pre"
            }
        ]
    },
};