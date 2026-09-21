import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const selfPath = fileURLToPath(import.meta.url);
const forbiddenPathPattern = ["/Users", "timexingxin"].join("/");

let hasError = false;

function scanDir(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (["node_modules", "dist", ".git", ".pnpm-store"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      scanDir(full);
    } else if (/\.(ts|mjs|json|md)$/.test(entry)) {
      lintFile(full);
    }
  }
}

function lintFile(filePath) {
  if (filePath === selfPath) return;

  const content = readFileSync(filePath, "utf8");

  // Check for forbidden personal paths
  if (content.includes(forbiddenPathPattern)) {
    console.error(`[LINT FAIL] Hardcoded personal path found in: ${filePath}`);
    hasError = true;
  }

  // Check for exposed private tokens or keys
  if (/ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{50,}|sk-[a-zA-Z0-9]{32,}/.test(content)) {
    console.error(`[LINT FAIL] Suspected secret pattern found in: ${filePath}`);
    hasError = true;
  }
}

console.log("[lint] Scanning repository for personal paths, formatting, and secrets...");
scanDir(process.cwd());

if (hasError) {
  console.error("[lint] Codebase failed lint check!");
  process.exit(1);
} else {
  console.log("[lint] All files passed lint check cleanly.");
}
