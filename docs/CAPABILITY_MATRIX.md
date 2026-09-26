# Platform Capability & Tool Support Matrix
> **Version**: `0.2.0-alpha.1`  
> **Policy**: **Truthfulness > Tool Count**. No fake success or unexecuted stubs.

This matrix documents the actual runtime support level for each tool exposed by `@zcode-community/mcp-server`.

## Support Levels
- **VERIFIED**: Fully implemented with real OS interaction and verified via automated test or live GUI E2E.
- **IMPLEMENTED**: Fully implemented with real OS interaction; awaiting dedicated hardware regression suite.
- **PARTIAL**: Basic core semantics functional; edge cases (e.g. multi-display or deeply nested controls) under remediation.
- **EXPERIMENTAL / SKELETON**: Type definitions and API contracts present, but underlying OS driver is unverified. Throws `UnsupportedPlatformError` on invocation (Zero Fake-Success).
- **UNSUPPORTED**: Not applicable or intentionally rejected on this platform; throws `UnsupportedPlatformError`.

---

## Tool-by-Tool Matrix

| # | Tool Name | macOS (Darwin) | Windows (Win32) | Linux | Automated Test | Manual / E2E Verification | Last Verified |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| 1 | `get_capabilities` | **VERIFIED** | **VERIFIED** | **VERIFIED** | `tests/core-handles-reducer.test.mjs` | MCP handshake | `v0.2.0-alpha.1` |
| 2 | `list_apps` | **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `scripts/smoke-test.mjs` | `cua list-apps` CLI | `v0.2.0-alpha.1` |
| 3 | `list_windows` | **VERIFIED** (CGWindowID) | EXPERIMENTAL | EXPERIMENTAL | `tests/core-handles-reducer.test.mjs` | Native Quartz test | `v0.2.0-alpha.1` |
| 4 | `get_active_window` | **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `tests/core-handles-reducer.test.mjs` | System Events | `v0.2.0-alpha.1` |
| 5 | `get_app_state` | **VERIFIED** (Full & Compact) | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | TextEdit & Finder AX | `v0.2.0-alpha.1` |
| 6 | `screenshot` | **VERIFIED** (PNG IHDR) | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | `screencapture` | `v0.2.0-alpha.1` |
| 7 | `get_screen_info` | **VERIFIED** (CoreGraphics) | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | Native display check | `v0.2.0-alpha.1` |
| 8 | `click` / `left_click` | **VERIFIED** (CoreGraphics) | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | Native mouse dispatch | `v0.2.0-alpha.1` |
| 9 | `double_click` | **VERIFIED** (ClickState=2) | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | CoreGraphics | `v0.2.0-alpha.1` |
| 10 | `triple_click` | **VERIFIED** (ClickState=3) | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | CoreGraphics | `v0.2.0-alpha.1` |
| 11 | `right_click` | **VERIFIED** (kCGEventRight) | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | CoreGraphics | `v0.2.0-alpha.1` |
| 12 | `middle_click` | **VERIFIED** (kCGEventOther) | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | CoreGraphics | `v0.2.0-alpha.1` |
| 13 | `move_pointer` / `mouse_move` | **VERIFIED** (kCGEventMouseMoved) | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | CoreGraphics | `v0.2.0-alpha.1` |
| 14 | `scroll` | **VERIFIED** (Pixel scroll) | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | CoreGraphics | `v0.2.0-alpha.1` |
| 15 | `left_click_drag` | **VERIFIED** (Dragged event) | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | CoreGraphics | `v0.2.0-alpha.1` |
| 16 | `mouse_down` / `left_mouse_down`| **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | CoreGraphics | `v0.2.0-alpha.1` |
| 17 | `mouse_up` / `left_mouse_up` | **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | CoreGraphics | `v0.2.0-alpha.1` |
| 18 | `type_text` / `type` | **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | TextEdit verified | `v0.2.0-alpha.1` |
| 19 | `press_key` / `key` | **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | Key code mapping | `v0.2.0-alpha.1` |
| 20 | `hotkey` | **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | Key combinations | `v0.2.0-alpha.1` |
| 21 | `hold_key` | **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `tests/mcp-protocol.test.mjs` | System Events | `v0.2.0-alpha.1` |
| 22 | `set_value` | **VERIFIED** (Live Resolver) | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | AXValue / TextEdit | `v0.2.0-alpha.1` |
| 23 | `select_text` | UNSUPPORTED | UNSUPPORTED | UNSUPPORTED | `tests/mcp-protocol.test.mjs` | Throws structured error | `v0.2.0-alpha.1` |
| 24 | `launch_app` / `open_application`| **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | `open -a` | `v0.2.0-alpha.1` |
| 25 | `focus_app` | **VERIFIED** | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | `activate` | `v0.2.0-alpha.1` |
| 26 | `focus_window` | **IMPLEMENTED** | EXPERIMENTAL | EXPERIMENTAL | Unit test | Quartz | `v0.2.0-alpha.1` |
| 27 | `move_window` | **IMPLEMENTED** | EXPERIMENTAL | EXPERIMENTAL | Unit test | System Events | `v0.2.0-alpha.1` |
| 28 | `resize_window` | **IMPLEMENTED** | EXPERIMENTAL | EXPERIMENTAL | Unit test | System Events | `v0.2.0-alpha.1` |
| 29 | `minimize_window` | **IMPLEMENTED** | EXPERIMENTAL | EXPERIMENTAL | Unit test | System Events | `v0.2.0-alpha.1` |
| 30 | `maximize_window` | **IMPLEMENTED** | EXPERIMENTAL | EXPERIMENTAL | Unit test | AXZoomButton | `v0.2.0-alpha.1` |
| 31 | `find_element` | **VERIFIED** (Compact tree) | **VERIFIED** | **VERIFIED** | `tests/core-handles-reducer.test.mjs` | In-memory search | `v0.2.0-alpha.1` |
| 32 | `click_element` | **VERIFIED** (Ambiguity safe) | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | Live Resolver | `v0.2.0-alpha.1` |
| 33 | `set_element_value` | **VERIFIED** (Ambiguity safe) | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | Live Resolver | `v0.2.0-alpha.1` |
| 34 | `perform_action` | **VERIFIED** (AXAction) | EXPERIMENTAL | EXPERIMENTAL | `tests/errors-and-batch.test.mjs` | AXPress | `v0.2.0-alpha.1` |
| 35 | `request_access` | **VERIFIED** | UNSUPPORTED | UNSUPPORTED | `tests/cli-doctor.test.mjs` | System Settings URL | `v0.2.0-alpha.1` |
| 36 | `stop_computer_control` | **VERIFIED** (Kill-switch) | **VERIFIED** | **VERIFIED** | `tests/mcp-protocol.test.mjs` | Session Halted | `v0.2.0-alpha.1` |
| 37 | `wait` | **VERIFIED** | **VERIFIED** | **VERIFIED** | `tests/mcp-protocol.test.mjs` | `setTimeout` | `v0.2.0-alpha.1` |
| 38 | `read_clipboard` | **VERIFIED** (pbpaste) | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | pbpaste | `v0.2.0-alpha.1` |
| 39 | `write_clipboard` | **VERIFIED** (pbcopy) | EXPERIMENTAL | EXPERIMENTAL | `tests/gui-e2e-textedit.test.mjs` | pbcopy stdin pipe | `v0.2.0-alpha.1` |
| 40 | `doctor` (CLI) | **VERIFIED** | PARTIAL | PARTIAL | `tests/cli-doctor.test.mjs` | `cua doctor` CLI | `v0.2.0-alpha.1` |
| 41 | `smoke-test` | **VERIFIED** | PARTIAL | PARTIAL | `scripts/smoke-test.mjs` | Stdio pipeline | `v0.2.0-alpha.1` |

## Test Validation Matrix

| Test Suite | Execution Environment | Verification Scope | Target Platforms | Command |
| :--- | :--- | :--- | :--- | :--- |
| **Unit, Protocol & Adversarial** (19 tests) | Headless CI & Local Terminal | Handle generation, tree pruning, diff engine, error taxonomy, MCP protocol negotiation, Red Team kill-switch/ambiguity guards | Ubuntu (x64), macOS (arm64/x64) | `pnpm test` / `pnpm test:unit` |
| **CLI Environment Doctor** | Interactive or CLI Session | Node.js version, OS support, Accessibility permissions, WindowServer status, CoreGraphics, TextEdit readiness | macOS (arm64/x64) | `pnpm doctor` |
| **Real GUI E2E Test** (`gui-e2e-textedit`) | Interactive Aqua GUI Session | End-to-end launch of TextEdit, AX focus, live handle resolution, CoreGraphics keyboard input, clipboard synchronization | macOS Apple Silicon (arm64 physical hardware) | `pnpm test:e2e:real` |

---

## Hardware Verification Notes

- **macOS (Apple Silicon arm64)**: **VERIFIED**. Complete suite tested on physical Apple Silicon hardware with native Aqua GUI session and Accessibility permissions.
- **macOS (Intel x64)**: **IMPLEMENTED / CI-BUILDABLE**. Architecture is platform-agnostic for Darwin and builds/passes unit tests on Intel runners; physical execution on x64 Mac hardware has not been physically validated.
- **Windows & Linux**: **EXPERIMENTAL / SKELETON**. Throws `UnsupportedPlatformError` on unverified execution to guarantee zero fake-success.

---

## Truthfulness Guarantees
1. Any tool invoked on Windows or Linux that is labeled `EXPERIMENTAL` **throws `UnsupportedPlatformError`** rather than returning fake success receipts.
2. The `get_capabilities` tool allows any agent to inspect feature availability before executing instructions.
3. Automated regression tests on macOS verify that the operating system state actually mutated (e.g. text appeared in TextEdit, clipboard contents altered), rather than merely testing `ok: true`.
4. Headless CI runs strictly bypass interactive GUI tests (`SKIPPED: NO_ACTIVE_GUI_SESSION` or segregated via `scripts/run-tests.mjs`) to avoid false-green passes or focus-stealing hangs.
