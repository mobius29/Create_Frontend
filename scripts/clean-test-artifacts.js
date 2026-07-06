#!/usr/bin/env node
import { readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`clean-test-artifacts failed: ${message}`);
  process.exitCode = 1;
});

async function main() {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
  const tarballName = toTarballName(packageJson.name, packageJson.version);
  const artifacts = [
    path.join(os.tmpdir(), "create-frontend-smoke"),
    path.join(os.tmpdir(), "create-frontend-next-oxc-smoke"),
    path.join(os.tmpdir(), tarballName),
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
