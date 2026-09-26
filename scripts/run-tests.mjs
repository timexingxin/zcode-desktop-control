import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const testDir = "tests";
const isRealGui = process.argv.includes("--real-gui") || process.env.RUN_REAL_GUI_E2E === "1";

const allFiles = readdirSync(testDir)
  .filter((f) => f.endsWith(".test.mjs"))
  .sort()
  .map((f) => join(testDir, f));

const unitTestFiles = allFiles.filter((f) => !f.includes("gui-e2e"));
const guiTestFiles = allFiles.filter((f) => f.includes("gui-e2e"));

console.log("=======================================================");
console.log(" Stage 1: Unit & Core Tests");
console.log("=======================================================\n");

const unitRes = spawnSync(process.execPath, ["--test", ...unitTestFiles], {
  stdio: "inherit",
  env: { ...process.env },
});

if (unitRes.status !== 0) {
  console.error("\n[TEST STAGE 1 FAILED] Unit & Core tests failed with exit code:", unitRes.status);
  process.exit(unitRes.status ?? 1);
}
console.log("\n[TEST STAGE 1 PASSED] All Unit & Core tests passed cleanly.\n");

if (isRealGui) {
  console.log("=======================================================");
  console.log(" Stage 2: Real macOS GUI E2E Tests");
  console.log("=======================================================\n");

  const guiRes = spawnSync(process.execPath, ["--test", ...guiTestFiles], {
    stdio: "inherit",
    env: { ...process.env, RUN_REAL_GUI_E2E: "1" },
  });

  if (guiRes.status !== 0) {
    console.error("\n[TEST STAGE 2 FAILED] Real GUI E2E tests failed with exit code:", guiRes.status);
    process.exit(guiRes.status ?? 1);
  }
  console.log("\n[TEST STAGE 2 PASSED] Real GUI E2E tests passed cleanly.\n");
} else {
  console.log("[INFO] Skipping Stage 2 (Real GUI E2E tests). Pass --real-gui or RUN_REAL_GUI_E2E=1 to execute.");
}

process.exit(0);
