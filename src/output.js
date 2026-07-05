import path from "node:path";

export function printSuccess({
  packageManager,
  projectName,
  shouldInstall,
  targetDir,
}) {
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

export function printError(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("");
  console.error(`create-frontend failed: ${message}`);
}
