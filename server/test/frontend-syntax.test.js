import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

test("frontend app.js must be valid JavaScript", () => {
  const app = path.resolve(process.cwd(), "public/app.js");
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ["--check", app], { stdio: "pipe" });
  });
});
