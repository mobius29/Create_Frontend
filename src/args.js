export const helpText = `
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

export function parseArgs(args) {
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
