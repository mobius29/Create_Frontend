import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { applyBackendIntegration } from "../src/backend-integrations.js";
import { readJson, writeJson } from "../src/json.js";

const templates = [
  {
    clientPath: path.join("app", "lib", "supabase.ts"),
    envName: "VITE_SUPABASE_URL",
    name: "react-router-ts",
  },
  {
    clientPath: path.join("src", "lib", "supabase.ts"),
    envName: "NEXT_PUBLIC_SUPABASE_URL",
    name: "next-oxc",
  },
];

for (const template of templates) {
  test(`adds the Supabase integration to ${template.name}`, async (context) => {
    const targetDir = await mkdtemp(path.join(os.tmpdir(), "create-frontend-backend-"));
    context.after(() => rm(targetDir, { force: true, recursive: true }));
    await writeJson(path.join(targetDir, "package.json"), {
      dependencies: { zod: "^4.0.0" },
      name: "test-app",
    });
    await writeFile(path.join(targetDir, ".gitignore"), ".env*\n");

    await applyBackendIntegration("supabase", template.name, targetDir);

    const packageJson = await readJson(path.join(targetDir, "package.json"));
    const envExample = await readFile(path.join(targetDir, ".env.example"), "utf8");
    const gitignore = await readFile(path.join(targetDir, ".gitignore"), "utf8");
    const client = await readFile(path.join(targetDir, template.clientPath), "utf8");

    assert.equal(packageJson.dependencies["@supabase/supabase-js"], "^2.110.2");
    assert.match(envExample, new RegExp(template.envName));
    assert.match(gitignore, /!\.env\.example/);
    assert.match(client, /createClient/);
  });
}
