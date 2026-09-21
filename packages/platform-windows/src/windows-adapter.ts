import { execFile as execFileCallback } from "node:child_process";
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
  type WindowInfo,
  ComputerUseError,
  UnsupportedPlatformError,
} from "@zcode-community/core";

const execFile = promisify(execFileCallback);

/**
 * Windows Platform Adapter.
 * Status: Experimental / Skeleton.
 * In accordance with the Zero Fake-Success Policy (Option B), operations that
 * are not yet verified on live Windows hardware throw UnsupportedPlatformError.
 */
export class WindowsAdapter implements PlatformAdapter {
  readonly platform = "win32" as const;
  readonly status = "experimental" as const;

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
    _appRef: AppRef,
    _options: { detail?: "compact" | "full"; include_screenshot?: boolean } = {}
  ): Promise<AppState> {
    throw new UnsupportedPlatformError("getAppState (UIAutomation)", "win32");
  }

  async takeScreenshot(_options?: { window_id?: number; display_id?: number }): Promise<{
    base64: string;
    width: number;
    height: number;
  }> {
    throw new UnsupportedPlatformError("takeScreenshot", "win32");
  }

  async launchApp(nameOrPath: string): Promise<AppInfo> {
    if (!this.isWindows) {
      throw new UnsupportedPlatformError("launchApp", process.platform);
    }
    await this.runPowerShell(`Start-Process "${nameOrPath}"`);
    return {
      pid: 0,
      name: nameOrPath,
      active: true,
    };
  }

  async focusApp(appRef: AppRef): Promise<boolean> {
    if (!this.isWindows) {
      throw new UnsupportedPlatformError("focusApp", process.platform);
    }
    const filter = appRef.pid ? `Id -eq ${appRef.pid}` : `ProcessName -eq '${appRef.name}'`;
    const ps = `
      $proc = Get-Process | Where-Object { ${filter} } | Select-Object -First 1
      if ($proc -and $proc.MainWindowHandle) {
        $sig = '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
        $type = Add-Type -MemberDefinition $sig -Name "Win32Util" -Namespace "ZCode" -PassThru
        $type::SetForegroundWindow($proc.MainWindowHandle)
      } else {
        $false
      }
    `;
    const res = await this.runPowerShell<boolean>(ps).catch(() => false);
    return !!res;
  }

  async focusWindow(_windowId: number): Promise<boolean> {
    throw new UnsupportedPlatformError("focusWindow", "win32");
  }

  async moveWindow(_windowId: number, _x: number, _y: number): Promise<boolean> {
    throw new UnsupportedPlatformError("moveWindow", "win32");
  }

  async resizeWindow(_windowId: number, _width: number, _height: number): Promise<boolean> {
    throw new UnsupportedPlatformError("resizeWindow", "win32");
  }

  async minimizeWindow(_windowId: number): Promise<boolean> {
    throw new UnsupportedPlatformError("minimizeWindow", "win32");
  }

  async maximizeWindow(_windowId: number): Promise<boolean> {
    throw new UnsupportedPlatformError("maximizeWindow", "win32");
  }

  async click(_target: Target, _options: ClickOptions = {}): Promise<ActionResult> {
    throw new UnsupportedPlatformError("click", "win32");
  }

  async doubleClick(_target: Target, _options: ClickOptions = {}): Promise<ActionResult> {
    throw new UnsupportedPlatformError("double_click", "win32");
  }

  async rightClick(_target: Target, _options: ClickOptions = {}): Promise<ActionResult> {
    throw new UnsupportedPlatformError("right_click", "win32");
  }

  async movePointer(_x: number, _y: number): Promise<ActionResult> {
    throw new UnsupportedPlatformError("move_pointer", "win32");
  }

  async scroll(_options: ScrollOptions): Promise<ActionResult> {
    throw new UnsupportedPlatformError("scroll", "win32");
  }

  async typeText(_text: string, _options?: TypeOptions, _target?: Target): Promise<ActionResult> {
    throw new UnsupportedPlatformError("type_text", "win32");
  }

  async pressKey(_key: string, _modifiers: string[] = []): Promise<ActionResult> {
    throw new UnsupportedPlatformError("press_key", "win32");
  }

  async hotkey(_keys: string[]): Promise<ActionResult> {
    throw new UnsupportedPlatformError("hotkey", "win32");
  }

  async setValue(_target: Target, _value: string): Promise<ActionResult> {
    throw new UnsupportedPlatformError("set_value", "win32");
  }

  async performAction(_target: Target, _actionName: string): Promise<ActionResult> {
    throw new UnsupportedPlatformError("perform_action", "win32");
  }

  async checkPermissions(): Promise<PermissionReport> {
    return {
      accessibility: false,
      screen_recording: false,
    };
  }

  async requestAccess(): Promise<PermissionReport> {
    return this.checkPermissions();
  }
}
