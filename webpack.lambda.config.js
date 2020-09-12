const fs = require("fs");
const path = require("path");
const Dotenv = require("dotenv-webpack");

const extensions = fs.readdirSync("./lambdas/");
const entry = Object.fromEntries(
  extensions.map((e) => [e.substring(0, e.length - 3), `./lambdas/${e}`])
);

module.exports = {
  target: "node",
  externals: ["aws-sdk"],
  entry,
  resolve: {
    extensions: [".ts", ".js"],
  },
  mode: "production",
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, "out"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                noEmit: false,
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new Dotenv({
      path: ".env.local",
      systemvars: true,
    }),
  ],
};
