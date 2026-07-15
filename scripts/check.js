#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import path from "node:path";

import { runCommand } from "../src/commands.js";
import { repoRoot } from "./config.js";

const checkRoots = ["src", "scripts", "test"];

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`check failed: ${message}`);
  process.exitCode = 1;
});

async function main() {
  const files = (await Promise.all(checkRoots.map((root) => collectJavaScriptFiles(path.join(repoRoot, root)))))
    .flat()
    .sort();

  for (const file of files) {
    await runNodeCheck(file);
  }
}

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectJavaScriptFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(entryPath);
    }
  }

  return files;
}

async function runNodeCheck(file) {
  const relativeFile = path.relative(repoRoot, file);
  await runCommand(process.execPath, ["--check", relativeFile], repoRoot);
}
