#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const smokeTargets = {
  "next-oxc": "/tmp/create-frontend-next-oxc-smoke",
  "react-router-ts": "/tmp/create-frontend-smoke",
};

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`smoke failed: ${message}`);
  process.exitCode = 1;
}

function main() {
  const template = process.argv[2] ?? "react-router-ts";
  const targetDir = smokeTargets[template];

  if (!targetDir) {
    console.error(
      `Unknown smoke template "${template}". Available templates: ${Object.keys(smokeTargets).join(", ")}.`,
    );
    process.exitCode = 1;
    return;
  }

  runSmoke(template, targetDir);
}

function runSmoke(template, targetDir) {
  const result = spawnSync(
    process.execPath,
    ["src/index.js", targetDir, "--template", template, "--backend", "none", "--no-install", "--no-git", "--overwrite"],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status;
  }
}
