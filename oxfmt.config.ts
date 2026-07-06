import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 120,
  ignorePatterns: ["node_modules/**", "templates/**"],
  sortImports: true,
  sortTailwindcss: true,
});
