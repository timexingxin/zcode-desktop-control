# zcode-desktop-control

[![CI](https://github.com/timexingxin/zcode-desktop-control/actions/workflows/ci.yml/badge.svg)](https://github.com/timexingxin/zcode-desktop-control/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-2026--07--28-green.svg)](https://github.com/modelcontextprotocol/modelcontextprotocol)
[![Platform](https://img.shields.io/badge/Platform-macOS%20(Verified)%20%7C%20Windows%20%26%20Linux%20(Experimental)-orange.svg)](docs/CAPABILITY_MATRIX.md)

一个独立的、本地优先的桌面自动化运行时与 ZCode 插件，通过标准 [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/modelcontextprotocol) 提供安全、可信的桌面控制能力。

原生适配 **ZCode**、**Antigravity**、**Claude Code**、**Cursor** 以及各类开源 Agent。

> **真实性重于工具数量准则 (Truthfulness > Tool Count Policy)**：本项目执行严格的**零虚假成功铁律 (Zero Fake-Success Policy)**。如果底层操作系统未实际执行对应操作，绝不返回伪造的 `ok: true`，而是直接抛出结构化的 `UnsupportedPlatformError`。

---

## 核心特性

- **无头语义辅助功能（macOS 已完全验证）**：直接操作原生 Accessibility (AX) 树，动作快速、像素级精准且后台安全，不抢占物理鼠标与用户焦点。
- **稳定元素句柄 V2 (Stable Handle V2)**：分离原生持久标识（`StrongHandle`）与语义指纹（`WeakHandle`），杜绝因兄弟节点增删或顺序变动导致的索引漂移，具备冲突与歧义检测能力。
- **经实测的上下文压缩**：支持 `detail="compact"`（智能剪枝非交互元素）与 `detail="diff"`（仅发射变更增量）：
  - **紧凑模式 (Compact)**：字符缩减**中位数 53.17%**（波动范围：51.37% ~ 80.11%）。
  - **增量模式 (Diff)**：字符缩减**中位数 99.03%**（波动范围：94.01% ~ 99.71%）。
- **MCP 协议现代化**：全面对齐 Linux Foundation 最新规范（`2026-07-28`），具备自动版本协商能力，并无缝兼容旧版客户端（`2024-11-05`）。
- **细粒度错误分层**：精确的结构化错误码（`permission_denied`、`element_not_found`、`stale_handle`、`ambiguous_element`、`unsupported_platform`）。
- **自包含 ZCode 插件**：遵循标准 `.zcode-plugin/plugin.json`、`.mcp.json` 与 `${ZCODE_PLUGIN_ROOT}` 规范，支持脱离 Git 源码仓库独立分发运行。
- **纯净 Clean-Room 架构**：零私有闭源二进制文件，纯开源 TypeScript 实现。

---

## 平台支持与真实性保证

| 平台 | 自动化技术层 | 运行时状态 | 零虚假成功保证 |
| :--- | :--- | :---: | :--- |
| **macOS (Apple Silicon arm64)** | 原生 AX、CoreGraphics、screencapture | **VERIFIED** | 原生 CoreGraphics 鼠标/滚轮事件，经 TextEdit 端到端测试验证 |
| **macOS (Intel x64)** | 原生 AX、CoreGraphics、screencapture | **VERIFIED** | 原生 CoreGraphics 鼠标/滚轮事件 |
| **Windows (x64)** | Windows UI Automation & PowerShell | **EXPERIMENTAL** | 未在实机验证的动作严禁假成功，统一抛出 `UnsupportedPlatformError` |
| **Linux (X11 / Wayland)** | AT-SPI2 / Portal | **EXPERIMENTAL** | 未在实机验证的动作严禁假成功，统一抛出 `UnsupportedPlatformError` |

详见完整能力矩阵：[`docs/CAPABILITY_MATRIX.md`](docs/CAPABILITY_MATRIX.md)。

---

## 快速上手

### 环境要求
- Node.js >= 20.0.0
- pnpm >= 9.0.0

```bash
# 1. 克隆代码库
git clone https://github.com/timexingxin/zcode-desktop-control.git
cd zcode-desktop-control

# 2. 安装依赖并编译
pnpm install
pnpm build

# 3. 运行系统环境健康诊断
pnpm doctor

# 4. 执行全量测试套件（含 macOS 真实 GUI 端到端验证）
pnpm test
```

### 打包自包含 ZCode 插件

```bash
pnpm package:plugin
# 生成: dist/zcode-desktop-control.zip (可脱离仓库独立解压运行)
```

---

## 许可证与声明

本项目基于 [Apache-2.0 License](LICENSE) 开源。第三方许可及 Linux Foundation (LF Projects) 开放治理说明详见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

> **免责声明**：本项目为独立开源社区开发，与 Z.ai 或北京智谱华章科技有限公司无任何官方关联。“ZCode” 为其各自所有者的商标。
