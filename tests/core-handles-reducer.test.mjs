import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assignHandlesToTree,
  computeStateDiff,
  findElementInTree,
  generateElementHandle,
  reduceToCompactState,
} from "../packages/core/dist/index.js";

test("Stable Element Handle Generation is deterministic", () => {
  const h1 = generateElementHandle(1001, { role: "button", name: "Submit" }, "0.1");
  const h2 = generateElementHandle(1001, { role: "button", name: "Submit" }, "0.1");
  const h3 = generateElementHandle(1001, { role: "button", name: "Cancel" }, "0.1");
  const h4 = generateElementHandle(1002, { role: "button", name: "Submit" }, "0.1");

  assert.equal(h1, h2, "Identical elements must produce identical handles");
  assert.notEqual(h1, h3, "Different names must produce different handles");
  assert.notEqual(h1, h4, "Different windows must produce different handles");
  assert.match(h1, /^h_button_[a-f0-9]{10}$/, "Handle must follow stable format");
});

test("Tree Handle Assignment and Lookup", () => {
  const mockTree = [
    {
      index: 0,
      handle: "",
      role: "window",
      name: "Main Window",
      capabilities: ["focused"],
      actions: [],
      children: [
        {
          index: 0,
          handle: "",
          role: "button",
          name: "Save",
          capabilities: ["pressable"],
          actions: ["AXPress"],
        },
        {
          index: 0,
          handle: "",
          role: "textfield",
          name: "Username",
          value: "alice",
          capabilities: ["editable"],
          actions: [],
        },
      ],
    },
  ];

  const assigned = assignHandlesToTree(5000, mockTree);
  assert.equal(assigned[0].index, 0);
  assert.equal(assigned[0].children[0].index, 1);
  assert.equal(assigned[0].children[1].index, 2);

  const foundByHandle = findElementInTree(assigned, { handle: assigned[0].children[0].handle });
  assert.ok(foundByHandle, "Should find element by handle");
  assert.equal(foundByHandle.name, "Save");

  const foundByName = findElementInTree(assigned, { name: "Username" });
  assert.ok(foundByName, "Should find element by name");
  assert.equal(foundByName.value, "alice");
});

test("Compact State Reduction prunes decorative containers", () => {
  const fullState = {
    state_id: "s_test_1",
    app: { pid: 1234, name: "TestApp", active: true },
    active_window: {
      id: 5000,
      pid: 1234,
      title: "Test Window",
      app_name: "TestApp",
      bounds: { x: 100, y: 100, width: 800, height: 600 },
      is_minimized: false,
      is_focused: true,
    },
    tree: [
      {
        index: 0,
        handle: "h_window_1",
        role: "window",
        name: "Test Window",
        capabilities: ["focused"],
        actions: [],
        children: [
          {
            index: 1,
            handle: "h_group_1",
            role: "group",
            name: "", // empty decorative group
            capabilities: [],
            actions: [],
            children: [
              {
                index: 2,
                handle: "h_button_1",
                role: "button",
                name: "OK",
                capabilities: ["pressable"],
                actions: ["AXPress"],
              },
            ],
          },
        ],
      },
    ],
    element_count: 3,
    timestamp: Date.now(),
  };

  const compact = reduceToCompactState(fullState);
  assert.ok(compact.elements.length > 0);
  const okBtn = compact.elements.find((e) => e.n === "OK");
  assert.ok(okBtn, "Actionable button must be retained");
  assert.equal(okBtn.r, "button");
  assert.deepEqual(okBtn.c, ["pressable"]);
});

test("State Diffing detects additions, modifications and removals", () => {
  const baseState = {
    state_id: "s_base",
    app: { pid: 1234, name: "TestApp", active: true },
    tree: [
      {
        index: 0,
        handle: "h_btn_1",
        role: "button",
        name: "Step 1",
        capabilities: ["pressable"],
        actions: [],
      },
      {
        index: 1,
        handle: "h_input_1",
        role: "textfield",
        name: "Notes",
        value: "initial",
        capabilities: ["editable"],
        actions: [],
      },
    ],
    element_count: 2,
    timestamp: 1000,
  };

  const currentState = {
    state_id: "s_curr",
    app: { pid: 1234, name: "TestApp", active: true },
    tree: [
      {
        index: 0,
        handle: "h_input_1",
        role: "textfield",
        name: "Notes",
        value: "updated", // modified
        capabilities: ["editable"],
        actions: [],
      },
      {
        index: 1,
        handle: "h_btn_2",
        role: "button",
        name: "Step 2", // added
        capabilities: ["pressable"],
        actions: [],
      },
      // h_btn_1 removed
    ],
    element_count: 2,
    timestamp: 2000,
  };

  const diff = computeStateDiff(baseState, currentState);
  assert.equal(diff.state_id, "s_curr");
  assert.equal(diff.base_state_id, "s_base");
  assert.equal(diff.added_elements.length, 1);
  assert.equal(diff.added_elements[0].n, "Step 2");
  assert.equal(diff.modified_elements.length, 1);
  assert.equal(diff.modified_elements[0].v, "updated");
  assert.ok(diff.removed_handles.includes("h_btn_1"));
});

test("Long AX tree scaling with 1,000 synthetic elements", () => {
  const largeChildren = [];
  for (let i = 0; i < 1000; i++) {
    largeChildren.push({
      index: 0,
      handle: "",
      role: i % 2 === 0 ? "button" : "textfield",
      name: `Item ${i}`,
      value: i % 2 === 1 ? `Val ${i}` : undefined,
      capabilities: i % 2 === 0 ? ["pressable"] : ["editable"],
      actions: ["AXPress"],
    });
  }

  const largeTree = [
    {
      index: 0,
      handle: "",
      role: "window",
      name: "Stress Test Window",
      capabilities: ["focused"],
      actions: [],
      children: largeChildren,
    },
  ];

  const start = Date.now();
  const assigned = assignHandlesToTree(9999, largeTree);
  const compact = reduceToCompactState({
    state_id: "s_large",
    app: { pid: 9999, name: "StressApp", active: true },
    tree: assigned,
    element_count: assigned.length,
    timestamp: Date.now(),
  });

  const durationMs = Date.now() - start;
  assert.ok(durationMs < 500, `Processing 1000 elements took ${durationMs}ms (must be < 500ms)`);
  assert.equal(compact.element_count, 1001);
});
