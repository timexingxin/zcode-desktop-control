---
name: computer-use
description: Local-first desktop application automation through accessibility-first semantic actions with visual coordinate fallback.
---

# Computer Use (Desktop Automation Skill)

Drive native desktop applications safely via Accessibility (AX) semantic trees and coordinate fallback.

## 1. Routing Boundaries (Strict)

- **USE Computer Use for**:
  - Native desktop apps (Notes, Calculator, Calendar, Mail, TextEdit, Preview, etc.)
  - System Settings / Control Panel / Finder / File pickers (`⌘⇧G`)
  - Desktop UI menus, dialogs, and native windows
- **DO NOT USE Computer Use for**:
  - Logged-in Web applications (Canvas, GitHub, portals) -> Route to structured browser tools (shared CDP / `web-access`).
  - Web DOM extraction / scraping -> Route to `playwright-background` or web tools.

## 2. Core Execution Loop: Observe → Act → Verify

1. **Observe Once**:
   - Call `get_app_state(app_ref, detail="compact")`.
   - `detail="compact"` (default) returns only actionable elements with indices and stable handles (`h_*`).
   - Do NOT pass `include_screenshot=true` unless purely visual reading is necessary.
   - **Anti-Thrashing Rule**: Never call `get_app_state` multiple times consecutively without an intervening action.
2. **Act Once**:
   - **Semantic First**: Use element target `{"type": "element", "state_id": "<id>", "index": <idx>, "handle": "<handle>"}`.
   - Semantic actions (`click`, `set_value`, `perform_action`) do not steal physical mouse focus or displace the cursor.
   - **Visual Fallback**: Use `{"type": "coordinate", "x": <x>, "y": <y>}` only if accessibility elements are unexposed.
3. **Verify Outcome**:
   - Inspect the returned `action_receipt`. If the UI state changed as expected, continue.
   - If the server returns `stale_handle` or `element_not_found`, re-observe fresh state and retry once.

## 3. Keyboard & Text Editing

- Prefer `set_value(target, value)` for editable fields (instantaneous, background-safe).
- Use `type_text(text)` only when typing directly into focused controls or terminal windows.
- Use `press_key(key, modifiers)` for navigation chords (e.g. `key="Return"`, `modifiers=["cmd"]`).

## 4. Safety & Destructive Operation Guardrails

- **Kill Switch**: If unexpected behavior occurs, immediately call `stop_computer_control`.
- **Destructive Actions**: Deleting user files (`rm`, trash), submitting forms with external side-effects, or altering system credentials require explicit confirmation before action dispatch.
- **Fail-Fast**: If `request_access` indicates permissions are denied, politely notify the user to grant Accessibility permissions in System Settings and stop.
