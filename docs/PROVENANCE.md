# Code Provenance & Clean-Room Attributions (docs/PROVENANCE.md)

Every file and module in `zcode-desktop-control` adheres to strict open-source provenance standards. Proprietary binaries, extracted app bundles, and decompiled code are strictly forbidden.

---

## 1. Provenance Classification Matrix

Each module in this repository is categorized under the following classification:
- **A**: Clearly original / safe (First-party original code)
- **B**: Permissively licensed dependency (Retaining original copyright / NOTICE)
- **C**: Clean-room redesigned based on public specifications
- **D**: Proprietary / closed-source (Strictly excluded from this repository)
- **E**: Compiled binary artifact (Strictly excluded from this repository)

| Subsystem / Module | Provenance Class | Origin & Legal Justification |
| :--- | :---: | :--- |
| `packages/core` | **A** | 100% original TypeScript implementation of stable handles, compact tree reducers, and error taxonomy. |
| `packages/platform-macos` | **A / C** | Clean-room implementation using Apple public JXA (`Application("System Events")`) and standard `/usr/sbin/screencapture`. Zero proprietary binary dependencies. |
| `packages/platform-windows` | **A / C** | Clean-room implementation using public Windows PowerShell and UIAutomation interfaces. |
| `packages/platform-linux` | **A / C** | Clean-room implementation using public AT-SPI2 / X11 structures. |
| `packages/mcp-server` | **A / C** | Clean-room implementation based on the open Anthropic Model Context Protocol (MCP) specification. |
| `packages/cli` (`cua`) | **A** | 100% original diagnostic CLI implementation. |
| `plugin/.zcode-plugin/plugin.json` | **C** | Authored according to the public ZCode plugin architecture specification from `zai-org/ZCode` (Apache-2.0). |
| `plugin/skills/computer-use/SKILL.md`| **A** | Original concise Agent prompt engineered for token-lean execution. |

---

## 2. Clean-Room Methodology

1. **Independent Implementation**: All code in `packages/*` was authored from scratch using standard Node.js APIs and OS public system interfaces.
2. **Exclusion of Proprietary Artifacts**:
   - The closed-source binary helper `ZCode Computer Use.app` (signed by Beijing Knowledge Atlas Technology Joint Stock Company Limited) is **NOT** included in this repository.
   - The closed-source bundled script `dist/mcp/server.js` (from historical private plugins) is **NOT** included in this repository.
3. **Open Specifications Used**:
   - Model Context Protocol (MCP) Specification (JSON-RPC 2.0).
   - Apple macOS Accessibility Protocol and System Events Scripting Interface.
   - Microsoft Windows UI Automation Specification.
   - Open source `zai-org/ZCode` repository documentation (Apache-2.0).

## Historical Commit Attribution

Three early commits record the author and committer email
`106403213+timexingxin@users.noreply.github.com`. GitHub associates that
account ID with `sntaputri2805`, so its contributor display attributes these
commits to that account:

- `c0cead14621a0be14ab15af28c6f2741789d1e51` — `feat(runtime): enforce zero fake-success, real macOS CoreGraphics, handle v2, and CI fix`
- `f617b4550e5fe689bc5aaf26a93d4e14b937e16b` — `test: isolate platform adapter in adversarial test and skip GUI in headless CI`
- `1c8136fc46618488754a9a2ddbd58b9d67d52ba6` — `ci: add cross-platform test runner and align pnpm versions`

The recorded Git identity does not establish who personally authored the
changes. Historical attribution remains ambiguous. The published Git objects
are preserved, and no ownership claim or history rewrite is being made without
sufficient evidence.
