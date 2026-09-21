# ZCode Desktop Control Plugin

This directory contains the standard ZCode plugin distribution for `zcode-desktop-control`.

## Plugin Structure

```
plugin/
├── .zcode-plugin/
│   └── plugin.json       # ZCode plugin manifest declaring MCP server
├── skills/
│   └── computer-use/
│       └── SKILL.md      # Concise Agent operational prompt
└── README.md
```

## Installation in ZCode

### Method 1: Local Plugin Linking (Recommended)

In your ZCode CLI or configuration, install or link the plugin directory:

```bash
zcode plugin link /path/to/zcode-desktop-control/plugin
```

Or copy/symlink to your local ZCode plugins directory:

```bash
mkdir -p ~/.zcode/cli/plugins/data/zcode-desktop-control
ln -s "$(pwd)/plugin" ~/.zcode/cli/plugins/data/zcode-desktop-control
```

### Method 2: Standalone MCP Server Integration

Add to your `mcp_config.json` or ZCode configuration:

```json
{
  "mcpServers": {
    "computer-use": {
      "command": "node",
      "args": ["/path/to/zcode-desktop-control/packages/mcp-server/dist/bin/server.js"]
    }
  }
}
```

Once installed, your agent automatically accesses all 30 Computer Use tools and the `computer-use` skill.
