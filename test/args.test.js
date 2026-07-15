import assert from "node:assert/strict";
import test from "node:test";

import { parseArgs } from "../src/args.js";

test("parses explicit non-interactive options", () => {
  assert.deepEqual(
    parseArgs([
      "my-app",
      "--template",
      "next-oxc",
      "--backend",
      "supabase",
      "--install",
      "--git",
      "--overwrite",
      "--yes",
    ]),
    {
      backend: "supabase",
      git: true,
      help: false,
      install: true,
      overwrite: true,
      targetDir: "my-app",
      template: "next-oxc",
      yes: true,
    },
  );
});

test("parses negative boolean options", () => {
  const options = parseArgs(["my-app", "--no-install", "--no-git"]);

  assert.equal(options.install, false);
  assert.equal(options.git, false);
});

test("returns a concise error for unknown options", () => {
  assert.throws(() => parseArgs(["--unknown"]), /unknown option '--unknown'/);
});
