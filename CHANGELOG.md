# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-09-21

### Initial Open-Source Release

This is the initial open-source community release of `zcode-desktop-control`: an independent, local-first Computer Use runtime and MCP integration for ZCode and AI agents.

### What Works
- **Clean-Room Core Architecture**: Completely free of closed-source proprietary binaries and decompiled assets.
- **Model Context Protocol (MCP)**: Full stdio JSON-RPC 2.0 server exposing 30+ standardized Computer Use tools.
- **Accessibility-First Operations**: Semantic tree inspection, element actions (`AXPress`, `setValue`), and stable handles avoiding fragile index drifts.
- **Token Efficiency**: `compact` and `diff` state detail modes pruning non-interactive noise.
- **Structured Error Taxonomy**: Granular `PermissionDeniedError`, `ElementNotFoundError`, `StaleHandleError`, `WindowNotFoundError`, and `TimeoutError`.
- **Diagnostic CLI (`cua`)**: `cua doctor`, `cua mcp`, `cua list-apps`, `cua screenshot`.
- **ZCode Plugin Compatibility**: Native `.zcode-plugin/plugin.json` manifest and concise `computer-use` skill.

### Tested Environments
- **macOS Sequoia (15.x, Apple Silicon arm64)**: Fully verified and smoke-tested.
- **Node.js**: v20.x, v22.x.

### Known Limitations
- Windows UI Automation and Linux AT-SPI2 implementations are architecturally structured but require live native hardware validation for full parity.
- macOS requires explicit user grants in System Settings for Accessibility and Screen Recording.
