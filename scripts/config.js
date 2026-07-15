import os from "node:os";
import path from "node:path";

import { generatorRoot } from "../src/config.js";

export const repoRoot = generatorRoot;

export const smokeTargets = Object.freeze({
  "next-oxc": path.join(os.tmpdir(), "create-frontend-next-oxc-smoke"),
  "react-router-ts": path.join(os.tmpdir(), "create-frontend-smoke"),
});
