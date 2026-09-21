import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AppNotFoundError,
  ComputerUseError,
  ElementNotFoundError,
  InvalidArgumentError,
  PermissionDeniedError,
  StaleHandleError,
  TimeoutError,
  executeSequentialBatch,
} from "../packages/core/dist/index.js";

test("Structured Error Taxonomy properties and serialization", () => {
  const permErr = new PermissionDeniedError("accessibility disabled", "accessibility");
  assert.equal(permErr.code, "permission_denied");
  assert.equal(permErr.recoverable, false);
  assert.equal(permErr.actionSent, false);
  assert.ok(permErr.message.includes("required: accessibility"));

  const staleErr = new StaleHandleError("h_btn_123", "s_old");
  assert.equal(staleErr.code, "stale_handle");
  assert.equal(staleErr.recoverable, true);

  const notFoundErr = new ElementNotFoundError("SubmitButton");
  assert.equal(notFoundErr.code, "element_not_found");
  assert.equal(notFoundErr.recoverable, true);

  const timeoutErr = new TimeoutError("click", 5000);
  assert.equal(timeoutErr.code, "timeout");

  const serialized = staleErr.toJSON();
  assert.equal(serialized.code, "stale_handle");
  assert.equal(serialized.recoverable, true);
});

test("Sequential Batch Action Engine handles step failure cleanly", async () => {
  // Mock adapter simulating failure on step 2
  const mockAdapter = {
    click: async (target) => {
      if (target.handle === "h_fail") {
        throw new ElementNotFoundError("Failed button");
      }
      return { ok: true, action: "click", action_sent: true, receipt: "Clicked" };
    },
    setValue: async () => ({ ok: true, action: "set_value", action_sent: true, receipt: "Set" }),
    typeText: async () => ({ ok: true, action: "type_text", action_sent: true, receipt: "Typed" }),
    pressKey: async () => ({ ok: true, action: "press_key", action_sent: true, receipt: "Key" }),
  };

  const steps = [
    { name: "Step 1", action: "click", target: { type: "element", handle: "h_ok" } },
    { name: "Step 2", action: "click", target: { type: "element", handle: "h_fail" } },
    { name: "Step 3", action: "setValue", target: { type: "element", handle: "h_input" }, value: "test" },
  ];

  const report = await executeSequentialBatch(mockAdapter, steps);
  assert.equal(report.overall_success, false);
  assert.equal(report.total_steps, 3);
  assert.equal(report.completed_steps, 1);
  assert.equal(report.failed_step_index, 1);
  assert.equal(report.failed_action, "Step 2");
  assert.ok(report.error?.includes("Element not found"));
});
