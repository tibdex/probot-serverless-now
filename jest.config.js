"use strict";

module.exports = {
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 65,
      statements: 95,
    },
  },
  preset: "ts-jest",
  reporters: ["default", ["jest-junit", { outputDirectory: "reports" }]],
  setupFiles: ["./setup-tests.ts"],
  testEnvironment: "node",
};
