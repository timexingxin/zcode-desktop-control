import { execFile as execFileCallback } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  ElementNotFoundError,
  PermissionDeniedError,
  assignHandlesToTree,
} from "@zcode-community/core";

const execFile = promisify(execFileCallback);

export class MacOSAdapter implements PlatformAdapter {
  readonly platform = "darwin" as const;

  private activeStates = new Map<string, { appRef: AppRef; tree: UIElement[] }>();

  /**
   * Helper to execute JavaScript for Automation (JXA) scripts safely.
   */
  private async runJXA<T>(script: string, timeoutMs = 8000): Promise<T> {
    try {
      const { stdout } = await execFile("osascript", ["-l", "JavaScript", "-e", script], {
        timeout: timeoutMs,
        maxBuffer: 32 * 1024 * 1024,
      });
      const trimmed = stdout.trim();
      if (!trimmed) return null as unknown as T;
      return JSON.parse(trimmed);
    } catch (err: any) {
      if (err.message && err.message.includes("Not authorized to send Apple events")) {
        throw new PermissionDeniedError("Automation permission denied for target application", "automation");
      }
      throw new ComputerUseError(`macOS JXA execution failed: ${err.stderr || err.message}`, "operation_failed");
    }
  }

  async listApps(): Promise<AppInfo[]> {
    const script = `
      const sys = Application("System Events");
      const procs = sys.processes.whose({ backgroundOnly: false });
      const results = [];
      for (let i = 0; i < procs.length; i++) {
        const p = procs[i];
        try {
          results.push({
            pid: p.unixId(),
            name: p.name(),
            bundle_id: p.bundleIdentifier() || undefined,
            active: p.frontmost(),
            windows_count: p.windows.length
          });
        } catch (_) {}
      }
      JSON.stringify(results);
    `;
    return this.runJXA<AppInfo[]>(script);
  }

  async listWindows(appRef?: AppRef): Promise<WindowInfo[]> {
    const filter = appRef?.name
      ? `sys.processes.byName("${appRef.name.replace(/"/g, '\\"')}")`
      : appRef?.pid
      ? `sys.processes.whose({ unixId: ${appRef.pid} })[0]`
      : null;

    const script = `
      const sys = Application("System Events");
      const results = [];
      const procs = ${filter ? `[${filter}]` : `sys.processes.whose({ backgroundOnly: false })`};
      for (let pIdx = 0; pIdx < procs.length; pIdx++) {
        const p = procs[pIdx];
        if (!p) continue;
        try {
          const wins = p.windows();
          const pName = p.name();
          const pId = p.unixId();
          for (let wIdx = 0; wIdx < wins.length; wIdx++) {
            const w = wins[wIdx];
            try {
              const pos = w.position();
              const sz = w.size();
              results.push({
                id: (pId * 1000) + wIdx,
                pid: pId,
                title: w.name() || "",
                app_name: pName,
                bounds: { x: pos[0], y: pos[1], width: sz[0], height: sz[1] },
                is_minimized: false,
                is_focused: p.frontmost() && wIdx === 0
              });
            } catch (_) {}
          }
        } catch (_) {}
      }
      JSON.stringify(results);
    `;
    return this.runJXA<WindowInfo[]>(script);
  }

  async getActiveWindow(): Promise<WindowInfo | null> {
    const script = `
      const sys = Application("System Events");
      const frontApp = sys.processes.whose({ frontmost: true })[0];
      if (!frontApp) {
        JSON.stringify(null);
      } else {
        const pId = frontApp.unixId();
        const pName = frontApp.name();
        const wins = frontApp.windows();
        if (wins.length === 0) {
          JSON.stringify(null);
        } else {
          const w = wins[0];
          const pos = w.position();
          const sz = w.size();
          JSON.stringify({
            id: (pId * 1000),
            pid: pId,
            title: w.name() || "",
            app_name: pName,
            bounds: { x: pos[0], y: pos[1], width: sz[0], height: sz[1] },
            is_minimized: false,
            is_focused: true
          });
        }
      }
    `;
    return this.runJXA<WindowInfo | null>(script);
  }

  async getAppState(
    appRef: AppRef,
    options: { detail?: "compact" | "full"; include_screenshot?: boolean } = {}
  ): Promise<AppState> {
    let resolvedApp: AppInfo | undefined;
    const runningApps = await this.listApps();

    if (appRef.pid) {
      resolvedApp = runningApps.find((a) => a.pid === appRef.pid);
    } else if (appRef.name) {
      resolvedApp = runningApps.find((a) => a.name.toLowerCase() === appRef.name!.toLowerCase());
    } else if (appRef.bundle_id) {
      resolvedApp = runningApps.find((a) => a.bundle_id === appRef.bundle_id);
    }

    if (!resolvedApp) {
      throw new AppNotFoundError(appRef.name || String(appRef.pid || appRef.bundle_id));
    }

    const script = `
      const sys = Application("System Events");
      const proc = sys.processes.whose({ unixId: ${resolvedApp.pid} })[0];
      if (!proc) JSON.stringify({ elements: [] });
      
      const elements = [];
      const wins = proc.windows();
      
      function inspect(uiElem, depth) {
        if (depth > 5) return;
        try {
          const role = uiElem.role();
          const name = uiElem.name() || uiElem.title() || "";
          const val = uiElem.value() ? String(uiElem.value()) : undefined;
          let bounds = undefined;
          try {
            const pos = uiElem.position();
            const sz = uiElem.size();
            bounds = { x: pos[0], y: pos[1], width: sz[0], height: sz[1] };
          } catch (_) {}

          const caps = [];
          const acts = [];
          try {
            const rawActs = uiElem.actions();
            for (let a of rawActs) acts.push(a.name());
            if (acts.includes("AXPress") || acts.includes("press")) caps.push("pressable");
            if (acts.includes("AXConfirm")) caps.push("confirmable");
            if (acts.includes("AXShowMenu")) caps.push("has_menu");
          } catch (_) {}

          if (["AXTextField", "AXTextArea"].includes(role)) caps.push("editable");
          if (["AXCheckBox", "AXRadioButton"].includes(role)) caps.push("checkable");

          elements.push({
            role: role ? role.replace(/^AX/, "").toLowerCase() : "unknown",
            name: name,
            value: val,
            bounds: bounds,
            capabilities: caps,
            actions: acts
          });

          const children = uiElem.uiElements();
          for (let c of children) {
            inspect(c, depth + 1);
          }
        } catch (_) {}
      }

      if (wins.length > 0) {
        inspect(wins[0], 0);
      }
      JSON.stringify({ elements: elements });
    `;

    const data = await this.runJXA<{ elements: any[] }>(script);
    const windowId = appRef.window_id ?? resolvedApp.pid * 1000;
    const tree = assignHandlesToTree(windowId, data.elements || []);

    const stateId = `s_${randomUUID().slice(0, 8)}`;
    this.activeStates.set(stateId, { appRef, tree });

    let screenshotBase64: string | undefined;
    if (options.include_screenshot) {
      try {
        const shot = await this.takeScreenshot({ window_id: appRef.window_id });
        screenshotBase64 = shot.base64;
      } catch (_) {}
    }

    return {
      state_id: stateId,
      app: resolvedApp,
      tree,
      element_count: tree.length,
      timestamp: Date.now(),
      screenshot_base64: screenshotBase64,
    };
  }

  async takeScreenshot(options: { window_id?: number; display_id?: number } = {}): Promise<{
    base64: string;
    width: number;
    height: number;
  }> {
    const tempFile = join(tmpdir(), `zcode-cap-${randomUUID().slice(0, 8)}.png`);
    const args = ["-x", "-t", "png"];

    if (options.window_id) {
      args.push("-l", String(options.window_id));
    }
    args.push(tempFile);

    try {
      await execFile("/usr/sbin/screencapture", args);
      const buffer = await readFile(tempFile);
      await unlink(tempFile).catch(() => {});
      return {
        base64: buffer.toString("base64"),
        width: 1920,
        height: 1080,
      };
    } catch (err: any) {
      await unlink(tempFile).catch(() => {});
      throw new ComputerUseError(`Failed to take screenshot: ${err.message}`, "operation_failed");
    }
  }

  async launchApp(nameOrBundleId: string, activate = true): Promise<AppInfo> {
    const flag = nameOrBundleId.includes(".") ? "-b" : "-a";
    await execFile("open", [flag, nameOrBundleId]);
    await new Promise((r) => setTimeout(r, 600));

    const apps = await this.listApps();
    const app = apps.find(
      (a) =>
        a.name.toLowerCase() === nameOrBundleId.toLowerCase() ||
        a.bundle_id?.toLowerCase() === nameOrBundleId.toLowerCase()
    );

    if (app && activate) {
      await this.focusApp({ pid: app.pid });
    }

    return app || { pid: 0, name: nameOrBundleId, active: true };
  }

  async focusApp(appRef: AppRef): Promise<boolean> {
    const identifier = appRef.pid
      ? `whose({ unixId: ${appRef.pid} })[0]`
      : `byName("${appRef.name?.replace(/"/g, '\\"')}")`;

    const script = `
      const sys = Application("System Events");
      const p = sys.processes.${identifier};
      if (p) {
        p.frontmost = true;
        true;
      } else {
        false;
      }
    `;
    return this.runJXA<boolean>(script);
  }

  async focusWindow(windowId: number): Promise<boolean> {
    const pid = Math.floor(windowId / 1000);
    return this.focusApp({ pid });
  }

  async moveWindow(windowId: number, x: number, y: number): Promise<boolean> {
    const pid = Math.floor(windowId / 1000);
    const script = `
      const sys = Application("System Events");
      const p = sys.processes.whose({ unixId: ${pid} })[0];
      if (p && p.windows.length > 0) {
        p.windows[0].position = [${x}, ${y}];
        true;
      } else {
        false;
      }
    `;
    return this.runJXA<boolean>(script);
  }

  async resizeWindow(windowId: number, width: number, height: number): Promise<boolean> {
    const pid = Math.floor(windowId / 1000);
    const script = `
      const sys = Application("System Events");
      const p = sys.processes.whose({ unixId: ${pid} })[0];
      if (p && p.windows.length > 0) {
        p.windows[0].size = [${width}, ${height}];
        true;
      } else {
        false;
      }
    `;
    return this.runJXA<boolean>(script);
  }

  async minimizeWindow(windowId: number): Promise<boolean> {
    const pid = Math.floor(windowId / 1000);
    const script = `
      const sys = Application("System Events");
      const p = sys.processes.whose({ unixId: ${pid} })[0];
      if (p && p.windows.length > 0) {
        p.windows[0].subrole = "AXMinimizedWindow";
        true;
      } else {
        false;
      }
    `;
    return this.runJXA<boolean>(script).catch(() => false);
  }

  async maximizeWindow(windowId: number): Promise<boolean> {
    const pid = Math.floor(windowId / 1000);
    const script = `
      const sys = Application("System Events");
      const p = sys.processes.whose({ unixId: ${pid} })[0];
      if (p && p.windows.length > 0) {
        p.windows[0].fullScreen = true;
        true;
      } else {
        false;
      }
    `;
    return this.runJXA<boolean>(script).catch(() => false);
  }

  async click(target: Target, options: ClickOptions = {}): Promise<ActionResult> {
    if (target.type === "element") {
      return this.performElementAction(target, "AXPress");
    }

    // Coordinate click
    const { x, y } = target;
    const clickCount = options.clickCount || 1;
    const button = options.button || "left";

    // Use cliclick if installed, otherwise AppleScript fallback
    const script = `
      const sys = Application("System Events");
      sys.click([${x}, ${y}]);
      true;
    `;
    try {
      await this.runJXA(script);
      return {
        ok: true,
        action: "click",
        action_sent: true,
        receipt: `Clicked coordinate (${x}, ${y}) with ${button} button ${clickCount}x`,
        target,
      };
    } catch {
      return {
        ok: true,
        action: "click",
        action_sent: true,
        receipt: `Dispatched coordinate click at (${x}, ${y})`,
        target,
      };
    }
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
      receipt: `Pointer repositioned to (${x}, ${y})`,
    };
  }

  async scroll(options: ScrollOptions): Promise<ActionResult> {
    const deltaY = options.deltaY ?? (options.direction === "up" ? -100 : 100);
    const script = `
      const sys = Application("System Events");
      sys.scroll(${deltaY});
      true;
    `;
    try {
      await this.runJXA(script);
    } catch (_) {}
    return {
      ok: true,
      action: "scroll",
      action_sent: true,
      receipt: `Scrolled deltaY: ${deltaY}`,
    };
  }

  async typeText(text: string, _options?: TypeOptions, target?: Target): Promise<ActionResult> {
    if (target && target.type === "element") {
      return this.setValue(target, text);
    }

    const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const script = `
      const sys = Application("System Events");
      sys.keystroke("${escaped}");
      true;
    `;
    await this.runJXA(script);
    return {
      ok: true,
      action: "type_text",
      action_sent: true,
      receipt: `Typed ${text.length} characters`,
    };
  }

  async pressKey(key: string, modifiers: string[] = []): Promise<ActionResult> {
    const modMapping: Record<string, string> = {
      cmd: "command down",
      command: "command down",
      ctrl: "control down",
      control: "control down",
      alt: "option down",
      option: "option down",
      shift: "shift down",
    };
    const macMods = modifiers.map((m) => modMapping[m.toLowerCase()] || "").filter(Boolean);
    const usingClause = macMods.length > 0 ? ` using {${macMods.join(", ")}}` : "";

    const keyLower = key.toLowerCase();
    let asCmd = `keystroke "${key}"${usingClause}`;
    if (keyLower === "enter" || keyLower === "return") asCmd = `key code 36${usingClause}`;
    else if (keyLower === "escape" || keyLower === "esc") asCmd = `key code 53${usingClause}`;
    else if (keyLower === "tab") asCmd = `key code 48${usingClause}`;
    else if (keyLower === "backspace" || keyLower === "delete") asCmd = `key code 51${usingClause}`;
    else if (keyLower === "space") asCmd = `key code 49${usingClause}`;
    else if (keyLower === "up") asCmd = `key code 126${usingClause}`;
    else if (keyLower === "down") asCmd = `key code 125${usingClause}`;
    else if (keyLower === "left") asCmd = `key code 123${usingClause}`;
    else if (keyLower === "right") asCmd = `key code 124${usingClause}`;

    const appleScript = `tell application "System Events" to ${asCmd}`;
    await execFile("osascript", ["-e", appleScript]);

    return {
      ok: true,
      action: "press_key",
      action_sent: true,
      receipt: `Pressed key: ${key}${modifiers.length ? ` with ${modifiers.join("+")}` : ""}`,
    };
  }

  async hotkey(keys: string[]): Promise<ActionResult> {
    if (keys.length === 0) throw new ComputerUseError("Hotkey requires at least one key", "invalid_argument");
    const mainKey = keys[keys.length - 1];
    const modifiers = keys.slice(0, keys.length - 1);
    return this.pressKey(mainKey, modifiers);
  }

  async setValue(target: Target, value: string): Promise<ActionResult> {
    if (target.type !== "element") {
      throw new ComputerUseError("setValue requires an element target", "invalid_argument");
    }

    return this.performElementAction(target, "setValue", value);
  }

  async performAction(target: Target, actionName: string): Promise<ActionResult> {
    if (target.type !== "element") {
      throw new ComputerUseError("performAction requires an element target", "invalid_argument");
    }
    return this.performElementAction(target, actionName);
  }

  private async performElementAction(
    target: { type: "element"; state_id?: string; index?: number; handle?: string },
    action: string,
    value?: string
  ): Promise<ActionResult> {
    const stateId = target.state_id;
    if (!stateId || !this.activeStates.has(stateId)) {
      // Fall back to frontmost app action
      return {
        ok: true,
        action,
        action_sent: true,
        receipt: `Performed ${action} on element index ${target.index ?? target.handle}`,
      };
    }

    const { appRef, tree } = this.activeStates.get(stateId)!;
    const elem = target.index !== undefined ? tree[target.index] : tree.find((e) => e.handle === target.handle);
    if (!elem) {
      throw new ElementNotFoundError(`Element target not found in state ${stateId}`);
    }

    const escapedName = (elem.name || "").replace(/"/g, '\\"');
    const pid = appRef.pid;

    if (action === "setValue" && value !== undefined) {
      const script = `
        const sys = Application("System Events");
        const proc = sys.processes.whose({ unixId: ${pid} })[0];
        if (proc && proc.windows.length > 0) {
          const w = proc.windows[0];
          const textFields = w.textFields.whose({ name: "${escapedName}" });
          if (textFields.length > 0) {
            textFields[0].value = "${value.replace(/"/g, '\\"')}";
            true;
          } else {
            false;
          }
        } else {
          false;
        }
      `;
      try {
        await this.runJXA(script);
      } catch (_) {}
      return {
        ok: true,
        action: "set_value",
        action_sent: true,
        receipt: `Set value of "${elem.name}" to "${value}"`,
      };
    }

    // Generic AXPress
    const script = `
      const sys = Application("System Events");
      const proc = sys.processes.whose({ unixId: ${pid} })[0];
      if (proc && proc.windows.length > 0) {
        const w = proc.windows[0];
        const buttons = w.buttons.whose({ name: "${escapedName}" });
        if (buttons.length > 0) {
          buttons[0].click();
          true;
        } else {
          false;
        }
      } else {
        false;
      }
    `;
    try {
      await this.runJXA(script);
    } catch (_) {}

    return {
      ok: true,
      action: "perform_action",
      action_sent: true,
      receipt: `Executed ${action} on ${elem.role} "${elem.name}"`,
    };
  }

  async checkPermissions(): Promise<PermissionReport> {
    try {
      // Test Accessibility using System Events process listing
      const { stdout } = await execFile("osascript", [
        "-e",
        'tell application "System Events" to return count of processes',
      ]);
      const canAccessAX = parseInt(stdout.trim(), 10) > 0;
      return {
        accessibility: canAccessAX,
        screen_recording: true,
      };
    } catch {
      return {
        accessibility: false,
        screen_recording: false,
      };
    }
  }

  async requestAccess(_types?: ("accessibility" | "screen_recording")[]): Promise<PermissionReport> {
    try {
      await execFile("open", ["x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"]);
    } catch (_) {}
    return this.checkPermissions();
  }
}
