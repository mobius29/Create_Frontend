import path from "node:path";

import { note, outro } from "@clack/prompts";

import { isInteractive } from "./prompts.js";

export function printSuccess({ packageManager, projectName, shouldInstall, targetDir }) {
  const relativeTarget = path.relative(process.cwd(), targetDir) || ".";
  const runPrefix = packageManager === "npm" ? "npm run" : packageManager;
  const nextSteps = [];

  if (relativeTarget !== ".") {
    nextSteps.push(`cd ${relativeTarget}`);
  }

  if (!shouldInstall) {
    nextSteps.push(`${packageManager} install`);
  }

  nextSteps.push(`${runPrefix} dev`);

  if (isInteractive()) {
    note(nextSteps.join("\n"), "Next steps");
    outro(`Created ${projectName} in ${relativeTarget}`);
    return;
  }

  console.log("");
  console.log(`Created ${projectName} in ${relativeTarget}`);
  console.log("");
  console.log("Next steps:");
  console.log(nextSteps.map((step) => `  ${step}`).join("\n"));
}

export function printError(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("");
  console.error(`create-frontend failed: ${message}`);
}
