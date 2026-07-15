import assert from "node:assert/strict";
import test from "node:test";

import { toPackageName } from "../src/package-name.js";

test("normalizes directory names into npm package names", () => {
  const cases = [
    ["My App", "my-app"],
    ["hello_world", "hello-world"],
    ["  --Frontend Template--  ", "frontend-template"],
    ["한글 프로젝트", "my-app"],
  ];

  for (const [input, expected] of cases) {
    assert.equal(toPackageName(input), expected);
  }
});
