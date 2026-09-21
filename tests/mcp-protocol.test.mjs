import { test } from "node:test";
import assert from "node:assert/strict";
import { MCPServer, TOOLS_MANIFEST } from "../packages/mcp-server/dist/index.js";

// Mock adapter for protocol testing
class MockAdapter {
  platform = "darwin";
  async listApps() {
    return [{ pid: 101, name: "Calculator", active: true }];
  }
  async listWindows() {
    return [
      {
        id: 101000,
        pid: 101,
        title: "Calculator",
        app_name: "Calculator",
        bounds: { x: 0, y: 0, width: 400, height: 600 },
        is_minimized: false,
        is_focused: true,
      },
    ];
  }
  async getActiveWindow() {
    return (await this.listWindows())[0];
  }
  async getAppState(appRef, _opts) {
    return {
      state_id: "s_mock_123",
      app: { pid: appRef.pid || 101, name: appRef.name || "Calculator", active: true },
      tree: [
        {
          index: 0,
          handle: "h_btn_plus",
          role: "button",
          name: "+",
          capabilities: ["pressable"],
          actions: ["AXPress"],
        },
      ],
      element_count: 1,
      timestamp: Date.now(),
    };
  }
  async takeScreenshot() {
    return { base64: "dGVzdA==", width: 400, height: 600 };
  }
  async click(target) {
    return { ok: true, action: "click", action_sent: true, receipt: "Clicked", target };
  }
  async doubleClick(target) {
    return { ok: true, action: "double_click", action_sent: true, receipt: "Double-clicked", target };
  }
  async rightClick(target) {
    return { ok: true, action: "right_click", action_sent: true, receipt: "Right-clicked", target };
  }
  async movePointer(x, y) {
    return { ok: true, action: "move_pointer", action_sent: true, receipt: `Moved to ${x},${y}` };
  }
  async scroll() {
    return { ok: true, action: "scroll", action_sent: true, receipt: "Scrolled" };
  }
  async typeText(text) {
    return { ok: true, action: "type_text", action_sent: true, receipt: `Typed: ${text}` };
  }
  async pressKey(key) {
    return { ok: true, action: "press_key", action_sent: true, receipt: `Key: ${key}` };
  }
  async hotkey(keys) {
    return { ok: true, action: "hotkey", action_sent: true, receipt: `Hotkey: ${keys.join("+")}` };
  }
  async setValue(target, value) {
    return { ok: true, action: "set_value", action_sent: true, receipt: `Set to ${value}`, target };
  }
  async performAction(target, action) {
    return { ok: true, action: "perform_action", action_sent: true, receipt: `Performed ${action}`, target };
  }
  async launchApp(name) {
    return { pid: 999, name, active: true };
  }
  async focusApp() {
    return true;
  }
  async focusWindow() {
    return true;
  }
  async moveWindow() {
    return true;
  }
  async resizeWindow() {
    return true;
  }
  async minimizeWindow() {
    return true;
  }
  async maximizeWindow() {
    return true;
  }
  async checkPermissions() {
    return { accessibility: true, screen_recording: true };
  }
  async requestAccess() {
    return { accessibility: "granted", screen_recording: "granted" };
  }
}

test("Tools Manifest adheres to MCP standards and provides 30+ tools", () => {
  assert.ok(TOOLS_MANIFEST.length >= 30, `Expected >= 30 tools, got ${TOOLS_MANIFEST.length}`);

  for (const tool of TOOLS_MANIFEST) {
    assert.ok(tool.name && typeof tool.name === "string", "Tool must have a string name");
    assert.ok(tool.description && typeof tool.description === "string", "Tool must have a description");
    assert.equal(tool.inputSchema.type, "object", `Tool ${tool.name} schema must have type="object"`);
    assert.ok(tool.inputSchema.properties, `Tool ${tool.name} must declare properties object`);
  }
});

test("MCP Server handles standard calls and formats text content", async () => {
  const server = new MCPServer(new MockAdapter());

  const resList = await server.handleCallTool("list_apps");
  assert.equal(resList.isError, undefined);
  assert.ok(resList.content.length > 0);
  assert.equal(resList.content[0].type, "text");

  const apps = JSON.parse(resList.content[0].text);
  assert.equal(apps[0].name, "Calculator");
});

test("MCP Server resolves legacy aliases smoothly", async () => {
  const server = new MCPServer(new MockAdapter());

  // left_click -> click
  const resClick = await server.handleCallTool("left_click", { target: { type: "element", handle: "h_btn" } });
  assert.equal(resClick.isError, undefined);
  const clickData = JSON.parse(resClick.content[0].text);
  assert.equal(clickData.action, "click");

  // open_application -> launch_app
  const resOpen = await server.handleCallTool("open_application", { name: "Calculator" });
  assert.equal(resOpen.isError, undefined);
  const openData = JSON.parse(resOpen.content[0].text);
  assert.equal(openData.name, "Calculator");

  // type -> type_text
  const resType = await server.handleCallTool("type", { text: "Hello World" });
  assert.equal(resType.isError, undefined);
  const typeData = JSON.parse(resType.content[0].text);
  assert.equal(typeData.action, "type_text");
});

test("MCP Server formats errors with structured taxonomy codes", async () => {
  const server = new MCPServer(new MockAdapter());

  const resUnknown = await server.handleCallTool("non_existent_tool_123");
  assert.equal(resUnknown.isError, true);
  const errPayload = JSON.parse(resUnknown.content[0].text);
  assert.equal(errPayload.code, "invalid_argument");
});
