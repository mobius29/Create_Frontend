#!/usr/bin/env node
import { runCommand } from "../src/commands.js";
import { repoRoot, smokeTargets } from "./config.js";

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`smoke failed: ${message}`);
  process.exitCode = 1;
});

async function main() {
  const template = process.argv[2] ?? "react-router-ts";
  const targetDir = smokeTargets[template];

  if (!targetDir) {
    console.error(
      `Unknown smoke template "${template}". Available templates: ${Object.keys(smokeTargets).join(", ")}.`,
    );
    process.exitCode = 1;
    return;
  }

  await runSmoke(template, targetDir);
}

async function runSmoke(template, targetDir) {
  await runCommand(
    process.execPath,
    ["src/index.js", targetDir, "--template", template, "--backend", "none", "--no-install", "--no-git", "--overwrite"],
    repoRoot,
  );
}
