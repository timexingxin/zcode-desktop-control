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
  UnsupportedPlatformError,
} from "@zcode-community/core";

/**
 * Linux Platform Adapter.
 * Status: Experimental / Skeleton.
 * In accordance with the Zero Fake-Success Policy (Option B), operations that
 * are not yet verified on live Linux hardware throw UnsupportedPlatformError.
 */
export class LinuxAdapter implements PlatformAdapter {
  readonly platform = "linux" as const;
  readonly status = "experimental" as const;

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
    _appRef: AppRef,
    _options: { detail?: "compact" | "full"; include_screenshot?: boolean } = {}
  ): Promise<AppState> {
    throw new UnsupportedPlatformError("getAppState (AT-SPI2)", "linux");
  }

  async takeScreenshot(_options?: { window_id?: number; display_id?: number }): Promise<{
    base64: string;
    width: number;
    height: number;
  }> {
    throw new UnsupportedPlatformError("takeScreenshot", "linux");
  }

  async launchApp(_nameOrBundleId: string, _activate = true): Promise<AppInfo> {
    throw new UnsupportedPlatformError("launchApp", "linux");
  }

  async focusApp(_appRef: AppRef): Promise<boolean> {
    throw new UnsupportedPlatformError("focusApp", "linux");
  }

  async focusWindow(_windowId: number): Promise<boolean> {
    throw new UnsupportedPlatformError("focusWindow", "linux");
  }

  async moveWindow(_windowId: number, _x: number, _y: number): Promise<boolean> {
    throw new UnsupportedPlatformError("moveWindow", "linux");
  }

  async resizeWindow(_windowId: number, _width: number, _height: number): Promise<boolean> {
    throw new UnsupportedPlatformError("resizeWindow", "linux");
  }

  async minimizeWindow(_windowId: number): Promise<boolean> {
    throw new UnsupportedPlatformError("minimizeWindow", "linux");
  }

  async maximizeWindow(_windowId: number): Promise<boolean> {
    throw new UnsupportedPlatformError("maximizeWindow", "linux");
  }

  async click(_target: Target, _options: ClickOptions = {}): Promise<ActionResult> {
    throw new UnsupportedPlatformError("click", "linux");
  }

  async doubleClick(_target: Target, _options: ClickOptions = {}): Promise<ActionResult> {
    throw new UnsupportedPlatformError("double_click", "linux");
  }

  async rightClick(_target: Target, _options: ClickOptions = {}): Promise<ActionResult> {
    throw new UnsupportedPlatformError("right_click", "linux");
  }

  async movePointer(_x: number, _y: number): Promise<ActionResult> {
    throw new UnsupportedPlatformError("move_pointer", "linux");
  }

  async scroll(_options: ScrollOptions): Promise<ActionResult> {
    throw new UnsupportedPlatformError("scroll", "linux");
  }

  async typeText(_text: string, _options?: TypeOptions, _target?: Target): Promise<ActionResult> {
    throw new UnsupportedPlatformError("type_text", "linux");
  }

  async pressKey(_key: string, _modifiers: string[] = []): Promise<ActionResult> {
    throw new UnsupportedPlatformError("press_key", "linux");
  }

  async hotkey(_keys: string[]): Promise<ActionResult> {
    throw new UnsupportedPlatformError("hotkey", "linux");
  }

  async setValue(_target: Target, _value: string): Promise<ActionResult> {
    throw new UnsupportedPlatformError("set_value", "linux");
  }

  async performAction(_target: Target, _actionName: string): Promise<ActionResult> {
    throw new UnsupportedPlatformError("perform_action", "linux");
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
