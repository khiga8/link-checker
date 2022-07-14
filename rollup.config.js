import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "./src/index.js",
  output: {
    file: "./build/bundle.min.js",
    format: "iife",
    name: "bundle",
  },
  plugins: [commonjs()],
};
