import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const testDir = "tests";
const isRealGui = process.argv.includes("--real-gui") || process.env.RUN_REAL_GUI_E2E === "1";

let testFiles = readdirSync(testDir)
  .filter((f) => f.endsWith(".test.mjs"))
  .sort()
  .map((f) => join(testDir, f));

if (!isRealGui) {
  // Keep default test run fast, headless-safe, and non-intrusive to active user windows
  testFiles = testFiles.filter((f) => !f.includes("gui-e2e"));
}

const res = spawnSync(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit",
});

process.exit(res.status ?? 1);
