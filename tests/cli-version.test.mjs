import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCb } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCb);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const cliPkg = JSON.parse(readFileSync(new URL("../packages/cli/package.json", import.meta.url), "utf-8"));
const expectedVersion = cliPkg.version;

test("CLI --version outputs dynamic package version and not hardcoded v0.1.0", async () => {
  const { stdout } = await execFile(process.execPath, ["packages/cli/bin/cua.mjs", "--version"], { cwd: repoRoot });
  assert.equal(stdout.trim(), `zcode-desktop-control v${expectedVersion}`);
  assert.ok(!stdout.includes("v0.1.0"), "Must not contain obsolete hardcoded v0.1.0");
});

test("CLI -v outputs dynamic package version", async () => {
  const { stdout } = await execFile(process.execPath, ["packages/cli/bin/cua.mjs", "-v"], { cwd: repoRoot });
  assert.equal(stdout.trim(), `zcode-desktop-control v${expectedVersion}`);
});

test("CLI version command outputs dynamic package version", async () => {
  const { stdout } = await execFile(process.execPath, ["packages/cli/bin/cua.mjs", "version"], { cwd: repoRoot });
  assert.equal(stdout.trim(), `zcode-desktop-control v${expectedVersion}`);
});

test("CLI --help includes dynamic version header", async () => {
  const { stdout } = await execFile(process.execPath, ["packages/cli/bin/cua.mjs", "--help"], { cwd: repoRoot });
  assert.ok(stdout.includes(`v${expectedVersion}`), `Help output must contain v${expectedVersion}`);
  assert.ok(!stdout.includes("v0.1.0"), "Help output must not contain obsolete v0.1.0");
});

test("pnpm cua --version executes successfully via root script", async () => {
  const pnpmEntry = process.env.npm_execpath;
  let stdout;
  if (pnpmEntry) {
    if (pnpmEntry.endsWith(".js") || pnpmEntry.endsWith(".cjs") || pnpmEntry.endsWith(".mjs")) {
      const res = await execFile(process.execPath, [pnpmEntry, "cua", "--version"], { cwd: repoRoot });
      stdout = res.stdout;
    } else {
      const res = await execFile(pnpmEntry, ["cua", "--version"], { cwd: repoRoot });
      stdout = res.stdout;
    }
  } else {
    const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const res = await execFile(pnpmCmd, ["cua", "--version"], { cwd: repoRoot });
    stdout = res.stdout;
  }
  assert.ok(stdout.includes(`zcode-desktop-control v${expectedVersion}`));
});
