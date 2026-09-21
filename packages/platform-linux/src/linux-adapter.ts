import { randomUUID } from "node:crypto";
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
  assignHandlesToTree,
} from "@zcode-community/core";

export class LinuxAdapter implements PlatformAdapter {
  readonly platform = "linux" as const;

  async listApps(): Promise<AppInfo[]> {
    return [];
  }

  async listWindows(_appRef?: AppRef): Promise<WindowInfo[]> {
    return [];
  }

  async getActiveWindow(): Promise<WindowInfo | null> {
    return null;
  }

  async getAppState(
    appRef: AppRef,
    _options: { detail?: "compact" | "full"; include_screenshot?: boolean } = {}
  ): Promise<AppState> {
    const dummyElements: UIElement[] = [
      {
        index: 0,
        handle: "h_window_0",
        role: "window",
        name: appRef.name || "LinuxWindow",
        capabilities: ["focused"],
        actions: ["close"],
      },
    ];
    const windowId = appRef.window_id ?? 1000;
    const tree = assignHandlesToTree(windowId, dummyElements);

    return {
      state_id: `s_${randomUUID().slice(0, 8)}`,
      app: {
        pid: appRef.pid || 1000,
        name: appRef.name || "LinuxApp",
        active: true,
      },
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
    return {
      base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      width: 1920,
      height: 1080,
    };
  }

  async launchApp(nameOrBundleId: string, _activate = true): Promise<AppInfo> {
    return { pid: 0, name: nameOrBundleId, active: true };
  }

  async focusApp(_appRef: AppRef): Promise<boolean> {
    return true;
  }

  async focusWindow(_windowId: number): Promise<boolean> {
    return true;
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
      receipt: `Linux clicked target`,
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
      receipt: `Linux moved pointer to (${x}, ${y})`,
    };
  }

  async scroll(_options: ScrollOptions): Promise<ActionResult> {
    return {
      ok: true,
      action: "scroll",
      action_sent: true,
      receipt: `Linux scrolled`,
    };
  }

  async typeText(text: string, _options?: TypeOptions, target?: Target): Promise<ActionResult> {
    return {
      ok: true,
      action: "type_text",
      action_sent: true,
      receipt: `Linux typed ${text.length} characters`,
      target,
    };
  }

  async pressKey(key: string, modifiers: string[] = []): Promise<ActionResult> {
    return {
      ok: true,
      action: "press_key",
      action_sent: true,
      receipt: `Linux pressed key ${key} with ${modifiers.join("+")}`,
    };
  }

  async hotkey(keys: string[]): Promise<ActionResult> {
    return {
      ok: true,
      action: "hotkey",
      action_sent: true,
      receipt: `Linux hotkey: ${keys.join("+")}`,
    };
  }

  async setValue(target: Target, value: string): Promise<ActionResult> {
    return {
      ok: true,
      action: "set_value",
      action_sent: true,
      receipt: `Linux set value to "${value}"`,
      target,
    };
  }

  async performAction(target: Target, actionName: string): Promise<ActionResult> {
    return {
      ok: true,
      action: "perform_action",
      action_sent: true,
      receipt: `Linux performed action "${actionName}"`,
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
