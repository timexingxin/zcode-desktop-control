# Development & Contributing Guide

Thank you for your interest in contributing to `zcode-desktop-control`!

---

## 1. Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 10.0.0
- **Operating System**: macOS 14+, Windows 11, or modern Linux.

---

## 2. Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/timexingxin/zcode-desktop-control.git
   cd zcode-desktop-control
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build all workspace packages:
   ```bash
   pnpm build
   ```

4. Run the test suite:
   ```bash
   pnpm test
   ```

5. Run doctor diagnostics:
   ```bash
   pnpm doctor
   ```

---

## 3. Monorepo Organization

- `packages/core`: Pure TypeScript domain logic, types, state compression, stable handles.
- `packages/platform-macos`: Native macOS accessibility and input adapter.
- `packages/platform-windows`: Native Windows UIA adapter.
- `packages/platform-linux`: Linux AT-SPI2 adapter.
- `packages/mcp-server`: MCP server protocol implementation.
- `packages/cli`: `cua` CLI tool.
- `plugin/`: ZCode plugin definition and Agent skill.
