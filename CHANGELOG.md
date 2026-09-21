# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0-alpha.1] - 2026-09-21

### Engineering Remediation & Truthful Runtime Release

Transitioned project from an architecture prototype to a truthful, testable, real-world Computer Use runtime adhering to the **Zero Fake-Success Policy**.

### Fixed & Implemented
- **GitHub Actions CI Pipeline**: Fixed root cause of Node 20.x CI failure caused by `pnpm@11` `node:sqlite` dependency; pinned compatible pnpm and disabled `fail-fast` for transparent matrix visibility.
- **Zero Fake-Success Policy**: Eliminated all unexecuted stubs across all adapters and MCP tools. Windows and Linux skeletons now strictly throw `UnsupportedPlatformError` rather than returning synthetic success receipts.
- **Real macOS Implementation**:
  - `movePointer`: Dispatches native CoreGraphics `kCGEventMouseMoved` events.
  - `click`: Dispatches real CoreGraphics mouse events supporting `left`, `right`, and `middle` buttons, plus `clickCount` (1x, 2x, 3x).
  - `drag`: Dispatches real `kCGEventLeftMouseDragged` events.
  - `scroll`: Dispatches pixel-level `CGEventCreateScrollWheelEvent2` events.
  - `screenshot`: Parses actual PNG IHDR chunk headers (bytes 16..24) for exact dimensions rather than returning hardcoded 1080p values.
  - `get_screen_info`: Queries live display resolution and multi-monitor counts via `CGMainDisplayID` and `NSScreen`.
  - `listWindows`: Retrieves authentic `CGWindowID` numbers via `CGWindowListCopyWindowInfo`.
  - `read_clipboard` / `write_clipboard`: Native `pbpaste` and `pbcopy` stdin stream pipes.
- **Stable Handle V2 & Hierarchy Preservation**:
  - Full state preserves true recursive AX tree hierarchy (`UIElement` with nested `children`).
  - Separated `StrongHandle` (derived from persistent `AXIdentifier` / `AutomationId`) from `WeakHandle` (derived from role hierarchy and semantic fingerprints without volatile sibling indices).
  - Added collision and ambiguity detection (`AmbiguousElementError`).
- **MCP Protocol Modernization**:
  - Aligned with the 2026-07-28 Model Context Protocol specification.
  - Implemented automated protocol version negotiation (`2026-07-28` modern, `2024-11-05` legacy fallback).
  - Added `get_capabilities` tool to expose the `PlatformCapabilityRegistry`.
- **Self-Contained ZCode Plugin Packaging**:
  - Standardized on `${ZCODE_PLUGIN_ROOT}` and `.mcp.json`.
  - Automated bundling into `dist/zcode-desktop-control.zip` with verified standalone execution in clean `/tmp` directories.
- **Real GUI E2E Testing**:
  - Added `tests/gui-e2e-textedit.test.mjs`: validates real TextEdit launching, typing, OS state verification, and window teardown.
  - Added `tests/red-team-adversarial.test.mjs`: 7 adversarial test cases covering duplicate element collision, expired state rejection, and kill-switch enforcement.
- **Measured Token Compression Benchmarks**:
  - Published reproducible benchmark script `scripts/benchmark-compression.mjs`.
  - Documented median character reduction (Compact: 53.17%, Diff: 99.03%) with honest min/max ranges.
- **Governance & Privacy Disclosures**:
  - Updated `THIRD_PARTY_NOTICES.md` with Linux Foundation (LF Projects) governance notes.
  - Configured git noreply identity.

---

## [0.1.0] - 2026-09-21

### Initial Architecture Prototype (Pre-release)

Initial open-source community prototype of `zcode-desktop-control`. Replaced proprietary helper binaries with clean-room TypeScript monorepo architecture.
