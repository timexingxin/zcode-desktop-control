import { createHash } from "node:crypto";
import type { UIElement } from "./types.js";

/**
 * Generates a Strong Handle based on native persistent identifier (AXIdentifier / AutomationId).
 * Immune to DOM/AX tree mutations, sibling reordering, and layout reflows.
 */
export function generateStrongHandle(
  windowId: number | string,
  element: { role: string; identifier: string }
): string {
  const normRole = (element.role || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "");
  const rawKey = `strong|${windowId}|${normRole}|${element.identifier.trim()}`;
  const hash = createHash("sha256").update(rawKey, "utf8").digest("hex").slice(0, 10);
  return `h_str_${normRole}_${hash}`;
}

/**
 * Generates a Weak Handle based on semantic fingerprint:
 * role + subrole + semantic name + ancestor role chain (without volatile sibling indices).
 */
export function generateWeakHandle(
  windowId: number | string,
  element: { role: string; subrole?: string; name?: string },
  ancestorRoleChain = ""
): string {
  const normRole = (element.role || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normSubrole = (element.subrole || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normName = (element.name || "").trim().toLowerCase();
  
  const rawKey = `weak|${windowId}|${normRole}|${normSubrole}|${normName}|${ancestorRoleChain}`;
  const hash = createHash("sha256").update(rawKey, "utf8").digest("hex").slice(0, 10);
  return `h_wk_${normRole}_${hash}`;
}

/**
 * Unified handle generator: picks StrongHandle if native identifier is available,
 * otherwise falls back to WeakHandle with semantic ancestor chain.
 */
export function generateElementHandle(
  windowId: number | string,
  element: { role: string; subrole?: string; name?: string; identifier?: string },
  ancestorRoleChain = ""
): string {
  if (element.identifier && element.identifier.trim().length > 0) {
    return generateStrongHandle(windowId, { role: element.role, identifier: element.identifier });
  }
  return generateWeakHandle(windowId, element, ancestorRoleChain);
}

/**
 * Assigns indices and handles to an entire UI element tree.
 * Retains tree hierarchy, computes Strong/Weak handles, and detects ambiguity
 * when multiple elements share the identical handle.
 */
export function assignHandlesToTree(
  windowId: number,
  elements: UIElement[],
  parentRoleChain = ""
): UIElement[] {
  let counter = 0;
  const handleFrequencies = new Map<string, UIElement[]>();

  function traverse(node: UIElement, currentRoleChain: string): UIElement {
    node.index = counter++;
    node.handle = generateElementHandle(windowId, node, currentRoleChain);

    const list = handleFrequencies.get(node.handle) || [];
    list.push(node);
    handleFrequencies.set(node.handle, list);

    const nextRoleChain = currentRoleChain ? `${currentRoleChain}>${node.role}` : node.role;
    if (Array.isArray(node.children) && node.children.length > 0) {
      node.children = node.children.map((child) => traverse(child, nextRoleChain));
    }
    return node;
  }

  const processed = elements.map((elem) => traverse(elem, parentRoleChain));

  // Mark ambiguity for any collisions
  for (const matchedNodes of handleFrequencies.values()) {
    if (matchedNodes.length > 1) {
      for (const node of matchedNodes) {
        node.ambiguous = true;
        node.ambiguity_count = matchedNodes.length;
      }
    }
  }

  return processed;
}

/**
 * Finds an element by index or stable handle in a UI element tree.
 */
export function findElementInTree(
  elements: UIElement[],
  matcher: { index?: number; handle?: string; name?: string; role?: string }
): UIElement | null {
  for (const elem of elements) {
    if (matcher.index !== undefined && elem.index === matcher.index) {
      return elem;
    }
    if (matcher.handle && elem.handle === matcher.handle) {
      return elem;
    }
    if (
      matcher.name &&
      elem.name.toLowerCase() === matcher.name.toLowerCase() &&
      (!matcher.role || elem.role.toLowerCase() === matcher.role.toLowerCase())
    ) {
      return elem;
    }
    if (elem.children && elem.children.length > 0) {
      const found = findElementInTree(elem.children, matcher);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Resolves an element candidate with ambiguity detection.
 */
export function resolveElementWithAmbiguity(
  elements: UIElement[],
  matcher: { handle?: string; index?: number; name?: string; role?: string }
): { element?: UIElement; ambiguous?: boolean; count: number } {
  const matches: UIElement[] = [];

  function collect(nodes: UIElement[]) {
    for (const node of nodes) {
      let matched = false;
      if (matcher.handle && node.handle === matcher.handle) {
        matched = true;
      } else if (matcher.index !== undefined && node.index === matcher.index) {
        matched = true;
      } else if (
        matcher.name &&
        node.name.toLowerCase() === matcher.name.toLowerCase() &&
        (!matcher.role || node.role.toLowerCase() === matcher.role.toLowerCase())
      ) {
        matched = true;
      }

      if (matched) {
        matches.push(node);
      }

      if (node.children && node.children.length > 0) {
        collect(node.children);
      }
    }
  }

  collect(elements);

  if (matches.length === 0) {
    return { count: 0 };
  }
  if (matches.length === 1 && !matches[0].ambiguous) {
    return { element: matches[0], ambiguous: false, count: 1 };
  }
  return { element: matches[0], ambiguous: true, count: matches.length };
}
