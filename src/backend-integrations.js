import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
      name: backend,
      value: backend,
    })),
    currentValue: backendName,
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
    await allowEnvExample(targetDir);
    return;
  }

  if (templateName === "next-oxc") {
    await writeNextSupabaseFiles(targetDir);
    await allowEnvExample(targetDir);
    return;
  }

  throw new Error(`Supabase is not configured for template "${templateName}".`);
}

async function addPackageDependency(targetDir, packageName, version) {
  const packageJsonPath = path.join(targetDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

  packageJson.dependencies = sortObject({
    ...packageJson.dependencies,
    [packageName]: version,
  });

  await writeJson(packageJsonPath, packageJson);
}

async function writeReactRouterSupabaseFiles(targetDir) {
  await Promise.all([
    mkdir(path.join(targetDir, "app", "lib"), { recursive: true }),
    writeFile(
      path.join(targetDir, ".env.example"),
      `VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
`,
    ),
    writeFile(
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

  await writeFile(
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
    mkdir(path.join(targetDir, "src", "lib"), { recursive: true }),
    writeFile(
      path.join(targetDir, ".env.example"),
      `NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
`,
    ),
  ]);

  await writeFile(
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
    gitignore = await readFile(gitignorePath, "utf8");
  } catch {
    return;
  }

  if (gitignore.includes("!.env.example")) {
    return;
  }

  const updatedGitignore = gitignore.includes(".env*")
    ? gitignore.replace(".env*", ".env*\n!.env.example")
    : `${gitignore.trimEnd()}\n!.env.example\n`;

  await writeFile(gitignorePath, updatedGitignore);
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right)));
}
