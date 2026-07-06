import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

export async function resolveTargetName(targetDir, yes) {
  if (targetDir) {
    return targetDir;
  }

  if (yes) {
    return "my-app";
  }

  ensureInteractive("Project name is required in non-interactive mode.");
  return prompt("Project name", "my-app");
}

export async function resolveBooleanOption({ currentValue, defaultValue, message, yes }) {
  if (typeof currentValue === "boolean") {
    return currentValue;
  }

  if (yes || !isInteractive()) {
    return defaultValue;
  }

  const answer = await prompt(`${message} ${defaultValue ? "[Y/n]" : "[y/N]"}`, defaultValue ? "y" : "n");
  return ["y", "yes"].includes(answer.trim().toLowerCase());
}

export async function prompt(label, defaultValue) {
  const rl = createInterface({ input, output });

  try {
    const suffix = defaultValue ? ` (${defaultValue})` : "";
    const answer = await rl.question(`${label}${suffix}: `);
    return answer.trim() || defaultValue;
  } finally {
    rl.close();
  }
}

export function ensureInteractive(message) {
  if (!isInteractive()) {
    throw new Error(message);
  }
}

export function isInteractive() {
  return Boolean(input.isTTY && output.isTTY);
}
