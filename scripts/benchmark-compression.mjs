#!/usr/bin/env node
import {
  assignHandlesToTree,
  reduceToCompactState,
  computeStateDiff,
} from "../packages/core/dist/index.js";
import { MacOSAdapter } from "../packages/platform-macos/dist/index.js";

function generateSyntheticTree(numNodes, depth = 3) {
  let idCounter = 0;
  const roles = ["window", "group", "button", "textfield", "checkbox", "scrollarea", "tab", "cell"];

  function makeBranch(currentDepth, targetCount) {
    const nodes = [];
    const childrenPerNode = Math.max(1, Math.min(5, Math.ceil(targetCount / 4)));

    while (nodes.length < targetCount && idCounter < numNodes) {
      const idx = idCounter++;
      const role = currentDepth === 0 ? "window" : roles[idx % roles.length];
      const hasChildren = currentDepth < depth && idCounter < numNodes;
      const childCount = hasChildren ? Math.min(childrenPerNode, numNodes - idCounter) : 0;

      nodes.push({
        index: idx,
        handle: "",
        role: role,
        name: `${role}_label_${idx}`,
        value: role === "textfield" ? `value_${idx}` : undefined,
        bounds: { x: (idx % 10) * 80, y: Math.floor(idx / 10) * 30, width: 75, height: 25 },
        capabilities: role === "button" ? ["pressable"] : role === "textfield" ? ["editable"] : [],
        actions: role === "button" ? ["AXPress"] : [],
        children: childCount > 0 ? makeBranch(currentDepth + 1, childCount) : undefined,
      });
    }
    return nodes;
  }

  return makeBranch(0, numNodes);
}

async function runBenchmarks() {
  console.log("=========================================================");
  console.log(" AppState Compression & Diff Benchmark (Truthful Evidence) ");
  console.log("=========================================================");

  const fixtures = [
    { name: "Small Synthetic Tree (25 nodes)", tree: generateSyntheticTree(25, 2) },
    { name: "Medium Synthetic Tree (100 nodes)", tree: generateSyntheticTree(100, 3) },
    { name: "Large Synthetic Tree (500 nodes)", tree: generateSyntheticTree(500, 4) },
  ];

  // Try to grab live TextEdit AX tree if on macOS
  if (process.platform === "darwin") {
    try {
      const adapter = new MacOSAdapter();
      const perms = await adapter.checkPermissions();
      if (perms.accessibility) {
        const apps = await adapter.listApps();
        const app = apps.find((a) => a.name === "Finder" || a.windows_count > 0);
        if (app) {
          const liveState = await adapter.getAppState({ pid: app.pid });
          if (liveState.tree.length > 0) {
            fixtures.push({ name: `Live macOS AX Tree (${app.name})`, tree: liveState.tree });
          }
        }
      }
    } catch (_) {}
  }

  const results = [];

  for (const fix of fixtures) {
    const windowId = 1000;
    const tree = assignHandlesToTree(windowId, fix.tree);
    const fullState = {
      state_id: "s_bench_1",
      app: { pid: 9999, name: "BenchApp", active: true },
      tree,
      element_count: tree.length,
      timestamp: Date.now(),
    };

    const compactState = reduceToCompactState(fullState);

    // Make a slightly mutated state for diff test (mutate 2 values, add 1 node)
    const mutatedTree = JSON.parse(JSON.stringify(tree));
    if (mutatedTree[0]) {
      mutatedTree[0].name = "Updated Window Name";
    }
    const state2 = { ...fullState, state_id: "s_bench_2", tree: mutatedTree };
    const diffState = computeStateDiff(fullState, state2);

    const fullJson = JSON.stringify(fullState);
    const compactJson = JSON.stringify(compactState);
    const diffJson = JSON.stringify(diffState);

    const compactReduction = ((fullJson.length - compactJson.length) / fullJson.length) * 100;
    const diffReduction = ((fullJson.length - diffJson.length) / fullJson.length) * 100;

    results.push({
      name: fix.name,
      fullChars: fullJson.length,
      compactChars: compactJson.length,
      diffChars: diffJson.length,
      compactReductionPct: Number(compactReduction.toFixed(2)),
      diffReductionPct: Number(diffReduction.toFixed(2)),
    });
  }

  console.log(JSON.stringify(results, null, 2));

  const compactPcts = results.map((r) => r.compactReductionPct).sort((a, b) => a - b);
  const diffPcts = results.map((r) => r.diffReductionPct).sort((a, b) => a - b);

  const median = (arr) => {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  console.log("\n--- Summary Benchmark Metrics ---");
  console.log(`Compact Mode Reduction:`);
  console.log(`  Median: ${median(compactPcts)}%`);
  console.log(`  Range:  ${compactPcts[0]}% ~ ${compactPcts[compactPcts.length - 1]}%`);
  console.log(`Diff Mode Reduction:`);
  console.log(`  Median: ${median(diffPcts)}%`);
  console.log(`  Range:  ${diffPcts[0]}% ~ ${diffPcts[diffPcts.length - 1]}%`);
}

runBenchmarks().catch(console.error);
