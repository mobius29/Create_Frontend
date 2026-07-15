import { stdin, stdout } from "node:process";

import { cancel, confirm, isCancel, select, text } from "@clack/prompts";

export class PromptCancelledError extends Error {
  constructor() {
    super("Operation cancelled.");
    this.name = "PromptCancelledError";
  }
}

export async function resolveTargetName(targetDir, yes) {
  if (targetDir) {
    return targetDir;
  }

  if (yes) {
    return "my-app";
  }

  ensureInteractive("Project name is required in non-interactive mode.");
  const answer = await text({
    initialValue: "my-app",
    message: "Project name",
    validate: (value) => (value.trim() ? undefined : "Project name is required."),
  });

  return unwrapPrompt(answer).trim();
}

export async function resolveChoiceOption({ choices, currentValue, defaultValue, message, yes }) {
  if (currentValue) {
    return currentValue;
  }

  if (yes || !isInteractive()) {
    return defaultValue;
  }

  const answer = await select({
    initialValue: defaultValue,
    message,
    options: choices,
  });

  return unwrapPrompt(answer);
}

export async function resolveBooleanOption({ currentValue, defaultValue, message, yes }) {
  if (typeof currentValue === "boolean") {
    return currentValue;
  }

  if (yes || !isInteractive()) {
    return defaultValue;
  }

  const answer = await confirm({
    initialValue: defaultValue,
    message,
  });

  return unwrapPrompt(answer);
}

export function ensureInteractive(message) {
  if (!isInteractive()) {
    throw new Error(message);
  }
}

export function isInteractive() {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

function unwrapPrompt(value) {
  if (!isCancel(value)) {
    return value;
  }

  cancel("Operation cancelled.");
  throw new PromptCancelledError();
}
