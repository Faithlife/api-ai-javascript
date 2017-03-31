"use strict";

const path = require('path');

module.exports = {
  entry: {
    'index': './ts/index.ts',
  },

  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs-module',
  },

  target: 'node',

  devtool: 'source-map',

  resolve: {
    modules: [ 'node_modules' ],
    extensions: [ '.ts' ],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "awesome-typescript-loader",
      },
    ],
  },
};
