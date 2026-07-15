#!/usr/bin/env node

import { main } from "./cli.js";
import { printError } from "./output.js";
import { PromptCancelledError } from "./prompts.js";

main().catch((error) => {
  if (error instanceof PromptCancelledError) {
    return;
  }

  printError(error);
  process.exitCode = 1;
});
