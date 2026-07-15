#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkRoots = ["src", "scripts"];

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
    runNodeCheck(file);
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

function runNodeCheck(file) {
  const relativeFile = path.relative(repoRoot, file);
  const result = spawnSync(process.execPath, ["--check", relativeFile], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`node --check ${relativeFile} failed with exit code ${result.status}.`);
  }
}
