import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { MacOSAdapter } from "../packages/platform-macos/dist/index.js";
import { MCPServer } from "../packages/mcp-server/dist/index.js";
import { runDoctor } from "../packages/cli/dist/index.js";

const execFile = promisify(execFileCb);

test("macOS Real GUI E2E: TextEdit observe -> act -> re-observe -> state changed verification", async (t) => {
  const isRealGuiRequested = process.argv.includes("--real-gui") || process.env.RUN_REAL_GUI_E2E === "1";

  const doctor = await runDoctor();
  if (isRealGuiRequested && !doctor.real_gui_ready) {
    assert.fail(`Strict Preflight Failed: real GUI automation prerequisites not satisfied: ${doctor.missing_real_gui_prereqs.join(", ")}`);
  } else if (!doctor.real_gui_ready) {
    t.skip(`SKIPPED: Real GUI automation prerequisites not satisfied: ${doctor.missing_real_gui_prereqs.join(", ")}`);
    return;
  }

  const adapter = new MacOSAdapter();
  const server = new MCPServer(adapter);

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

    // Ensure TextEdit has frontmost window focus before typing
    await adapter.focusApp({ name: "TextEdit" });
    await new Promise((r) => setTimeout(r, 200));

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
