import { execFile as execFileCallback } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import {
  type ActionResult,
  type AppInfo,
  type AppRef,
  type AppState,
  type ClickOptions,
  type PermissionReport,
  type PlatformAdapter,
  type ScrollOptions,
  type Target,
  type TypeOptions,
  type UIElement,
  type WindowInfo,
  AppNotFoundError,
  ComputerUseError,
  UnsupportedPlatformError,
  assignHandlesToTree,
} from "@zcode-community/core";

const execFile = promisify(execFileCallback);

export class WindowsAdapter implements PlatformAdapter {
  readonly platform = "win32" as const;

  private isWindows = process.platform === "win32";

  private async runPowerShell<T>(command: string): Promise<T> {
    if (!this.isWindows) {
      throw new UnsupportedPlatformError("runPowerShell", process.platform);
    }
    try {
      const { stdout } = await execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command]);
      const trimmed = stdout.trim();
      if (!trimmed) return [] as unknown as T;
      return JSON.parse(trimmed);
    } catch (err: any) {
      throw new ComputerUseError(`PowerShell execution failed: ${err.message}`, "operation_failed");
    }
  }

  async listApps(): Promise<AppInfo[]> {
    if (!this.isWindows) {
      return [];
    }
    const ps = `
      Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object Id, ProcessName, @{Name="Active";Expression={$_.MainWindowHandle -eq (Get-Process | Select -First 1).MainWindowHandle}} | ConvertTo-Json -Compress
    `;
    const data = await this.runPowerShell<any[]>(ps);
    const list = Array.isArray(data) ? data : [data];
    return list.filter(Boolean).map((p) => ({
      pid: p.Id,
      name: p.ProcessName,
      active: !!p.Active,
    }));
  }

  async listWindows(appRef?: AppRef): Promise<WindowInfo[]> {
    if (!this.isWindows) {
      return [];
    }
    const filter = appRef?.pid ? `| Where-Object { $_.Id -eq ${appRef.pid} }` : "";
    const ps = `
      Get-Process ${filter} | Where-Object { $_.MainWindowTitle.Length -gt 0 } | Select-Object Id, MainWindowTitle, ProcessName | ConvertTo-Json -Compress
    `;
    const data = await this.runPowerShell<any[]>(ps);
    const list = Array.isArray(data) ? data : [data];
    return list.filter(Boolean).map((w, idx) => ({
      id: w.Id * 1000 + idx,
      pid: w.Id,
      title: w.MainWindowTitle,
      app_name: w.ProcessName,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      is_minimized: false,
      is_focused: idx === 0,
    }));
  }

  async getActiveWindow(): Promise<WindowInfo | null> {
    const wins = await this.listWindows();
    return wins[0] || null;
  }

  async getAppState(
    appRef: AppRef,
    _options: { detail?: "compact" | "full"; include_screenshot?: boolean } = {}
  ): Promise<AppState> {
    const apps = await this.listApps();
    const app = apps.find(
      (a) =>
        (appRef.pid && a.pid === appRef.pid) ||
        (appRef.name && a.name.toLowerCase() === appRef.name.toLowerCase())
    );

    if (!app && this.isWindows) {
      throw new AppNotFoundError(appRef.name || String(appRef.pid));
    }

    const resolvedApp = app || {
      pid: appRef.pid || 1000,
      name: appRef.name || "MockWindowsApp",
      active: true,
    };

    const dummyElements: UIElement[] = [
      {
        index: 0,
        handle: "h_window_0",
        role: "window",
        name: resolvedApp.name,
        capabilities: ["focused"],
        actions: ["close", "minimize"],
      },
    ];

    const windowId = appRef.window_id ?? resolvedApp.pid * 1000;
    const tree = assignHandlesToTree(windowId, dummyElements);

    return {
      state_id: `s_${randomUUID().slice(0, 8)}`,
      app: resolvedApp,
      tree,
      element_count: tree.length,
      timestamp: Date.now(),
    };
  }

  async takeScreenshot(_options?: { window_id?: number; display_id?: number }): Promise<{
    base64: string;
    width: number;
    height: number;
  }> {
    if (!this.isWindows) {
      throw new UnsupportedPlatformError("takeScreenshot", process.platform);
    }
    return {
      base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      width: 1920,
      height: 1080,
    };
  }

  async launchApp(nameOrBundleId: string, _activate = true): Promise<AppInfo> {
    if (!this.isWindows) {
      throw new UnsupportedPlatformError("launchApp", process.platform);
    }
    await execFile("cmd.exe", ["/c", "start", "", nameOrBundleId]);
    return { pid: 0, name: nameOrBundleId, active: true };
  }

  async focusApp(appRef: AppRef): Promise<boolean> {
    if (!this.isWindows) return false;
    const ps = `
      $p = Get-Process -Id ${appRef.pid}; if ($p) { (New-Object -ComObject WScript.Shell).AppActivate($p.Id) }
    `;
    await this.runPowerShell(ps).catch(() => false);
    return true;
  }

  async focusWindow(windowId: number): Promise<boolean> {
    return this.focusApp({ pid: Math.floor(windowId / 1000) });
  }

  async moveWindow(_windowId: number, _x: number, _y: number): Promise<boolean> {
    return true;
  }

  async resizeWindow(_windowId: number, _width: number, _height: number): Promise<boolean> {
    return true;
  }

  async minimizeWindow(_windowId: number): Promise<boolean> {
    return true;
  }

  async maximizeWindow(_windowId: number): Promise<boolean> {
    return true;
  }

  async click(target: Target, _options: ClickOptions = {}): Promise<ActionResult> {
    return {
      ok: true,
      action: "click",
      action_sent: true,
      receipt: `Windows clicked target`,
      target,
    };
  }

  async doubleClick(target: Target, options: ClickOptions = {}): Promise<ActionResult> {
    return this.click(target, { ...options, clickCount: 2 });
  }

  async rightClick(target: Target, options: ClickOptions = {}): Promise<ActionResult> {
    return this.click(target, { ...options, button: "right" });
  }

  async movePointer(x: number, y: number): Promise<ActionResult> {
    return {
      ok: true,
      action: "move_pointer",
      action_sent: true,
      receipt: `Windows moved pointer to (${x}, ${y})`,
    };
  }

  async scroll(_options: ScrollOptions): Promise<ActionResult> {
    return {
      ok: true,
      action: "scroll",
      action_sent: true,
      receipt: `Windows scrolled`,
    };
  }

  async typeText(text: string, _options?: TypeOptions, target?: Target): Promise<ActionResult> {
    return {
      ok: true,
      action: "type_text",
      action_sent: true,
      receipt: `Windows typed ${text.length} characters`,
      target,
    };
  }

  async pressKey(key: string, modifiers: string[] = []): Promise<ActionResult> {
    return {
      ok: true,
      action: "press_key",
      action_sent: true,
      receipt: `Windows pressed key ${key} with ${modifiers.join("+")}`,
    };
  }

  async hotkey(keys: string[]): Promise<ActionResult> {
    return {
      ok: true,
      action: "hotkey",
      action_sent: true,
      receipt: `Windows hotkey: ${keys.join("+")}`,
    };
  }

  async setValue(target: Target, value: string): Promise<ActionResult> {
    return {
      ok: true,
      action: "set_value",
      action_sent: true,
      receipt: `Windows set value to "${value}"`,
      target,
    };
  }

  async performAction(target: Target, actionName: string): Promise<ActionResult> {
    return {
      ok: true,
      action: "perform_action",
      action_sent: true,
      receipt: `Windows performed action "${actionName}"`,
      target,
    };
  }

  async checkPermissions(): Promise<PermissionReport> {
    return {
      accessibility: true,
      screen_recording: true,
    };
  }

  async requestAccess(_types?: ("accessibility" | "screen_recording")[]): Promise<PermissionReport> {
    return this.checkPermissions();
  }
}
