#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { access, cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const generatorRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesRoot = path.join(generatorRoot, "templates");
const defaultTemplate = "react-router-ts";

const helpText = `
Usage:
  pnpm create frontend [project-name] [options]
  pnpm dlx create-frontend [project-name] [options]

Options:
  --template <name>   Template to use. Defaults to react-router-ts.
  --install           Install dependencies after generating the project.
  --no-install        Skip dependency installation.
  --git               Initialize a git repository.
  --no-git            Skip git initialization.
  --overwrite         Empty the target directory before copying files.
  -y, --yes           Use defaults for missing prompts.
  -h, --help          Show this help message.
`;

main().catch((error) => {
  printError(error);
  process.exit(1);
});

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(helpText.trim());
    return;
  }

  const templates = await getTemplates();
  const template = await resolveTemplate(options.template, templates, options.yes);
  const targetName = await resolveTargetName(options.targetDir, options.yes);
  const targetDir = path.resolve(process.cwd(), targetName);
  const packageName = toPackageName(path.basename(targetDir));
  const packageManager = detectPackageManager();

  await prepareTargetDirectory(targetDir, Boolean(options.overwrite));
  await copyTemplate(template, targetDir);
  await updatePackageJson(targetDir, packageName);
  await normalizeTemplateFiles(targetDir);

  const shouldInstall = await resolveBooleanOption({
    currentValue: options.install,
    defaultValue: false,
    message: `Install dependencies with ${packageManager}?`,
    yes: options.yes,
  });

  const shouldInitGit = await resolveBooleanOption({
    currentValue: options.git,
    defaultValue: false,
    message: "Initialize a git repository?",
    yes: options.yes,
  });

  if (shouldInstall) {
    runCommand(packageManager, ["install"], targetDir);
  }

  if (shouldInitGit) {
    runCommand("git", ["init"], targetDir);
  }

  printSuccess({
    packageManager,
    projectName: path.basename(targetDir),
    shouldInstall,
    targetDir,
  });
}

function parseArgs(args) {
  const options = {
    git: undefined,
    help: false,
    install: undefined,
    overwrite: false,
    targetDir: undefined,
    template: undefined,
    yes: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg === "-y" || arg === "--yes") {
      options.yes = true;
      continue;
    }

    if (arg === "--install") {
      options.install = true;
      continue;
    }

    if (arg === "--no-install") {
      options.install = false;
      continue;
    }

    if (arg === "--git") {
      options.git = true;
      continue;
    }

    if (arg === "--no-git") {
      options.git = false;
      continue;
    }

    if (arg === "--overwrite") {
      options.overwrite = true;
      continue;
    }

    if (arg === "--template") {
      const value = args[index + 1];

      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --template.");
      }

      options.template = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--template=")) {
      options.template = arg.slice("--template=".length);
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.targetDir) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    options.targetDir = arg;
  }

  return options;
}

async function getTemplates() {
  const entries = await readdir(templatesRoot, { withFileTypes: true });
  const templates = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

  if (templates.length === 0) {
    throw new Error("No templates were found in the package.");
  }

  return templates;
}

async function resolveTemplate(templateName, templates, yes) {
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

async function resolveTargetName(targetDir, yes) {
  if (targetDir) {
    return targetDir;
  }

  if (yes) {
    return "my-app";
  }

  ensureInteractive("Project name is required in non-interactive mode.");
  return prompt("Project name", "my-app");
}

async function resolveBooleanOption({ currentValue, defaultValue, message, yes }) {
  if (typeof currentValue === "boolean") {
    return currentValue;
  }

  if (yes || !isInteractive()) {
    return defaultValue;
  }

  const answer = await prompt(`${message} ${defaultValue ? "[Y/n]" : "[y/N]"}`, defaultValue ? "y" : "n");
  return ["y", "yes"].includes(answer.trim().toLowerCase());
}

async function prepareTargetDirectory(targetDir, overwrite) {
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

async function copyTemplate(templateName, targetDir) {
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
  return segments.some((segment) => ["node_modules", "build", "dist", ".react-router", ".pnpm-store"].includes(segment));
}

async function updatePackageJson(targetDir, packageName) {
  const packageJsonPath = path.join(targetDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

  packageJson.name = packageName;

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

async function normalizeTemplateFiles(targetDir) {
  const gitignoreTemplate = path.join(targetDir, "_gitignore");

  if (await pathExists(gitignoreTemplate)) {
    await rename(gitignoreTemplate, path.join(targetDir, ".gitignore"));
  }
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}.`);
  }
}

function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent ?? "";

  if (userAgent.startsWith("pnpm")) {
    return "pnpm";
  }

  if (userAgent.startsWith("yarn")) {
    return "yarn";
  }

  if (userAgent.startsWith("bun")) {
    return "bun";
  }

  return "npm";
}

function toPackageName(name) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-~]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return normalized || "my-app";
}

async function prompt(label, defaultValue) {
  const rl = createInterface({ input, output });

  try {
    const suffix = defaultValue ? ` (${defaultValue})` : "";
    const answer = await rl.question(`${label}${suffix}: `);
    return answer.trim() || defaultValue;
  } finally {
    rl.close();
  }
}

function ensureInteractive(message) {
  if (!isInteractive()) {
    throw new Error(message);
  }
}

function isInteractive() {
  return Boolean(input.isTTY && output.isTTY);
}

async function pathExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function printSuccess({ packageManager, projectName, shouldInstall, targetDir }) {
  const relativeTarget = path.relative(process.cwd(), targetDir) || ".";
  const runPrefix = packageManager === "npm" ? "npm run" : packageManager;

  console.log("");
  console.log(`Created ${projectName} in ${relativeTarget}`);
  console.log("");
  console.log("Next steps:");

  if (relativeTarget !== ".") {
    console.log(`  cd ${relativeTarget}`);
  }

  if (!shouldInstall) {
    console.log(`  ${packageManager} install`);
  }

  console.log(`  ${runPrefix} dev`);
}

function printError(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("");
  console.error(`create-frontend failed: ${message}`);
}
