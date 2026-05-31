module.exports = {
  testEnvironment: "node",

  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { configFile: "./babel.config.js" }],
  },

  roots: ["<rootDir>/tests"],

  testMatch: ["**/*.test.js"],

  moduleNameMapper: {
    "^expo-secure-store$": "<rootDir>/tests/__mocks__/expo-secure-store.js",
    "^@react-native-async-storage/async-storage$":
      "<rootDir>/tests/__mocks__/async-storage.js",
  },

  // Map native modules to mocks so Jest never tries to load native code
  moduleNameMapper: {
    "^expo-secure-store$": "<rootDir>/tests/__mocks__/expo-secure-store.js",
    "^@react-native-async-storage/async-storage$":
      "<rootDir>/tests/__mocks__/async-storage.js",
  },

  collectCoverageFrom: [
    "services/api.js",
  ],

  coverageReporters: ["text", "lcov", "html"],

  testTimeout: 10000,
};
