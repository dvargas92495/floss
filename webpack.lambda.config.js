const fs = require("fs");
const path = require("path");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");

const getEntries = (dir) => {
  const extensions = fs.readdirSync(`./${dir}/`);
  return extensions.map((e) => [e.substring(0, e.length - 3), `./${dir}/${e}`]);
};

module.exports = (_, { mode }) => {
  const entries = getEntries("lambdas");
  const devEntries = mode === "development" ? getEntries("dev") : [];
  const entry = Object.fromEntries([...entries, ...devEntries]);
  return {
    target: "node",
    externals: ["aws-sdk"],
    entry,
    resolve: {
      extensions: [".ts", ".js"],
    },
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
      // https://github.com/auth0/node-auth0/issues/493#issuecomment-668949147
      new webpack.DefinePlugin({ "global.GENTLY": false }),
    ],
  };
};
