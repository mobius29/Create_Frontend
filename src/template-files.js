import path from "node:path";

import fs from "fs-extra";

import { defaultTemplate, templatesRoot } from "./config.js";
import { readJson, writeJson } from "./json.js";
import { resolveChoiceOption } from "./prompts.js";

export async function getTemplates() {
  const entries = await fs.readdir(templatesRoot, { withFileTypes: true });
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

  const defaultValue = templates.includes(defaultTemplate) ? defaultTemplate : templates[0];

  return resolveChoiceOption({
    choices: templates.map((template) => ({
      label: template,
      value: template,
    })),
    defaultValue,
    message: "Template",
    yes,
  });
}

export async function copyTemplate(templateName, targetDir) {
  const sourceDir = path.join(templatesRoot, templateName);

  await fs.copy(sourceDir, targetDir, {
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
  const packageJson = await readJson(packageJsonPath);

  packageJson.name = packageName;

  await writeJson(packageJsonPath, packageJson);
}

export async function normalizeTemplateFiles(targetDir) {
  const gitignoreTemplate = path.join(targetDir, "_gitignore");

  if (await fs.pathExists(gitignoreTemplate)) {
    await fs.move(gitignoreTemplate, path.join(targetDir, ".gitignore"), { overwrite: true });
  }
}
