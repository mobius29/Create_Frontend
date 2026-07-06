import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["import", "unicorn"],
  env: { es6: true },
  ignorePatterns: ["node_modules/**", "templates/**"],
  categories: {
    correctness: "warn",
  },
  rules: {
    "eslint/no-unused-vars": "error",
  },
});
