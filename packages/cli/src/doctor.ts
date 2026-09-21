import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createPlatformAdapter, TOOLS_MANIFEST } from "@zcode-community/mcp-server";

export interface DoctorReport {
  timestamp: string;
  overall_healthy: boolean;
  checks: {
    runtime: {
      node_version: string;
      valid: boolean;
    };
    os: {
      platform: string;
      arch: string;
      supported: boolean;
    };
    permissions: {
      accessibility: boolean;
      screen_recording: boolean;
    };
    zcode_integration: {
      installed: boolean;
      app_path?: string;
      config_dir?: string;
    };
    mcp: {
      tools_count: number;
      available: boolean;
    };
  };
}

export async function runDoctor(): Promise<DoctorReport> {
  const adapter = createPlatformAdapter();
  const perms = await adapter.checkPermissions().catch(() => ({
    accessibility: false,
    screen_recording: false,
  }));

  // Detect ZCode app & plugin directories safely
  let zcodeInstalled = false;
  let zcodeAppPath: string | undefined;
  const zcodeConfig = join(homedir(), ".zcode");

  if (process.platform === "darwin") {
    const candidates = [
      "/Applications/ZCode.app",
      join(homedir(), "Applications/ZCode.app"),
    ];
    for (const c of candidates) {
      if (existsSync(c)) {
        zcodeInstalled = true;
        zcodeAppPath = c;
        break;
      }
    }
  } else if (process.platform === "win32") {
    const winPath = join(process.env.LOCALAPPDATA || "", "Programs", "ZCode", "ZCode.exe");
    if (existsSync(winPath)) {
      zcodeInstalled = true;
      zcodeAppPath = winPath;
    }
  }

  const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
  const runtimeValid = nodeMajor >= 20;
  const osSupported = ["darwin", "win32", "linux"].includes(process.platform);
  const mcpValid = TOOLS_MANIFEST.length >= 25;

  const overallHealthy = runtimeValid && osSupported && mcpValid;

  return {
    timestamp: new Date().toISOString(),
    overall_healthy: overallHealthy,
    checks: {
      runtime: {
        node_version: process.versions.node,
        valid: runtimeValid,
      },
      os: {
        platform: process.platform,
        arch: process.arch,
        supported: osSupported,
      },
      permissions: {
        accessibility: perms.accessibility,
        screen_recording: perms.screen_recording,
      },
      zcode_integration: {
        installed: zcodeInstalled,
        app_path: zcodeAppPath,
        config_dir: existsSync(zcodeConfig) ? zcodeConfig : undefined,
      },
      mcp: {
        tools_count: TOOLS_MANIFEST.length,
        available: mcpValid,
      },
    },
  };
}
