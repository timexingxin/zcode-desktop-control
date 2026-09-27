import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCb } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import { MacOSAdapter } from "../packages/platform-macos/dist/index.js";
import { MCPServer } from "../packages/mcp-server/dist/index.js";
import { runDoctor } from "../packages/cli/dist/index.js";

const execFile = promisify(execFileCb);

test("macOS Real GUI E2E: TextEdit observe -> act -> save -> file changed", { timeout: 120000 }, async (t) => {
  const isRealGuiRequested = process.argv.includes("--real-gui") || process.env.RUN_REAL_GUI_E2E === "1";
  const doctor = await runDoctor();
  if (isRealGuiRequested && !doctor.real_gui_ready) {
    assert.fail(`Strict Preflight Failed: real GUI prerequisites not satisfied: ${doctor.missing_real_gui_prereqs.join(", ")}`);
  } else if (!doctor.real_gui_ready) {
    t.skip(`SKIPPED: Real GUI prerequisites not satisfied: ${doctor.missing_real_gui_prereqs.join(", ")}`);
    return;
  }

  const adapter = new MacOSAdapter();
  const server = new MCPServer(adapter);
  const testToken = `ZCODE_VERIFY_${Date.now()}`;
  const initialText = `ZCODE_INITIAL_${Date.now()}`;
  const testDir = await mkdtemp(join(tmpdir(), "zcode-textedit-e2e-"));
  const testFile = join(testDir, `${testToken}.txt`);
  const testName = basename(testFile);
  let saved = false;
  let closed = false;

  try {
    // LaunchServices opens a dedicated temporary file without Apple Events
    // control of TextEdit or touching any pre-existing unsaved document.
    await writeFile(testFile, initialText, "utf8");
    await execFile("open", ["-a", "TextEdit", testFile], { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 600));

    const initialCall = await server.handleCallTool("get_app_state", {
      app_ref: { name: "TextEdit" }, detail: "full",
    });
    assert.equal(initialCall.isError, undefined, "get_app_state must succeed");
    const initialState = JSON.parse(initialCall.content[0].text);
    assert.equal(initialState.app.active, true, "TextEdit must be frontmost before typing");
    assert.equal(initialState.tree[0]?.name, testName, "The temporary file must be the frontmost TextEdit window");
    assert.ok(JSON.stringify(initialState.tree).includes(initialText), "AX tree must show the temporary file content");

    const typeCall = await server.handleCallTool("type_text", { text: testToken });
    assert.equal(typeCall.isError, undefined, "type_text must succeed");

    const changedCall = await server.handleCallTool("get_app_state", {
      app_ref: { name: "TextEdit" }, detail: "full",
    });
    assert.equal(changedCall.isError, undefined, "re-observation must succeed");
    const changedState = JSON.parse(changedCall.content[0].text);
    assert.equal(changedState.tree[0]?.name, testName, "The same temporary window must remain frontmost");
    assert.ok(JSON.stringify(changedState.tree).includes(testToken), "TextEdit AX value must contain the typed token");

    const saveCall = await server.handleCallTool("press_key", { key: "s", modifiers: ["command"] });
    assert.equal(saveCall.isError, undefined, "Command-S must be dispatched");
    let fileContent = "";
    for (let attempt = 0; attempt < 15; attempt++) {
      fileContent = await readFile(testFile, "utf8");
      if (fileContent.includes(testToken)) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(fileContent.includes(testToken), "The saved temporary file must contain the typed token");
    saved = true;

    // Retain the existing clipboard roundtrip. It changes the global clipboard;
    // the capability matrix requires a disposable interactive session.
    const clipWrite = await server.handleCallTool("write_clipboard", { text: `CLIP_${testToken}` });
    assert.equal(clipWrite.isError, undefined);
    const clipRead = await server.handleCallTool("read_clipboard", {});
    assert.equal(clipRead.isError, undefined);
    const readData = JSON.parse(clipRead.content[0].text);
    assert.equal(readData.text, `CLIP_${testToken}`, "Clipboard must match written text");
  } finally {
    // Close only the saved test file. If focus or save state is uncertain,
    // preserve the temporary file and document for inspection.
    if (saved) {
      try {
        await execFile("open", ["-a", "TextEdit", testFile], { timeout: 10000 });
        const state = await adapter.getAppState({ name: "TextEdit" }, { detail: "full" });
        if (state.app.active && state.tree[0]?.name === testName) {
          await adapter.pressKey("w", ["command"]);
          const remaining = await adapter.getAppState({ name: "TextEdit" }, { detail: "full" });
          closed = !remaining.tree.some((window) => window.name === testName);
        }
      } catch (_) { /* Keep the file if safe cleanup cannot be established. */ }
    }
    if (closed) await rm(testDir, { recursive: true, force: true });
    else process.stderr.write(`TextEdit E2E retained its temporary file for safe inspection: ${testFile}\n`);
  }
});
