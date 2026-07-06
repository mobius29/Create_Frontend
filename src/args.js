import { Command, CommanderError } from "commander";

export const helpText = createArgsCommand().helpInformation().trim();

export function parseArgs(args) {
  const command = createArgsCommand();

  try {
    command.parse(args, { from: "user" });
  } catch (error) {
    throw normalizeCommanderError(error);
  }

  const options = command.opts();

  return {
    git: options.git,
    help: Boolean(options.help),
    install: options.install,
    overwrite: options.overwrite,
    targetDir: command.processedArgs[0],
    template: options.template,
    yes: Boolean(options.yes),
  };
}

function createArgsCommand() {
  return new Command()
    .name("create-frontend")
    .usage("[project-name] [options]")
    .argument("[project-name]", "Project directory to create.")
    .option("--template <name>", "Template to use. Defaults to react-router-ts.")
    .option("--install", "Install dependencies after generating the project.")
    .option("--no-install", "Skip dependency installation.")
    .option("--git", "Initialize a git repository.")
    .option("--no-git", "Skip git initialization.")
    .option("--overwrite", "Empty the target directory before copying files.")
    .option("-y, --yes", "Use defaults for missing prompts.")
    .helpOption(false)
    .option("-h, --help", "Show this help message.")
    .exitOverride()
    .configureOutput({
      writeErr: () => {},
      writeOut: () => {},
    });
}

function normalizeCommanderError(error) {
  if (error instanceof CommanderError) {
    return new Error(error.message.replace(/^error: /, ""));
  }

  return error;
}
