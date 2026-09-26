import { test } from "node:test";
import assert from "node:assert/strict";
import { runDoctor } from "../packages/cli/dist/index.js";

test("CLI Doctor executes and emits valid structured diagnostic report", async () => {
  const report = await runDoctor();

  assert.ok(report.timestamp, "Must include ISO timestamp");
  assert.equal(typeof report.overall_healthy, "boolean");
  assert.equal(typeof report.core_ready, "boolean");
  assert.equal(typeof report.real_gui_ready, "boolean");
  assert.ok(Array.isArray(report.missing_real_gui_prereqs), "Must have missing_real_gui_prereqs array");
  assert.ok(report.checks.runtime.node_version, "Must report Node version");
  assert.equal(report.checks.runtime.valid, true, "Node >= 20 must be valid");
  assert.equal(typeof report.checks.os.supported, "boolean");
  assert.equal(typeof report.checks.permissions.accessibility, "boolean");
  assert.equal(typeof report.checks.permissions.screen_recording, "boolean");
  assert.ok(report.checks.mcp.tools_count >= 30, "MCP tools count must be >= 30");
  assert.equal(report.checks.mcp.available, true);
});

test("CLI Doctor --require-real-gui strictly exits code 1 when CI is simulated", async () => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  try {
    await execFileAsync(
      process.execPath,
      ["packages/cli/bin/cua.mjs", "doctor", "--require-real-gui"],
      {
        env: { ...process.env, CI: "true", GITHUB_ACTIONS: "" },
      }
    );
    assert.fail("Must exit non-zero when CI is set with --require-real-gui");
  } catch (err) {
    assert.equal(err.code, 1, "Must exit with code 1");
    assert.ok(
      err.stderr?.includes("interactive_gui") || err.stdout?.includes("interactive_gui"),
      "Error must identify missing interactive_gui prerequisite"
    );
  }
});
