import { execa } from "execa";

export async function runCommand(command, args, cwd) {
  await execa(command, args, {
    cwd,
    stdio: "inherit",
  });
}

export function detectPackageManager() {
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
