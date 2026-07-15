import fs from "fs-extra";

export async function readJson(filePath) {
  return fs.readJson(filePath);
}

export async function writeJson(filePath, value) {
  await fs.writeJson(filePath, value, { spaces: 2 });
}

export function sortObject(value = {}) {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}
