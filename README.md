# zcode-desktop-control

[![CI](https://github.com/timexingxin/zcode-desktop-control/actions/workflows/ci.yml/badge.svg)](https://github.com/timexingxin/zcode-desktop-control/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-2026--07--28-green.svg)](https://github.com/modelcontextprotocol/modelcontextprotocol)
[![Platform](https://img.shields.io/badge/Platform-macOS%20(Verified)%20%7C%20Windows%20%26%20Linux%20(Experimental)-orange.svg)](docs/CAPABILITY_MATRIX.md)

An independent, local-first Computer Use runtime and ZCode plugin that exposes safe, truthful desktop automation through the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/modelcontextprotocol).

Built for AI coding assistants and automation agents including **ZCode**, **Antigravity**, **Claude Code**, **Cursor**, and custom agents.

> **Truthfulness > Tool Count Policy**: This project enforces a strict **Zero Fake-Success Policy**. If an OS-level operation cannot be performed on the current platform, it immediately throws `UnsupportedPlatformError` rather than returning synthetic `ok: true` receipts.

---

## 1. Quick Demo

```bash
# 1. Run diagnostic preflight
cua doctor

# 2. Inspect running desktop applications
cua list-apps

# 3. Start MCP server over stdio
cua mcp
```

For a 30–60 second step-by-step video script, see [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

---

## 2. Why zcode-desktop-control?

Existing desktop automation tools for AI agents suffer from critical architectural flaws:
- **Vision-Only Latency**: Relying on periodic full-screen screenshots inflates model token consumption and slows execution.
- **Fragile Volatile Indices**: Hardcoded element indices (`index: 12`) break on every dynamic repaint or sibling insertion.
- **Opaque Proprietary Bloat**: Many existing implementations rely on closed-source binary daemons and proprietary protocols.
- **Fake Success**: Declaring dozens of tools that return synthetic success without actually touching the host OS.

`zcode-desktop-control` delivers a **100% clean-room, local-first, accessibility-first** runtime engineered for reliability, safety, and strict truthfulness.

---

## 3. Key Features

- **Accessibility-First (macOS Verified)**: Operates directly on native Accessibility (AX) trees. Actions are fast, pixel-accurate, and background-safe without stealing user focus.
- **Stable Element Handles V2**: Separates `StrongHandle` (derived from persistent `AXIdentifier` / `AutomationId`) and `WeakHandle` (derived from role hierarchy and semantic fingerprints without fragile sibling indices), complete with collision/ambiguity detection.
- **Measured Context Compression**: Supports `detail="compact"` (pruning non-interactive noise) and `detail="diff"` (emitting only delta changes):
  - **Compact Mode**: Median **53.17%** character reduction (range: 51.37% ~ 80.11%).
  - **Diff Mode**: Median **99.03%** character reduction (range: 94.01% ~ 99.71%).
- **MCP Protocol Modernization**: Adheres to the latest specification (`2026-07-28`) with automated version negotiation while maintaining backward compatibility for legacy clients (`2024-11-05`).
- **Granular Error Taxonomy**: Structured error codes (`permission_denied`, `element_not_found`, `stale_handle`, `ambiguous_element`, `unsupported_platform`).
- **Self-Contained ZCode Plugin**: Packaged via standard `.zcode-plugin/plugin.json`, `.mcp.json`, and `${ZCODE_PLUGIN_ROOT}`, running completely independently outside the repository.
- **Zero Proprietary Binaries**: Pure open-source TypeScript architecture.

---

## 4. Architecture

```mermaid
flowchart LR
    Agent["AI Agent<br/>(ZCode / Claude / Antigravity)"] -->|MCP stdio (2026-07-28)| Server["MCP Server<br/>(@zcode-community/mcp-server)"]
    Server --> Registry["Capability Registry<br/>(Truthful Gate)"]
    Registry --> Core["Core Domain Engine<br/>(Handle V2 & State Reducer)"]
    Core --> Adapters["Platform Adapters<br/>(macOS AX / Win Experimental / Linux Experimental)"]
    Adapters --> OS["Desktop Operating System"]
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for detailed technical specifications.

---

## 5. Quick Start (5 Minutes)

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0

```bash
# 1. Clone repository
git clone https://github.com/timexingxin/zcode-desktop-control.git
cd zcode-desktop-control

# 2. Install and build
pnpm install
pnpm build

# 3. Verify health
pnpm doctor

# 4. Run automated test suite (including real GUI E2E on macOS)
pnpm test
```

---

## 6. ZCode Installation

The plugin distribution is completely self-contained:

```bash
# 1. Build and package the self-contained plugin zip
pnpm package:plugin

# 2. Install or link to ZCode plugin directory
mkdir -p ~/.zcode/cli/plugins/data/zcode-desktop-control
unzip -q dist/zcode-desktop-control.zip -d ~/.zcode/cli/plugins/data/zcode-desktop-control
```

See [`docs/ZCODE_INTEGRATION.md`](docs/ZCODE_INTEGRATION.md) for full configuration details.

---

## 7. Connecting to Other MCP Clients

Add the server to your client's MCP configuration (`mcp_config.json`):

```json
{
  "mcpServers": {
    "computer-use": {
      "command": "node",
      "args": [
        "/path/to/zcode-desktop-control/packages/mcp-server/dist/bin/server.js"
      ]
    }
  }
}
```

Compatible with:
- **ZCode**
- **Antigravity**
- **Claude Code** (`claude mcp add ...`)
- **Cursor**
- **Hermes / Codex**

---

## 8. Platform Support & Truthfulness Matrix

| Platform | Automation Layer | Runtime Status | Zero Fake-Success Guarantee |
| :--- | :--- | :---: | :--- |
| **macOS (Apple Silicon arm64)** | Native AX, CoreGraphics, screencapture | **VERIFIED** | Real CoreGraphics events, verified via TextEdit E2E |
| **macOS (Intel x64)** | Native AX, CoreGraphics, screencapture | **VERIFIED** | Real CoreGraphics events |
| **Windows (x64)** | Windows UI Automation & PowerShell | **EXPERIMENTAL** | Unverified actions throw `UnsupportedPlatformError` |
| **Linux (X11 / Wayland)** | AT-SPI2 / Portal | **EXPERIMENTAL** | Unverified actions throw `UnsupportedPlatformError` |

See [`docs/CAPABILITY_MATRIX.md`](docs/CAPABILITY_MATRIX.md) for the complete 41-tool breakdown.

---

## 9. Security & Privacy

- **Local-Only**: Binds exclusively to stdio or `127.0.0.1`.
- **Zero Credential Access**: Strictly barred from browser cookies, password managers, and OS Keychains.
- **Emergency Kill Switch**: `stop_computer_control` halts automation immediately.
- **Ambiguity Guard**: When multiple UI elements match a query, actions are rejected with `ambiguous_element` to prevent unintended side effects.

See [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md).

---

## 10. License & Attribution

Distributed under the [Apache-2.0 License](LICENSE).  
Third-party notices and Linux Foundation (LF Projects) governance disclosures are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

---

## 11. Disclaimer

> **Notice**: This is an independent community project and is not affiliated with, sponsored by, or endorsed by Z.ai or Beijing Knowledge Atlas Technology Joint Stock Company Limited. "ZCode" is a trademark of its respective owner.
