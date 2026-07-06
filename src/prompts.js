import { stdin, stdout } from "node:process";

import { confirm, input, select } from "@inquirer/prompts";

export async function resolveTargetName(targetDir, yes) {
  if (targetDir) {
    return targetDir;
  }

  if (yes) {
    return "my-app";
  }

  ensureInteractive("Project name is required in non-interactive mode.");
  const answer = await input({
    default: "my-app",
    message: "Project name",
    validate: (value) => (value.trim() ? true : "Project name is required."),
  });

  return answer.trim();
}

export async function resolveChoiceOption({ choices, currentValue, defaultValue, message, yes }) {
  if (currentValue) {
    return currentValue;
  }

  if (yes || !isInteractive()) {
    return defaultValue;
  }

  return select({
    choices,
    default: defaultValue,
    message,
  });
}

export async function resolveBooleanOption({ currentValue, defaultValue, message, yes }) {
  if (typeof currentValue === "boolean") {
    return currentValue;
  }

  if (yes || !isInteractive()) {
    return defaultValue;
  }

  return confirm({
    default: defaultValue,
    message,
  });
}

export async function prompt(label, defaultValue) {
  const answer = await input({
    default: defaultValue,
    message: label,
  });

  return answer.trim() || defaultValue;
}

export function ensureInteractive(message) {
  if (!isInteractive()) {
    throw new Error(message);
  }
}

export function isInteractive() {
  return Boolean(stdin.isTTY && stdout.isTTY);
}
