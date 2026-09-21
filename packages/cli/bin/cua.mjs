#!/usr/bin/env node
import { main } from "../dist/cli.js";

main().catch((err) => {
  console.error(`[cua] Error: ${err.message || err}`);
  process.exit(1);
});
