export function toPackageName(name) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-~]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return normalized || "my-app";
}
