import path from "node:path";
import { fileURLToPath } from "node:url";

export const generatorRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const templatesRoot = path.join(generatorRoot, "templates");
export const defaultTemplate = "react-router-ts";
