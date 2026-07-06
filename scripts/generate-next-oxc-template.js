#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateName = "next-oxc";
const templateDir = path.join(repoRoot, "templates", templateName);
const force = process.argv.includes("--force");

const dependencies = {
  "@hookform/resolvers": "^5.2.2",
  "@tanstack/react-query": "^5.100.10",
  ky: "^2.0.2",
  "react-hook-form": "^7.75.0",
  zod: "^4.4.3",
};

const devDependencies = {
  "@tanstack/eslint-plugin-query": "^5.100.10",
  "babel-plugin-react-compiler": "1.0.0",
  husky: "^9.1.7",
  "lint-staged": "^16.4.0",
  oxfmt: "^0.47.0",
  oxlint: "^1.62.0",
  "oxlint-tsgolint": "^0.22.1",
};

const generatedLinterPackages = ["@biomejs/biome", "eslint", "eslint-config-next"];

const packageScripts = {
  dev: "next dev",
  build: "next build",
  start: "next start",
  lint: "oxlint",
  "lint:fix": "oxlint --fix",
  format: "oxfmt",
  "format:check": "oxfmt --check",
  prepare: "husky",
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`generate-next-oxc-template failed: ${message}`);
  process.exitCode = 1;
});

async function main() {
  if (!force && existsSync(templateDir)) {
    throw new Error(`${path.relative(repoRoot, templateDir)} already exists. Re-run with --force to replace it.`);
  }

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "next-oxc-template-"));
  const generatedDir = path.join(tempRoot, templateName);

  try {
    run("pnpm", [
      "create",
      "next-app@latest",
      generatedDir,
      "--yes",
      "--ts",
      "--tailwind",
      "--app",
      "--src-dir",
      "--import-alias",
      "@/*",
      "--skip-install",
      "--disable-git",
      "--no-agents-md",
    ]);

    await applyTemplateDefaults(generatedDir);

    await rm(templateDir, { force: true, recursive: true });
    await mkdir(path.dirname(templateDir), { recursive: true });
    await cp(generatedDir, templateDir, {
      dereference: true,
      recursive: true,
    });

    console.log(`Generated ${path.relative(repoRoot, templateDir)}`);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

async function applyTemplateDefaults(projectDir) {
  await updatePackageJson(projectDir);
  await writeTemplateFiles(projectDir);
  await normalizeIgnoredFiles(projectDir);
}

async function updatePackageJson(projectDir) {
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

  packageJson.name = templateName;
  packageJson.scripts = packageScripts;
  packageJson.dependencies = sortObject({
    ...packageJson.dependencies,
    ...dependencies,
  });
  packageJson.devDependencies = sortObject({
    ...packageJson.devDependencies,
    ...devDependencies,
  });

  for (const packageName of generatedLinterPackages) {
    delete packageJson.dependencies?.[packageName];
    delete packageJson.devDependencies?.[packageName];
  }

  await writeJson(packageJsonPath, packageJson);
}

async function writeTemplateFiles(projectDir) {
  await Promise.all([
    writeFile(
      path.join(projectDir, "next.config.ts"),
      `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
`,
    ),
    writeFile(
      path.join(projectDir, "oxlint.config.ts"),
      `import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["import", "typescript", "unicorn"],
  env: { browser: true, es6: true },
  ignorePatterns: [".next/**", "build/**", "node_modules/**", "out/**"],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  jsPlugins: ["@tanstack/eslint-plugin-query"],
  categories: {
    correctness: "warn",
  },
  rules: {
    "eslint/no-unused-vars": "error",
  },
});
`,
    ),
    writeFile(
      path.join(projectDir, "oxfmt.config.ts"),
      `import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 120,
  ignorePatterns: [".next/**", "dist/**", "node_modules/**", "out/**"],
  sortImports: true,
  sortTailwindcss: true,
});
`,
    ),
    writeFile(
      path.join(projectDir, ".lintstagedrc.json"),
      `${JSON.stringify(
        {
          "*.{ts,tsx,js,jsx}": ["oxfmt", "oxlint --fix --type-aware"],
          "*.{css,json}": ["oxfmt"],
        },
        null,
        2,
      )}\n`,
    ),
    writeFile(
      path.join(projectDir, "pnpm-workspace.yaml"),
      `allowBuilds:
  sharp: true
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
`,
    ),
  ]);
}

async function normalizeIgnoredFiles(projectDir) {
  const gitignorePath = path.join(projectDir, ".gitignore");
  const gitignore = existsSync(gitignorePath) ? await readFile(gitignorePath, "utf8") : defaultGitignore();

  await writeFile(path.join(projectDir, "_gitignore"), gitignore);

  await Promise.all([
    rm(gitignorePath, { force: true }),
    rm(path.join(projectDir, ".git"), { force: true, recursive: true }),
    rm(path.join(projectDir, ".next"), { force: true, recursive: true }),
    rm(path.join(projectDir, "AGENTS.md"), { force: true }),
    rm(path.join(projectDir, "CLAUDE.md"), { force: true }),
    rm(path.join(projectDir, ".eslintrc.json"), { force: true }),
    rm(path.join(projectDir, "biome.json"), { force: true }),
    rm(path.join(projectDir, "biome.jsonc"), { force: true }),
    rm(path.join(projectDir, "eslint.config.mjs"), { force: true }),
    rm(path.join(projectDir, "next-env.d.ts"), { force: true }),
    rm(path.join(projectDir, "node_modules"), { force: true, recursive: true }),
    rm(path.join(projectDir, "pnpm-lock.yaml"), { force: true }),
  ]);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}.`);
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right)));
}

function defaultGitignore() {
  return `# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
}
