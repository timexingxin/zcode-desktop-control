# Third-Party Notices & Open Governance Disclosures

This project references, interoperates with, and builds upon specifications and standards from third-party ecosystems:

---

## 1. Model Context Protocol (MCP)
- **Governance**: Linux Foundation (LF Projects)
- **Specification Source**: [modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol) (Specification dated 2026-07-28 and subsequent revisions)
- **Licensing**:
  - Specification & Core Architecture: Apache License 2.0 / Open Standard
  - Legacy Prototype SDK Reference: MIT License (Anthropic, PBC 2024)
- **Purpose**: JSON-RPC 2.0 interface definition, stateless core message semantics, and tool calling schemas.
- **Notice**: Model Context Protocol is an open-source project hosted by LF Projects. `zcode-desktop-control` implements an independent, clean-room client and server adhering to the MCP open specification.

---

## 2. ZCode Harness & Plugin Schema
- **Organization**: Z.ai (Beijing Knowledge Atlas Technology Joint Stock Company Limited)
- **Specification Source**: `zai-org/zcode-plugins`
- **License**: Apache License 2.0
- **Purpose**: Compatibility schema for `.zcode-plugin/plugin.json`, `.mcp.json`, and the `${ZCODE_PLUGIN_ROOT}` variable.
- **Notice**: ZCode is a trademark of Z.ai. This project is an independent community development and is not officially affiliated with or endorsed by Z.ai.

---

## 3. Runtime & Platform Foundations
- **Node.js**: MIT License (OpenJS Foundation)
- **TypeScript**: Apache-2.0 License (Microsoft Corporation)
- **Apple macOS SDK**: Proprietary Apple Inc. interfaces (CoreGraphics, Accessibility, System Events) invoked strictly through local OS scripting bridges without bundling proprietary binaries.
