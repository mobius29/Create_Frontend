import { cp, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { defaultTemplate, templatesRoot } from "./config.js";
import { pathExists } from "./filesystem.js";
import { isInteractive, prompt } from "./prompts.js";

export async function getTemplates() {
  const entries = await readdir(templatesRoot, { withFileTypes: true });
  const templates = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (templates.length === 0) {
    throw new Error("No templates were found in the package.");
  }

  return templates;
}

export async function resolveTemplate(templateName, templates, yes) {
  if (templateName) {
    if (!templates.includes(templateName)) {
      throw new Error(`Unknown template "${templateName}". Available templates: ${templates.join(", ")}.`);
    }

    return templateName;
  }

  if (templates.includes(defaultTemplate)) {
    return defaultTemplate;
  }

  if (yes || !isInteractive()) {
    return templates[0];
  }

  const answer = await prompt(`Template (${templates.join(", ")})`, templates[0]);

  if (!templates.includes(answer)) {
    throw new Error(`Unknown template "${answer}". Available templates: ${templates.join(", ")}.`);
  }

  return answer;
}

export async function copyTemplate(templateName, targetDir) {
  const sourceDir = path.join(templatesRoot, templateName);

  await cp(sourceDir, targetDir, {
    dereference: true,
    errorOnExist: false,
    filter: (source) => !shouldSkipTemplateFile(source),
    force: true,
    recursive: true,
  });
}

function shouldSkipTemplateFile(source) {
  const relativePath = path.relative(templatesRoot, source);
  const segments = relativePath.split(path.sep);
  return segments.some((segment) =>
    ["node_modules", "build", "dist", ".react-router", ".pnpm-store"].includes(segment),
  );
}

export async function updatePackageJson(targetDir, packageName) {
  const packageJsonPath = path.join(targetDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

  packageJson.name = packageName;

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

export async function normalizeTemplateFiles(targetDir) {
  const gitignoreTemplate = path.join(targetDir, "_gitignore");

  if (await pathExists(gitignoreTemplate)) {
    await rename(gitignoreTemplate, path.join(targetDir, ".gitignore"));
  }
}
