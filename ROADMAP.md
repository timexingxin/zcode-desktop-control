# Project Roadmap

The milestone plan for `zcode-desktop-control`:

---

## Phase 1: Foundation (v0.1.0 - Current)
- [x] Clean-room modular architecture (`core`, `platform-*`, `mcp-server`, `cli`).
- [x] Full MCP stdio server with 30+ tools.
- [x] macOS Accessibility-first adapter.
- [x] Stable element handles and token compression (`compact`/`diff`).
- [x] `cua doctor` CLI diagnostic suite.
- [x] Complete documentation & provenance tracking.

---

## Phase 2: Cross-Platform Expansion (v0.2.0)
- [ ] Windows native UI Automation adapter with live Windows hardware verification.
- [ ] Linux AT-SPI2 / Wayland portal integration.
- [ ] Automated CI test matrix across macOS, Windows, and Ubuntu runners.

---

## Phase 3: Visual & Accessibility Enhancements (v0.3.0)
- [ ] Optional non-intrusive Agent cursor overlay (`cua-overlay`).
- [ ] High-DPI multi-monitor coordinate normalizer.
- [ ] Automatic modal dialog interceptor and state reconciler.
