module.exports = {
  testEnvironment: "node",

  roots: ["<rootDir>/tests"],

  testMatch: [
    "**/*.test.js",
  ],

  collectCoverageFrom: [
    "index.js",
    "helpers.js",
    "database.js",
    "!node_modules/**",
    "!scripts/**",
  ],

  coverageThreshold: {
    global: {
      lines:      70,
      functions:  70,
      branches:   70,
      statements: 70,
    },
  },

  coverageReporters: ["text", "lcov", "html"],

  testTimeout: 15000,
};