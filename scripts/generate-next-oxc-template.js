#!/usr/bin/env node
import { existsSync } from "node:fs";
import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { runCommand } from "../src/commands.js";
import { readJson, sortObject, writeJson } from "../src/json.js";
import { repoRoot } from "./config.js";

const templateName = "next-oxc";
const templateDir = path.join(repoRoot, "templates", templateName);
const force = process.argv.includes("--force");

const dependencies = {
  "@hookform/resolvers": "^5.4.0",
  "@tanstack/react-query": "^5.101.2",
  ky: "^2.0.2",
  next: "16.2.10",
  react: "19.2.7",
  "react-dom": "19.2.7",
  "react-hook-form": "^7.81.0",
  zod: "^4.4.3",
};

const devDependencies = {
  "@tailwindcss/postcss": "^4.3.2",
  "@tanstack/eslint-plugin-query": "^5.101.2",
  "@types/node": "^26.1.1",
  "@types/react": "^19.2.17",
  "@types/react-dom": "^19.2.3",
  "babel-plugin-react-compiler": "1.0.0",
  husky: "^9.1.7",
  "lint-staged": "^17.0.8",
  oxfmt: "^0.58.0",
  oxlint: "^1.73.0",
  "oxlint-tsgolint": "^0.24.0",
  tailwindcss: "^4.3.2",
  typescript: "^6.0.3",
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
    await runCommand(
      "pnpm",
      [
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
      ],
      repoRoot,
    );

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
  const packageJson = await readJson(packageJsonPath);

  packageJson.name = templateName;
  packageJson.type = "module";
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
  const huskyDir = path.join(projectDir, ".husky");

  await mkdir(huskyDir, { recursive: true });

  await Promise.all([
    writeFile(
      path.join(projectDir, "README.md"),
      `# Next.js OXC Starter

Next.js App Router, TypeScript, Tailwind CSS, React Compiler, TanStack Query, oxlint, oxfmt 기반 프로젝트입니다.

## 시작

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

페이지는 \`src/app/page.tsx\`에서 수정합니다.

## 명령

\`\`\`bash
pnpm dev
pnpm lint
pnpm format
pnpm build
pnpm start
\`\`\`

## 배포

Vercel은 별도 설정 없이 Next.js를 배포합니다. 이 템플릿은 Dockerfile을 기본 제공하지 않습니다. 자체 서버나 컨테이너 환경에 배포할 때만 Next.js 공식 standalone Docker 구성을 추가하세요.
`,
    ),
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
      path.join(projectDir, "src", "app", "providers.tsx"),
      `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
`,
    ),
    writeFile(
      path.join(projectDir, "src", "app", "layout.tsx"),
      `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={\`\${geistSans.variable} \${geistMono.variable} h-full antialiased\`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
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
    writeFile(path.join(huskyDir, "pre-commit"), "pnpm exec lint-staged\n"),
    writeFile(path.join(huskyDir, "pre-push"), "pnpm run build\n"),
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

  await Promise.all([chmod(path.join(huskyDir, "pre-commit"), 0o755), chmod(path.join(huskyDir, "pre-push"), 0o755)]);
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
