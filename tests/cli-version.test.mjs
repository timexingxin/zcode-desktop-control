import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCb } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);
const cliPkg = JSON.parse(readFileSync(new URL("../packages/cli/package.json", import.meta.url), "utf-8"));
const expectedVersion = cliPkg.version;

test("CLI --version outputs dynamic package version and not hardcoded v0.1.0", async () => {
  const { stdout } = await execFile(process.execPath, ["packages/cli/bin/cua.mjs", "--version"]);
  assert.equal(stdout.trim(), `zcode-desktop-control v${expectedVersion}`);
  assert.ok(!stdout.includes("v0.1.0"), "Must not contain obsolete hardcoded v0.1.0");
});

test("CLI -v outputs dynamic package version", async () => {
  const { stdout } = await execFile(process.execPath, ["packages/cli/bin/cua.mjs", "-v"]);
  assert.equal(stdout.trim(), `zcode-desktop-control v${expectedVersion}`);
});

test("CLI version command outputs dynamic package version", async () => {
  const { stdout } = await execFile(process.execPath, ["packages/cli/bin/cua.mjs", "version"]);
  assert.equal(stdout.trim(), `zcode-desktop-control v${expectedVersion}`);
});

test("CLI --help includes dynamic version header", async () => {
  const { stdout } = await execFile(process.execPath, ["packages/cli/bin/cua.mjs", "--help"]);
  assert.ok(stdout.includes(`v${expectedVersion}`), `Help output must contain v${expectedVersion}`);
  assert.ok(!stdout.includes("v0.1.0"), "Help output must not contain obsolete v0.1.0");
});

test("pnpm cua --version executes successfully via root script", async () => {
  const { stdout } = await execFile("pnpm", ["cua", "--version"]);
  assert.ok(stdout.includes(`zcode-desktop-control v${expectedVersion}`));
});
