# ZCode Integration Guide

`zcode-desktop-control` can be integrated into the official ZCode environment via two distinct mechanisms.

---

## 1. As a Native ZCode Plugin (Recommended)

ZCode supports external and community plugins through `.zcode-plugin/plugin.json`.

### Installation Steps

1. Clone or download `zcode-desktop-control` into your local development workspace:
   ```bash
   git clone https://github.com/timexingxin/zcode-desktop-control.git
   cd zcode-desktop-control
   pnpm install
   pnpm build
   ```

2. Register the plugin into ZCode:
   ```bash
   # Option A: Via ZCode CLI (if installed)
   zcode plugin link ./plugin

   # Option B: Via local plugin directory symlink
   mkdir -p ~/.zcode/cli/plugins/data/zcode-desktop-control
   ln -s "$(pwd)/plugin" ~/.zcode/cli/plugins/data/zcode-desktop-control
   ```

3. Restart ZCode. The `computer-use` skill and tools will be available in chat.

---

## 2. As a Standalone MCP Server in `mcp_config.json`

If you are using ZCode in headless mode or pairing it with other agents (Antigravity, Claude Code, Cursor, Codex):

Add the server entry to your MCP configuration (`~/.zcode/mcp_config.json` or `~/.gemini/antigravity/mcp_config.json`):

```json
{
  "mcpServers": {
    "computer-use": {
      "command": "node",
      "args": [
        "/absolute/path/to/zcode-desktop-control/packages/mcp-server/dist/bin/server.js"
      ]
    }
  }
}
```

Verify the server using `cua doctor`:
```bash
node packages/cli/bin/cua.mjs doctor
```
