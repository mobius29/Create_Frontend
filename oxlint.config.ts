import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["import", "unicorn"],
  env: { es6: true },
  ignorePatterns: ["node_modules/**"],
  options: { typeAware: true, typeCheck: true },
  categories: {
    correctness: "warn",
  },
  rules: {
    "eslint/no-unused-vars": "error",
  },
});
