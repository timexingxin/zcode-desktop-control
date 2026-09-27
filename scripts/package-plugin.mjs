#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const pluginDir = join(rootDir, "plugin");

function runPnpm(args) {
  const entry = process.env.npm_execpath;
  if (entry && /\.(?:c|m)?js$/i.test(entry)) {
    execFileSync(process.execPath, [entry, ...args], { cwd: rootDir, stdio: "inherit" });
  } else {
    execFileSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, {
      cwd: rootDir, stdio: "inherit", shell: process.platform === "win32",
    });
  }
}

function createZip(source, destination) {
  if (process.platform === "win32") {
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      'Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory($env:ZCODE_ZIP_SOURCE, $env:ZCODE_ZIP_DEST)',
    ], { env: { ...process.env, ZCODE_ZIP_SOURCE: source, ZCODE_ZIP_DEST: destination } });
  } else {
    execFileSync("zip", ["-r", "-q", destination, "."], { cwd: source });
  }
}

function extractZip(source, destination) {
  if (process.platform === "win32") {
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      'Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory($env:ZCODE_ZIP_SOURCE, $env:ZCODE_ZIP_DEST)',
    ], { env: { ...process.env, ZCODE_ZIP_SOURCE: source, ZCODE_ZIP_DEST: destination } });
  } else {
    execFileSync("unzip", ["-q", source, "-d", destination]);
  }
}

console.log("=========================================");
console.log(" Packaging ZCode Plugin (Self-Contained) ");
console.log("=========================================");

// 1. Ensure packages are built
console.log("[1/5] Building monorepo packages...");
runPnpm(["run", "build"]);

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

createZip(pluginDir, zipPath);
console.log(`[PASS] Created: ${zipPath}`);

// 5. Clean test install in /tmp
console.log("[5/5] Performing clean test installation outside repo in /tmp...");
const testExtractDir = join(tmpdir(), `zcode-plugin-test-${Date.now()}`);
mkdirSync(testExtractDir, { recursive: true });

try {
  extractZip(zipPath, testExtractDir);
  const extractedServer = join(testExtractDir, "dist", "bin", "server.js");

  if (!existsSync(extractedServer)) {
    throw new Error("Extracted package is missing dist/bin/server.js");
  }

  // Launch isolated stdio MCP server from temp directory
  const child = spawn(process.execPath, [extractedServer], {
    cwd: testExtractDir,
    env: { ...process.env, ZCODE_PLUGIN_ROOT: testExtractDir },
    stdio: ["pipe", "pipe", "pipe"],
  });

  const responsePromise = new Promise((resolve, reject) => {
    let pending = "";
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for MCP initialize/tools/list response")), 10000);
    const fail = (error) => { clearTimeout(timeout); reject(error); };
    child.stdout.on("data", (data) => {
      pending += data.toString("utf8");
      const lines = pending.split("\n");
      pending = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line.trim());
          if (parsed.id === 1 && parsed.result?.protocolVersion) {
            console.log(`[PASS] Isolated MCP initialize: protocolVersion=${parsed.result.protocolVersion}`);
            child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
            child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) + "\n");
          } else if (parsed.id === 2) {
            if (!Array.isArray(parsed.result?.tools) || parsed.result.tools.length === 0) {
              fail(new Error("Isolated MCP tools/list returned no tools"));
            } else {
              clearTimeout(timeout);
              resolve(parsed.result.tools.length);
            }
          }
        } catch (_) {}
      }
    });
    child.on("error", fail);
    child.on("close", () => fail(new Error("Isolated MCP server exited before tools/list")));
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

  const toolsCount = await responsePromise;
  console.log(`[PASS] Isolated MCP tools/list: ${toolsCount} tools`);
  child.kill();
  console.log("[SUCCESS] Plugin package initializes and lists tools outside the repository.");
} finally {
  rmSync(testExtractDir, { recursive: true, force: true });
}
