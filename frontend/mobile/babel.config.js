module.exports = {
  presets: [
    "babel-preset-expo",
    "@babel/preset-flow",
  ],
  plugins: [
    ["@babel/plugin-transform-flow-strip-types"],
  ],
};
