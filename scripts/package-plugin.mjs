#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const rootDir = resolve(new URL(".", import.meta.url).pathname, "..");
const pluginDir = join(rootDir, "plugin");

console.log("=========================================");
console.log(" Packaging ZCode Plugin (Self-Contained) ");
console.log("=========================================");

// 1. Ensure packages are built
console.log("[1/5] Building monorepo packages...");
execFileSync("pnpm", ["run", "build"], { cwd: rootDir, stdio: "inherit" });

// 2. Prepare plugin dist directory
console.log("[2/5] Assembling self-contained plugin runtime...");
const pluginDist = join(pluginDir, "dist");
const pluginModules = join(pluginDir, "node_modules", "@zcode-community");

rmSync(pluginDist, { recursive: true, force: true });
rmSync(join(pluginDir, "node_modules"), { recursive: true, force: true });

mkdirSync(pluginDist, { recursive: true });
mkdirSync(pluginModules, { recursive: true });

// Copy mcp-server dist into plugin/dist
cpSync(join(rootDir, "packages", "mcp-server", "dist"), pluginDist, { recursive: true });

// Copy subpackages into plugin/node_modules/@zcode-community
for (const pkg of ["core", "platform-macos", "platform-windows", "platform-linux"]) {
  const targetDir = join(pluginModules, pkg);
  mkdirSync(targetDir, { recursive: true });
  cpSync(join(rootDir, "packages", pkg, "dist"), join(targetDir, "dist"), { recursive: true });
  cpSync(join(rootDir, "packages", pkg, "package.json"), join(targetDir, "package.json"));
}

console.log("[3/5] Verifying plugin package structure...");
if (!existsSync(join(pluginDist, "bin", "server.js"))) {
  throw new Error("Missing plugin/dist/bin/server.js");
}
if (!existsSync(join(pluginDir, ".mcp.json"))) {
  throw new Error("Missing plugin/.mcp.json");
}
if (!existsSync(join(pluginDir, ".zcode-plugin", "plugin.json"))) {
  throw new Error("Missing plugin/.zcode-plugin/plugin.json");
}

// 4. Create zip archive
console.log("[4/5] Creating plugin zip distribution package...");
const distDir = join(rootDir, "dist");
mkdirSync(distDir, { recursive: true });
const zipPath = join(distDir, "zcode-desktop-control.zip");
rmSync(zipPath, { force: true });

execFileSync("zip", ["-r", "-q", zipPath, "."], { cwd: pluginDir });
console.log(`[PASS] Created: ${zipPath}`);

// 5. Clean test install in /tmp
console.log("[5/5] Performing clean test installation outside repo in /tmp...");
const testExtractDir = join(tmpdir(), `zcode-plugin-test-${Date.now()}`);
mkdirSync(testExtractDir, { recursive: true });

try {
  execFileSync("unzip", ["-q", zipPath, "-d", testExtractDir]);
  const extractedServer = join(testExtractDir, "dist", "bin", "server.js");

  if (!existsSync(extractedServer)) {
    throw new Error("Extracted package is missing dist/bin/server.js");
  }

  // Launch isolated stdio MCP server from temp directory
  const child = spawn("node", [extractedServer], {
    cwd: testExtractDir,
    env: { ...process.env, ZCODE_PLUGIN_ROOT: testExtractDir },
    stdio: ["pipe", "pipe", "pipe"],
  });

  const responsePromise = new Promise((resolve, reject) => {
    let raw = "";
    child.stdout.on("data", (data) => {
      raw += data.toString("utf8");
      const lines = raw.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line.trim());
          if (parsed.result && parsed.result.protocolVersion) {
            resolve(parsed);
          }
        } catch (_) {}
      }
    });
    child.on("error", reject);
    setTimeout(() => reject(new Error("Timeout waiting for MCP handshake response")), 5000);
  });

  const initReq = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2026-07-28",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    },
  }) + "\n";

  child.stdin.write(initReq);

  const initRes = await responsePromise;
  console.log(`[PASS] Isolated clean MCP handshake response: protocolVersion=${initRes.result.protocolVersion}`);
  child.kill();
  console.log("[SUCCESS] Plugin package is 100% self-contained and functions independently of repo!");
} finally {
  rmSync(testExtractDir, { recursive: true, force: true });
}
