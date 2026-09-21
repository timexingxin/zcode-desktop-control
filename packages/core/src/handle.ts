import { createHash } from "node:crypto";
import type { UIElement } from "./types.js";

/**
 * Generates a stable, content-addressable element handle.
 * Format: "h:<role>:<hash>"
 * Hash derives from: windowId + role + identifier/name + normalized hierarchy path.
 */
export function generateElementHandle(
  windowId: number,
  element: { role: string; name?: string; identifier?: string },
  path: string = ""
): string {
  const normRole = (element.role || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "");
  const idOrName = (element.identifier || element.name || "").trim();
  
  const rawKey = `${windowId}|${normRole}|${idOrName}|${path}`;
  const hash = createHash("sha256").update(rawKey, "utf8").digest("hex").slice(0, 10);
  
  return `h_${normRole}_${hash}`;
}

/**
 * Assigns indices and stable handles to an entire UI element tree.
 */
export function assignHandlesToTree(windowId: number, elements: UIElement[], parentPath = "0"): UIElement[] {
  let counter = 0;

  function traverse(node: UIElement, currentPath: string): UIElement {
    const idx = counter++;
    node.index = idx;
    node.handle = generateElementHandle(
      windowId,
      { role: node.role, name: node.name },
      currentPath
    );

    if (Array.isArray(node.children)) {
      node.children = node.children.map((child, cIdx) =>
        traverse(child, `${currentPath}.${cIdx}`)
      );
    }
    return node;
  }

  return elements.map((elem, i) => traverse(elem, `${parentPath}.${i}`));
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
