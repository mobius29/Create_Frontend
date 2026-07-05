#!/usr/bin/env node

import { main } from "./cli.js";
import { printError } from "./output.js";

main().catch((error) => {
  printError(error);
  process.exit(1);
});
