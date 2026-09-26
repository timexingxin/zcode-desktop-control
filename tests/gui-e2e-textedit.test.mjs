import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { MacOSAdapter } from "../packages/platform-macos/dist/index.js";
import { MCPServer } from "../packages/mcp-server/dist/index.js";

const execFile = promisify(execFileCb);

test("macOS Real GUI E2E: TextEdit observe -> act -> re-observe -> state changed verification", async (t) => {
  if (process.platform !== "darwin") {
    t.skip("SKIPPED: Real macOS GUI E2E is only supported on Darwin");
    return;
  }

  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    t.skip("SKIPPED: Headless CI runner does not have an active Aqua GUI window server session");
    return;
  }

  const hasWindowServer = await execFile("pgrep", ["-x", "WindowServer"]).then(() => true).catch(() => false);
  if (!hasWindowServer) {
    t.skip("SKIPPED: NO_ACTIVE_GUI_SESSION (WindowServer process not detected)");
    return;
  }

  const adapter = new MacOSAdapter();
  const server = new MCPServer(adapter);

  // 1. Check permissions first
  const perms = await adapter.checkPermissions().catch(() => ({ accessibility: false, screen_recording: false }));
  if (!perms.accessibility) {
    t.skip("SKIPPED: ACCESSIBILITY_PERMISSION_REQUIRED");
    return;
  }

  const testToken = `ZCODE_VERIFY_${Date.now()}`;

  try {
    // 2. Launch TextEdit and ensure a new activated document is open
    await adapter.launchApp("TextEdit", true);
    await execFile("osascript", [
      "-e",
      'tell application "TextEdit" to activate\ntell application "TextEdit" to make new document',
    ]);
    await new Promise((r) => setTimeout(r, 600));

    // 3. Observe initial state via get_app_state
    const initialCall = await server.handleCallTool("get_app_state", {
      app_ref: { name: "TextEdit" },
      detail: "full",
    });
    assert.equal(initialCall.isError, undefined, "get_app_state must succeed");
    const initialState = JSON.parse(initialCall.content[0].text);
    assert.ok(initialState.state_id, "State must have valid state_id");
    assert.ok(initialState.tree.length > 0, "AX tree must contain elements");

    // 4. Type unique test token into TextEdit
    const typeCall = await server.handleCallTool("type_text", {
      text: testToken,
    });
    assert.equal(typeCall.isError, undefined, "type_text must succeed");

    // Give System Events a moment to flush keystrokes
    await new Promise((r) => setTimeout(r, 400));

    // 5. Re-observe TextEdit state and verify OS state actually changed
    const { stdout: textEditContent } = await execFile("osascript", [
      "-e",
      'tell application "TextEdit" to return text of document 1',
    ]);

    assert.ok(
      textEditContent.includes(testToken),
      `OS state must actually change! Expected '${testToken}' in TextEdit content, got: '${textEditContent.trim()}'`
    );

    // 6. Test real clipboard read & write through MCP server
    const clipWrite = await server.handleCallTool("write_clipboard", { text: `CLIP_${testToken}` });
    assert.equal(clipWrite.isError, undefined);
    const clipRead = await server.handleCallTool("read_clipboard", {});
    assert.equal(clipRead.isError, undefined);
    const readData = JSON.parse(clipRead.content[0].text);
    assert.equal(readData.text, `CLIP_${testToken}`, "Clipboard content must match written text");

  } finally {
    // Clean up: Close TextEdit document without saving and quit
    try {
      await execFile("osascript", [
        "-e",
        'tell application "TextEdit" to close every document saving no\ntell application "TextEdit" to quit saving no',
      ]);
    } catch (_) {}
  }
});
