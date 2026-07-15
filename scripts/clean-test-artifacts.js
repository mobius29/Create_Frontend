#!/usr/bin/env node
import { rm } from "node:fs/promises";
import path from "node:path";

import { readJson } from "../src/json.js";
import { repoRoot, smokeTargets } from "./config.js";

const dryRun = process.argv.includes("--dry-run");

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`clean-test-artifacts failed: ${message}`);
  process.exitCode = 1;
});

async function main() {
  const packageJson = await readJson(path.join(repoRoot, "package.json"));
  const tarballName = toTarballName(packageJson.name, packageJson.version);
  const artifacts = [
    ...Object.values(smokeTargets),
    path.join(path.dirname(smokeTargets["react-router-ts"]), tarballName),
    path.join(repoRoot, tarballName),
  ];

  for (const artifact of artifacts) {
    if (dryRun) {
      console.log(`Would remove ${artifact}`);
      continue;
    }

    await rm(artifact, { force: true, recursive: true });
    console.log(`Removed ${artifact}`);
  }
}

function toTarballName(packageName, version) {
  const normalizedName = packageName.replace(/^@/, "").replaceAll("/", "-");

  return `${normalizedName}-${version}.tgz`;
}
