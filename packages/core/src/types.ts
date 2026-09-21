/**
 * Core domain types for ZCode-compatible Computer Use runtime.
 */

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface AppRef {
  pid?: number;
  name?: string;
  bundle_id?: string;
  window_id?: number;
}

export interface AppInfo {
  pid: number;
  name: string;
  bundle_id?: string;
  active: boolean;
  windows_count?: number;
}

export interface WindowInfo {
  id: number;
  pid: number;
  title: string;
  app_name: string;
  bundle_id?: string;
  bounds: Rectangle;
  is_minimized: boolean;
  is_focused: boolean;
}

export interface UIElement {
  index: number;
  handle: string;
  role: string;
  name: string;
  value?: string;
  bounds?: Rectangle;
  capabilities: string[];
  actions: string[];
  children?: UIElement[];
}

export interface CompactUIElement {
  i: number; // index
  h: string; // handle
  r: string; // role
  n: string; // name
  v?: string; // value
  c: string[]; // capabilities
}

export interface AppState {
  state_id: string;
  app: AppInfo;
  active_window?: WindowInfo;
  tree: UIElement[];
  element_count: number;
  timestamp: number;
  screenshot_base64?: string;
}

export interface CompactAppState {
  state_id: string;
  app: {
    pid: number;
    name: string;
    bundle_id?: string;
  };
  active_window?: {
    id: number;
    title: string;
    bounds: Rectangle;
  };
  elements: CompactUIElement[];
  element_count: number;
  timestamp: number;
  screenshot_base64?: string;
}

export interface DiffAppState {
  state_id: string;
  base_state_id: string;
  app: AppInfo;
  added_elements: CompactUIElement[];
  removed_handles: string[];
  modified_elements: CompactUIElement[];
  timestamp: number;
}

export type ElementTarget = {
  type: "element";
  state_id?: string;
  index?: number;
  handle?: string;
};

export type CoordinateTarget = {
  type: "coordinate";
  x: number;
  y: number;
  frame_id?: string;
};

export type Target = ElementTarget | CoordinateTarget;

export interface ClickOptions {
  button?: "left" | "right" | "middle";
  clickCount?: number; // 1, 2, 3
  modifiers?: ("command" | "control" | "alt" | "shift")[];
  strategy?: "auto" | "a11y" | "event";
}

export interface TypeOptions {
  strategy?: "auto" | "a11y" | "event";
  clearFirst?: boolean;
}

export interface ScrollOptions {
  target?: Target;
  deltaX?: number;
  deltaY?: number;
  delta?: number; // legacy shorthand
  direction?: "up" | "down" | "left" | "right";
  strategy?: "auto" | "a11y" | "event";
}

export interface ActionResult {
  ok: boolean;
  action: string;
  action_sent: boolean;
  receipt: string;
  target?: Target;
  state?: AppState | CompactAppState | DiffAppState;
  error?: string;
  error_code?: string;
}

export interface PermissionReport {
  accessibility: boolean;
  screen_recording: boolean;
  details?: Record<string, unknown>;
}

export interface PlatformAdapter {
  readonly platform: "darwin" | "win32" | "linux";
  
  // App & Window Observation
  listApps(): Promise<AppInfo[]>;
  listWindows(appRef?: AppRef): Promise<WindowInfo[]>;
  getActiveWindow(): Promise<WindowInfo | null>;
  getAppState(appRef: AppRef, options?: { detail?: "compact" | "full"; include_screenshot?: boolean }): Promise<AppState>;
  takeScreenshot(options?: { window_id?: number; display_id?: number }): Promise<{ base64: string; width: number; height: number }>;
  
  // App & Window Control
  launchApp(nameOrBundleId: string, activate?: boolean): Promise<AppInfo>;
  focusApp(appRef: AppRef): Promise<boolean>;
  focusWindow(windowId: number): Promise<boolean>;
  moveWindow(windowId: number, x: number, y: number): Promise<boolean>;
  resizeWindow(windowId: number, width: number, height: number): Promise<boolean>;
  minimizeWindow(windowId: number): Promise<boolean>;
  maximizeWindow(windowId: number): Promise<boolean>;

  // Interaction
  click(target: Target, options?: ClickOptions): Promise<ActionResult>;
  doubleClick(target: Target, options?: ClickOptions): Promise<ActionResult>;
  rightClick(target: Target, options?: ClickOptions): Promise<ActionResult>;
  movePointer(x: number, y: number): Promise<ActionResult>;
  scroll(options: ScrollOptions): Promise<ActionResult>;
  typeText(text: string, options?: TypeOptions, target?: Target): Promise<ActionResult>;
  pressKey(key: string, modifiers?: string[]): Promise<ActionResult>;
  hotkey(keys: string[]): Promise<ActionResult>;
  setValue(target: Target, value: string): Promise<ActionResult>;
  performAction(target: Target, actionName: string): Promise<ActionResult>;
  
  // System & Permission
  checkPermissions(): Promise<PermissionReport>;
  requestAccess(types?: ("accessibility" | "screen_recording")[]): Promise<PermissionReport>;
}
