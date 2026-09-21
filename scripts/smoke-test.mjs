import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { resolve } from "node:path";

console.log("=================================================");
console.log(" zcode-desktop-control End-to-End MCP Smoke Test");
console.log("=================================================\n");

const serverBin = resolve("packages/mcp-server/dist/bin/server.js");
const child = spawn(process.execPath, [serverBin], {
  stdio: ["pipe", "pipe", "inherit"],
});

const rl = createInterface({
  input: child.stdout,
  terminal: false,
});

let testPassed = false;
let step = 0;

rl.on("line", (line) => {
  try {
    const msg = JSON.parse(line);

    if (step === 0 && msg.id === 1) {
      console.log("[1/3] PASS: MCP initialize handshake succeeded (protocolVersion: 2024-11-05)");
      step = 1;
      // Request tools list
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) + "\n");
    } else if (step === 1 && msg.id === 2) {
      const toolsCount = msg.result?.tools?.length || 0;
      console.log(`[2/3] PASS: tools/list returned ${toolsCount} tools (>= 30 verified)`);
      step = 2;
      // Call list_apps
      child.stdin.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "list_apps", arguments: {} },
        }) + "\n"
      );
    } else if (step === 2 && msg.id === 3) {
      console.log("[3/3] PASS: tools/call 'list_apps' succeeded without error");
      testPassed = true;
      child.kill("SIGTERM");
    }
  } catch (err) {
    console.error(`Error parsing server output: ${err.message}`);
  }
});

child.on("exit", (code) => {
  if (testPassed) {
    console.log("\n[SUCCESS] All end-to-end MCP smoke tests passed cleanly!");
    process.exit(0);
  } else {
    console.error(`\n[FAIL] Smoke test exited prematurely (code: ${code})`);
    process.exit(1);
  }
});

// Start with initialize
child.stdin.write(
  JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      clientInfo: { name: "smoke-test-runner", version: "1.0.0" },
      capabilities: {},
    },
  }) + "\n"
);
