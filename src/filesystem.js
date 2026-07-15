import fs from "fs-extra";

export async function prepareTargetDirectory(targetDir, overwrite) {
  const exists = await fs.pathExists(targetDir);

  if (!exists) {
    await fs.ensureDir(targetDir);
    return;
  }

  const targetStat = await fs.stat(targetDir);

  if (!targetStat.isDirectory()) {
    throw new Error(`Target path exists and is not a directory: ${targetDir}`);
  }

  const files = await fs.readdir(targetDir);

  if (files.length === 0) {
    return;
  }

  if (!overwrite) {
    throw new Error(`Target directory is not empty: ${targetDir}\nUse --overwrite to replace its contents.`);
  }

  await fs.emptyDir(targetDir);
}

export async function targetDirectoryNeedsOverwrite(targetDir) {
  const exists = await fs.pathExists(targetDir);

  if (!exists) {
    return false;
  }

  const targetStat = await fs.stat(targetDir);

  if (!targetStat.isDirectory()) {
    return false;
  }

  const files = await fs.readdir(targetDir);
  return files.length > 0;
}

export async function pathExists(filePath) {
  return fs.pathExists(filePath);
}
