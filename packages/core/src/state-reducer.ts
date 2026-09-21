import type {
  AppState,
  CompactAppState,
  CompactUIElement,
  DiffAppState,
  UIElement,
} from "./types.js";

/**
 * Converts a UIElement into a token-lean CompactUIElement.
 */
export function toCompactElement(elem: UIElement): CompactUIElement {
  const compact: CompactUIElement = {
    i: elem.index,
    h: elem.handle,
    r: elem.role,
    n: elem.name,
    c: elem.capabilities || [],
  };
  if (elem.value !== undefined && elem.value !== "") {
    compact.v = elem.value;
  }
  return compact;
}

/**
 * Flattens an element tree into a linear list of actionable compact elements.
 * Filters out purely decorative / non-interactive containers to maximize token efficiency.
 */
export function flattenAndFilterTree(
  elements: UIElement[],
  filterNonInteractive = true
): CompactUIElement[] {
  const result: CompactUIElement[] = [];

  function walk(node: UIElement) {
    const isInteractive =
      node.capabilities.length > 0 ||
      node.actions.length > 0 ||
      ["button", "textfield", "link", "checkbox", "radiobutton", "menuitem", "tab", "cell"].includes(
        node.role.toLowerCase()
      );

    if (!filterNonInteractive || isInteractive || node.name.trim().length > 0) {
      result.push(toCompactElement(node));
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  for (const root of elements) {
    walk(root);
  }

  return result;
}

/**
 * Transforms a full AppState into a CompactAppState.
 */
export function reduceToCompactState(state: AppState): CompactAppState {
  const compactElements = flattenAndFilterTree(state.tree, true);

  return {
    state_id: state.state_id,
    app: {
      pid: state.app.pid,
      name: state.app.name,
      bundle_id: state.app.bundle_id,
    },
    active_window: state.active_window
      ? {
          id: state.active_window.id,
          title: state.active_window.title,
          bounds: state.active_window.bounds,
        }
      : undefined,
    elements: compactElements,
    element_count: compactElements.length,
    timestamp: state.timestamp,
    screenshot_base64: state.screenshot_base64,
  };
}

/**
 * Computes a diff between two states (prior vs current).
 * Avoids resending the full tree when only minor controls changed.
 */
export function computeStateDiff(baseState: AppState, currentState: AppState): DiffAppState {
  const baseMap = new Map<string, CompactUIElement>();
  for (const elem of flattenAndFilterTree(baseState.tree, false)) {
    baseMap.set(elem.h, elem);
  }

  const currentElements = flattenAndFilterTree(currentState.tree, false);
  const currentMap = new Map<string, CompactUIElement>();
  const added: CompactUIElement[] = [];
  const modified: CompactUIElement[] = [];

  for (const cur of currentElements) {
    currentMap.set(cur.h, cur);
    const prev = baseMap.get(cur.h);
    if (!prev) {
      added.push(cur);
    } else {
      if (prev.n !== cur.n || prev.v !== cur.v || prev.c.join(",") !== cur.c.join(",")) {
        modified.push(cur);
      }
    }
  }

  const removedHandles: string[] = [];
  for (const [handle] of baseMap) {
    if (!currentMap.has(handle)) {
      removedHandles.push(handle);
    }
  }

  return {
    state_id: currentState.state_id,
    base_state_id: baseState.state_id,
    app: currentState.app,
    added_elements: added,
    removed_handles: removedHandles,
    modified_elements: modified,
    timestamp: currentState.timestamp,
  };
}
