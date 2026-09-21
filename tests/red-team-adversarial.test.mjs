import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assignHandlesToTree,
  resolveElementWithAmbiguity,
  AmbiguousElementError,
  StaleHandleError,
  UnsupportedPlatformError,
} from "../packages/core/dist/index.js";
import { MCPServer } from "../packages/mcp-server/dist/index.js";
import { MacOSAdapter } from "../packages/platform-macos/dist/index.js";
import { WindowsAdapter } from "../packages/platform-windows/dist/index.js";

test("Red Team 1: Duplicate element names trigger AmbiguousElementError and prevent blind action", async () => {
  const duplicateTree = [
    {
      index: 0,
      handle: "",
      role: "window",
      name: "Preferences",
      capabilities: ["focused"],
      actions: [],
      children: [
        {
          index: 1,
          handle: "",
          role: "button",
          name: "Save",
          capabilities: ["pressable"],
          actions: ["AXPress"],
        },
        {
          index: 2,
          handle: "",
          role: "button",
          name: "Save",
          capabilities: ["pressable"],
          actions: ["AXPress"],
        },
      ],
    },
  ];

  const assigned = assignHandlesToTree(1001, duplicateTree);
  assert.equal(assigned[0].children[0].ambiguous, true, "First duplicate must be marked ambiguous");
  assert.equal(assigned[0].children[1].ambiguous, true, "Second duplicate must be marked ambiguous");
  assert.equal(assigned[0].children[0].ambiguity_count, 2);

  const resolved = resolveElementWithAmbiguity(assigned, { name: "Save" });
  assert.equal(resolved.ambiguous, true);
  assert.equal(resolved.count, 2);
});

test("Red Team 2: Stale State or Missing Handle throws StaleHandleError, never fake-success", async () => {
  const server = new MCPServer(new MacOSAdapter());
  const res = await server.handleCallTool("click", {
    target: {
      type: "element",
      state_id: "s_expired_9999",
      handle: "h_wk_button_12345",
    },
  });

  assert.equal(res.isError, true, "Expired state must produce an error");
  const payload = JSON.parse(res.content[0].text);
  assert.equal(payload.code, "stale_handle", "Must emit structured stale_handle code");
  assert.equal(payload.action_sent, false, "Must confirm action was NOT sent");
});

test("Red Team 3: Windows Adapter strictly throws UnsupportedPlatformError (Zero Fake-Success)", async () => {
  const winAdapter = new WindowsAdapter();
  const server = new MCPServer(winAdapter);

  const actions = ["click", "move_pointer", "scroll", "type_text", "set_value", "screenshot"];
  for (const action of actions) {
    const res = await server.handleCallTool(action, {
      target: { type: "coordinate", x: 100, y: 100 },
      text: "hello",
    });

    assert.equal(res.isError, true, `Action ${action} on Windows must fail truthfully`);
    const payload = JSON.parse(res.content[0].text);
    assert.equal(
      payload.code,
      "unsupported_platform",
      `Expected unsupported_platform for ${action}, got ${payload.code}`
    );
    assert.equal(payload.action_sent, false);
  }
});

test("Red Team 4: Unsupported tools (select_text) never return fake success", async () => {
  const server = new MCPServer();
  const res = await server.handleCallTool("select_text", {});
  assert.equal(res.isError, true);
  const payload = JSON.parse(res.content[0].text);
  assert.equal(payload.code, "unsupported_platform");
  assert.equal(payload.action_sent, false);
});

test("Red Team 5: Kill-Switch (stop_computer_control) blocks subsequent actions immediately", async () => {
  const server = new MCPServer();
  const stopRes = await server.handleCallTool("stop_computer_control", {});
  assert.equal(stopRes.isError, undefined);

  // Subsequent action must be rejected
  const clickRes = await server.handleCallTool("click", {
    target: { type: "coordinate", x: 100, y: 100 },
  });
  assert.equal(clickRes.isError, true, "Action after kill-switch must be rejected");
  const payload = JSON.parse(clickRes.content[0].text);
  assert.match(payload.error, /kill-switch/i);
});

test("Red Team 6: Capability Registry reflects truthful platform boundaries", async () => {
  const server = new MCPServer();
  const res = await server.handleCallTool("get_capabilities", {});
  assert.equal(res.isError, undefined);
  const caps = JSON.parse(res.content[0].text);

  assert.ok(caps.platform, "Must report platform");
  assert.ok(caps.pointer, "Must report pointer capabilities");
  assert.ok(caps.keyboard, "Must report keyboard capabilities");
  assert.ok(caps.accessibility, "Must report accessibility capabilities");
});

test("Red Team 7: Unknown tool name returns standard invalid_argument error", async () => {
  const server = new MCPServer();
  const res = await server.handleCallTool("completely_fake_nonexistent_tool", {});
  assert.equal(res.isError, true);
  const payload = JSON.parse(res.content[0].text);
  assert.equal(payload.code, "invalid_argument");
});
