import { constants } from "node:fs";
import { access, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

export async function prepareTargetDirectory(targetDir, overwrite) {
  const exists = await pathExists(targetDir);

  if (!exists) {
    await mkdir(targetDir, { recursive: true });
    return;
  }

  const targetStat = await stat(targetDir);

  if (!targetStat.isDirectory()) {
    throw new Error(`Target path exists and is not a directory: ${targetDir}`);
  }

  const files = await readdir(targetDir);

  if (files.length === 0) {
    return;
  }

  if (!overwrite) {
    throw new Error(`Target directory is not empty: ${targetDir}\nUse --overwrite to replace its contents.`);
  }

  await emptyDirectory(targetDir);
}

export async function targetDirectoryNeedsOverwrite(targetDir) {
  const exists = await pathExists(targetDir);

  if (!exists) {
    return false;
  }

  const targetStat = await stat(targetDir);

  if (!targetStat.isDirectory()) {
    return false;
  }

  const files = await readdir(targetDir);
  return files.length > 0;
}

async function emptyDirectory(directory) {
  const entries = await readdir(directory);

  await Promise.all(
    entries.map((entry) =>
      rm(path.join(directory, entry), {
        force: true,
        recursive: true,
      }),
    ),
  );
}

export async function pathExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
