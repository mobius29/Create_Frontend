import path from "node:path";

import fs from "fs-extra";

import { readJson, sortObject, writeJson } from "./json.js";
import { resolveChoiceOption } from "./prompts.js";

export const defaultBackend = "none";

const supabaseDependencyVersion = "^2.110.2";
const supportedBackendsByTemplate = new Map([
  ["next-oxc", [defaultBackend, "supabase"]],
  ["react-router-ts", [defaultBackend, "supabase"]],
]);

export async function resolveBackend(backendName, templateName, yes) {
  const backends = getBackendsForTemplate(templateName);

  if (backendName) {
    if (!backends.includes(backendName)) {
      throw new Error(
        `Unknown backend "${backendName}" for template "${templateName}". Available backends: ${backends.join(", ")}.`,
      );
    }

    return backendName;
  }

  const defaultValue = backends.includes(defaultBackend) ? defaultBackend : backends[0];

  return resolveChoiceOption({
    choices: backends.map((backend) => ({
      label: backend,
      value: backend,
    })),
    defaultValue,
    message: "Backend",
    yes,
  });
}

export async function applyBackendIntegration(backendName, templateName, targetDir) {
  if (backendName === defaultBackend) {
    return;
  }

  if (backendName !== "supabase") {
    throw new Error(`Unsupported backend "${backendName}".`);
  }

  await applySupabaseIntegration(templateName, targetDir);
}

function getBackendsForTemplate(templateName) {
  return supportedBackendsByTemplate.get(templateName) ?? [defaultBackend];
}

async function applySupabaseIntegration(templateName, targetDir) {
  await addPackageDependency(targetDir, "@supabase/supabase-js", supabaseDependencyVersion);

  if (templateName === "react-router-ts") {
    await writeReactRouterSupabaseFiles(targetDir);
  } else if (templateName === "next-oxc") {
    await writeNextSupabaseFiles(targetDir);
  } else {
    throw new Error(`Supabase is not configured for template "${templateName}".`);
  }

  await allowEnvExample(targetDir);
}

async function addPackageDependency(targetDir, packageName, version) {
  const packageJsonPath = path.join(targetDir, "package.json");
  const packageJson = await readJson(packageJsonPath);

  packageJson.dependencies = sortObject({
    ...packageJson.dependencies,
    [packageName]: version,
  });

  await writeJson(packageJsonPath, packageJson);
}

async function writeReactRouterSupabaseFiles(targetDir) {
  await fs.ensureDir(path.join(targetDir, "app", "lib"));

  await Promise.all([
    fs.writeFile(
      path.join(targetDir, ".env.example"),
      `VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
`,
    ),
    fs.writeFile(
      path.join(targetDir, "app", "env.d.ts"),
      `interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
`,
    ),
  ]);

  await fs.writeFile(
    path.join(targetDir, "app", "lib", "supabase.ts"),
    `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
`,
  );
}

async function writeNextSupabaseFiles(targetDir) {
  await Promise.all([
    fs.ensureDir(path.join(targetDir, "src", "lib")),
    fs.writeFile(
      path.join(targetDir, ".env.example"),
      `NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
`,
    ),
  ]);

  await fs.writeFile(
    path.join(targetDir, "src", "lib", "supabase.ts"),
    `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
`,
  );
}

async function allowEnvExample(targetDir) {
  const gitignorePath = path.join(targetDir, ".gitignore");
  let gitignore;

  try {
    gitignore = await fs.readFile(gitignorePath, "utf8");
  } catch {
    return;
  }

  if (gitignore.includes("!.env.example")) {
    return;
  }

  const updatedGitignore = gitignore.includes(".env*")
    ? gitignore.replace(".env*", ".env*\n!.env.example")
    : `${gitignore.trimEnd()}\n!.env.example\n`;

  await fs.writeFile(gitignorePath, updatedGitignore);
}
