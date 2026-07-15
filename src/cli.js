import path from "node:path";

import { helpText, parseArgs } from "./args.js";
import { applyBackendIntegration, resolveBackend } from "./backend-integrations.js";
import { detectPackageManager, runCommand } from "./commands.js";
import { prepareTargetDirectory, targetDirectoryNeedsOverwrite } from "./filesystem.js";
import { printSuccess } from "./output.js";
import { toPackageName } from "./package-name.js";
import { resolveBooleanOption, resolveTargetName } from "./prompts.js";
import {
  copyTemplate,
  getTemplates,
  normalizeTemplateFiles,
  resolveTemplate,
  updatePackageJson,
} from "./template-files.js";

export async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(helpText.trim());
    return;
  }

  const templates = await getTemplates();
  const template = await resolveTemplate(options.template, templates, options.yes);
  const backend = await resolveBackend(options.backend, template, options.yes);
  const targetName = await resolveTargetName(options.targetDir, options.yes);
  const targetDir = path.resolve(process.cwd(), targetName);
  const packageName = toPackageName(path.basename(targetDir));
  const packageManager = detectPackageManager();
  const needsOverwrite = await targetDirectoryNeedsOverwrite(targetDir);
  const shouldOverwrite = needsOverwrite
    ? await resolveBooleanOption({
        currentValue: options.overwrite,
        defaultValue: false,
        message: `Target directory is not empty. Overwrite ${targetName}?`,
        yes: options.yes,
      })
    : Boolean(options.overwrite);

  await prepareTargetDirectory(targetDir, shouldOverwrite);
  await copyTemplate(template, targetDir);
  await updatePackageJson(targetDir, packageName);
  await normalizeTemplateFiles(targetDir);
  await applyBackendIntegration(backend, template, targetDir);

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
