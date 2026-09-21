import { test } from "node:test";
import assert from "node:assert/strict";
import { runDoctor } from "../packages/cli/dist/index.js";

test("CLI Doctor executes and emits valid structured diagnostic report", async () => {
  const report = await runDoctor();

  assert.ok(report.timestamp, "Must include ISO timestamp");
  assert.equal(typeof report.overall_healthy, "boolean");
  assert.ok(report.checks.runtime.node_version, "Must report Node version");
  assert.equal(report.checks.runtime.valid, true, "Node >= 20 must be valid");
  assert.equal(typeof report.checks.os.supported, "boolean");
  assert.equal(typeof report.checks.permissions.accessibility, "boolean");
  assert.equal(typeof report.checks.permissions.screen_recording, "boolean");
  assert.ok(report.checks.mcp.tools_count >= 30, "MCP tools count must be >= 30");
  assert.equal(report.checks.mcp.available, true);
});
