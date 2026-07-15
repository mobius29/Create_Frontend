import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { prepareTargetDirectory, targetDirectoryNeedsOverwrite } from "../src/filesystem.js";

test("creates a missing target directory", async (context) => {
  const parentDir = await mkdtemp(path.join(os.tmpdir(), "create-frontend-filesystem-"));
  const targetDir = path.join(parentDir, "project");
  context.after(() => rm(parentDir, { force: true, recursive: true }));

  assert.equal(await targetDirectoryNeedsOverwrite(targetDir), false);
  await prepareTargetDirectory(targetDir, false);
  assert.equal(await targetDirectoryNeedsOverwrite(targetDir), false);
});

test("requires confirmation before emptying a populated directory", async (context) => {
  const targetDir = await mkdtemp(path.join(os.tmpdir(), "create-frontend-filesystem-"));
  const existingFile = path.join(targetDir, "existing.txt");
  context.after(() => rm(targetDir, { force: true, recursive: true }));
  await writeFile(existingFile, "keep me");

  assert.equal(await targetDirectoryNeedsOverwrite(targetDir), true);
  await assert.rejects(() => prepareTargetDirectory(targetDir, false), /Use --overwrite/);
  assert.equal(await readFile(existingFile, "utf8"), "keep me");

  await prepareTargetDirectory(targetDir, true);
  assert.equal(await targetDirectoryNeedsOverwrite(targetDir), false);
});
