import { execFile as execFileCallback, spawn } from "node:child_process";
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
  AmbiguousElementError,
  AppNotFoundError,
  ComputerUseError,
  ElementNotFoundError,
  StaleHandleError,
  assignHandlesToTree,
  resolveElementWithAmbiguity,
} from "@zcode-community/core";

const execFile = promisify(execFileCallback);

export class MacOSAdapter implements PlatformAdapter {
  readonly platform = "darwin" as const;
  readonly status = "partial" as const;

  private activeStates = new Map<string, { appRef: AppRef; tree: UIElement[] }>();

  /**
   * Executes JavaScript for Automation (JXA) with JSON input/output.
   */
  private async runJXA<T>(script: string): Promise<T> {
    try {
      const { stdout } = await execFile("osascript", ["-l", "JavaScript", "-e", script]);
      const trimmed = stdout.trim();
      if (!trimmed) return undefined as unknown as T;
      return JSON.parse(trimmed);
    } catch (err: any) {
      throw new ComputerUseError(`JXA execution failed: ${err.message}`, "operation_failed");
    }
  }

  async listApps(): Promise<AppInfo[]> {
    const script = `
      const sys = Application("System Events");
      const procs = sys.processes();
      const results = [];
      for (let i = 0; i < procs.length; i++) {
        const p = procs[i];
        try {
          const bg = p.backgroundOnly();
          if (!bg) {
            results.push({
              pid: p.unixId(),
              name: p.name(),
              bundle_id: p.bundleIdentifier ? p.bundleIdentifier() : undefined,
              active: p.frontmost(),
              windows_count: p.windows.length
            });
          }
        } catch (_) {}
      }
      JSON.stringify(results);
    `;
    return this.runJXA<AppInfo[]>(script);
  }

  async listWindows(appRef?: AppRef): Promise<WindowInfo[]> {
    const script = `
      ObjC.import("CoreGraphics");
      const raw = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements, 0);
      const nsArr = ObjC.castRefToObject(raw);
      const count = nsArr.count;
      const results = [];
      
      for (let i = 0; i < count; i++) {
        const item = nsArr.objectAtIndex(i);
        const pid = ObjC.unwrap(item.objectForKey("kCGWindowOwnerPID"));
        const owner = ObjC.unwrap(item.objectForKey("kCGWindowOwnerName")) || "";
        const title = ObjC.unwrap(item.objectForKey("kCGWindowName")) || "";
        const wid = ObjC.unwrap(item.objectForKey("kCGWindowNumber"));
        const b = item.objectForKey("kCGWindowBounds");
        
        let bounds = { x: 0, y: 0, width: 0, height: 0 };
        if (b) {
          bounds = {
            x: Math.round(ObjC.unwrap(b.objectForKey("X")) || 0),
            y: Math.round(ObjC.unwrap(b.objectForKey("Y")) || 0),
            width: Math.round(ObjC.unwrap(b.objectForKey("Width")) || 0),
            height: Math.round(ObjC.unwrap(b.objectForKey("Height")) || 0)
          };
        }

        // Filter out zero-size windows or background helper overlays
        if (bounds.width > 10 && bounds.height > 10) {
          results.push({
            id: wid,
            pid: pid,
            title: title,
            app_name: owner,
            bounds: bounds,
            is_minimized: false,
            is_focused: i === 0
          });
        }
      }
      JSON.stringify(results);
    `;

    const windows = await this.runJXA<WindowInfo[]>(script);
    if (appRef?.pid) {
      return windows.filter((w) => w.pid === appRef.pid);
    }
    if (appRef?.name) {
      const lower = appRef.name.toLowerCase();
      return windows.filter((w) => w.app_name.toLowerCase().includes(lower));
    }
    return windows;
  }

  async getActiveWindow(): Promise<WindowInfo | null> {
    const windows = await this.listWindows();
    return windows[0] || null;
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
      if (!proc) {
        JSON.stringify({ elements: [] });
      } else {
        function inspectNode(uiElem, depth) {
          if (depth > 6) return null;
          try {
            const role = uiElem.role() || "unknown";
            let subrole = undefined;
            try { subrole = uiElem.subrole ? uiElem.subrole() : undefined; } catch (_) {}
            
            let identifier = undefined;
            try { identifier = uiElem.identifier ? uiElem.identifier() : undefined; } catch (_) {}

            const name = uiElem.name() || uiElem.title() || "";
            let val = undefined;
            try {
              const rawVal = uiElem.value();
              if (rawVal !== null && rawVal !== undefined) val = String(rawVal);
            } catch (_) {}

            let bounds = undefined;
            try {
              const pos = uiElem.position();
              const sz = uiElem.size();
              bounds = { x: Math.round(pos[0]), y: Math.round(pos[1]), width: Math.round(sz[0]), height: Math.round(sz[1]) };
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

            let enabled = true;
            try { enabled = uiElem.enabled ? uiElem.enabled() : true; } catch (_) {}
            let focused = false;
            try { focused = uiElem.focused ? uiElem.focused() : false; } catch (_) {}

            let children = [];
            try {
              const rawChildren = uiElem.uiElements ? uiElem.uiElements() : [];
              for (let c of rawChildren) {
                const childNode = inspectNode(c, depth + 1);
                if (childNode) children.push(childNode);
              }
            } catch (_) {}

            return {
              role: role.replace(/^AX/, "").toLowerCase(),
              subrole: subrole ? subrole.replace(/^AX/, "").toLowerCase() : undefined,
              identifier: identifier,
              name: name,
              value: val,
              bounds: bounds,
              enabled: enabled,
              focused: focused,
              capabilities: caps,
              actions: acts,
              children: children.length > 0 ? children : undefined
            };
          } catch (_) {
            return null;
          }
        }

        const wins = proc.windows();
        const rootElements = [];
        for (let w of wins) {
          const wNode = inspectNode(w, 0);
          if (wNode) rootElements.push(wNode);
        }
        JSON.stringify({ elements: rootElements });
      }
    `;

    const data = await this.runJXA<{ elements: any[] }>(script);
    const windowId = appRef.window_id ?? resolvedApp.pid;
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

      let width = 1920;
      let height = 1080;
      // Parse real PNG dimensions from IHDR chunk (bytes 16..24)
      if (
        buffer.length >= 24 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        width = buffer.readUInt32BE(16);
        height = buffer.readUInt32BE(20);
      }

      return {
        base64: buffer.toString("base64"),
        width,
        height,
      };
    } catch (err: any) {
      await unlink(tempFile).catch(() => {});
      throw new ComputerUseError(`Failed to take screenshot: ${err.message}`, "operation_failed");
    }
  }

  async getScreenInfo(): Promise<{
    displays: number;
    main_display: { width: number; height: number; scale: number };
    platform: string;
  }> {
    const script = `
      ObjC.import("CoreGraphics");
      ObjC.import("AppKit");
      const mainDisp = $.CGMainDisplayID();
      const w = $.CGDisplayPixelsWide(mainDisp);
      const h = $.CGDisplayPixelsHigh(mainDisp);
      const scale = $.NSScreen.mainScreen ? $.NSScreen.mainScreen.backingScaleFactor : 2;
      
      let maxDisplays = 16;
      let displayList = $.malloc(maxDisplays * 4);
      let countRef = $.Ref();
      $.CGGetActiveDisplayList(maxDisplays, displayList, countRef);
      const displayCount = countRef[0] || 1;

      JSON.stringify({
        displays: displayCount,
        main_display: { width: w, height: h, scale: scale },
        platform: "darwin"
      });
    `;
    return this.runJXA(script);
  }

  async launchApp(nameOrBundleId: string, activate = true): Promise<AppInfo> {
    const flag = nameOrBundleId.includes(".") ? "-b" : "-a";
    await execFile("open", [flag, nameOrBundleId]);
    await new Promise((r) => setTimeout(r, 600));

    if (activate) {
      const script = `
        const sys = Application("System Events");
        const app = Application("${nameOrBundleId}");
        app.activate();
      `;
      await this.runJXA(script).catch(() => {});
    }

    const apps = await this.listApps();
    const app = apps.find(
      (a) =>
        a.name.toLowerCase() === nameOrBundleId.toLowerCase() ||
        a.bundle_id?.toLowerCase() === nameOrBundleId.toLowerCase()
    );
    return app || { pid: 0, name: nameOrBundleId, active: true };
  }

  async focusApp(appRef: AppRef): Promise<boolean> {
    const identifier = appRef.bundle_id || appRef.name;
    if (!identifier) return false;
    const script = `
      const app = Application("${identifier}");
      app.activate();
      true;
    `;
    return this.runJXA<boolean>(script).catch(() => false);
  }

  async focusWindow(windowId: number): Promise<boolean> {
    const script = `
      ObjC.import("CoreGraphics");
      ObjC.import("AppKit");
      const raw = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly, 0);
      const nsArr = ObjC.castRefToObject(raw);
      for (let i = 0; i < nsArr.count; i++) {
        const item = nsArr.objectAtIndex(i);
        if (ObjC.unwrap(item.objectForKey("kCGWindowNumber")) === ${windowId}) {
          const pid = ObjC.unwrap(item.objectForKey("kCGWindowOwnerPID"));
          const sys = Application("System Events");
          const proc = sys.processes.whose({ unixId: pid })[0];
          if (proc) {
            proc.frontmost = true;
            return true;
          }
        }
      }
      false;
    `;
    return this.runJXA<boolean>(script).catch(() => false);
  }

  async moveWindow(_windowId: number, x: number, y: number): Promise<boolean> {
    const script = `
      const sys = Application("System Events");
      const procs = sys.processes();
      for (let p of procs) {
        try {
          const wins = p.windows();
          if (wins.length > 0) {
            wins[0].position = [${x}, ${y}];
            return true;
          }
        } catch (_) {}
      }
      false;
    `;
    return this.runJXA<boolean>(script).catch(() => false);
  }

  async resizeWindow(_windowId: number, width: number, height: number): Promise<boolean> {
    const script = `
      const sys = Application("System Events");
      const procs = sys.processes();
      for (let p of procs) {
        try {
          const wins = p.windows();
          if (wins.length > 0) {
            wins[0].size = [${width}, ${height}];
            return true;
          }
        } catch (_) {}
      }
      false;
    `;
    return this.runJXA<boolean>(script).catch(() => false);
  }

  async minimizeWindow(_windowId: number): Promise<boolean> {
    const script = `
      const sys = Application("System Events");
      const front = sys.processes.whose({ frontmost: true })[0];
      if (front && front.windows.length > 0) {
        front.windows[0].miniaturized = true;
        true;
      } else {
        false;
      }
    `;
    return this.runJXA<boolean>(script).catch(() => false);
  }

  async maximizeWindow(_windowId: number): Promise<boolean> {
    const script = `
      const sys = Application("System Events");
      const front = sys.processes.whose({ frontmost: true })[0];
      if (front && front.windows.length > 0) {
        const btn = front.windows[0].buttons.whose({ subrole: "AXZoomButton" })[0];
        if (btn) {
          btn.click();
          true;
        } else {
          false;
        }
      } else {
        false;
      }
    `;
    return this.runJXA<boolean>(script).catch(() => false);
  }

  async movePointer(x: number, y: number): Promise<ActionResult> {
    const script = `
      ObjC.import("CoreGraphics");
      const pt = $.CGPointMake(${x}, ${y});
      const ev = $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, pt, $.kCGMouseButtonLeft);
      $.CGEventPost($.kCGHIDEventTap, ev);
      true;
    `;
    await this.runJXA(script);
    return {
      ok: true,
      action: "move_pointer",
      action_sent: true,
      receipt: `Dispatched CoreGraphics mouse move to (${x}, ${y})`,
    };
  }

  async click(target: Target, options: ClickOptions = {}): Promise<ActionResult> {
    const button = options.button || "left";
    const clickCount = options.clickCount || 1;

    let targetX = 0;
    let targetY = 0;

    if (target.type === "coordinate") {
      targetX = target.x;
      targetY = target.y;
    } else if (target.type === "element") {
      const stateId = target.state_id;
      if (!stateId || !this.activeStates.has(stateId)) {
        throw new StaleHandleError(target.handle ?? target.index ?? "unknown", stateId);
      }
      const { tree } = this.activeStates.get(stateId)!;
      const resolved = resolveElementWithAmbiguity(tree, target);
      if (resolved.ambiguous) {
        throw new AmbiguousElementError(
          `Target matched ${resolved.count} elements. Specify a unique handle or AXIdentifier.`,
          []
        );
      }
      if (!resolved.element) {
        throw new ElementNotFoundError(`Element target not found: ${target.handle ?? target.index}`);
      }

      const elem = resolved.element;
      if (elem.bounds && elem.bounds.width > 0 && elem.bounds.height > 0) {
        targetX = Math.round(elem.bounds.x + elem.bounds.width / 2);
        targetY = Math.round(elem.bounds.y + elem.bounds.height / 2);
      } else {
        // Fall back to AXPress action
        return this.performElementAction(target, "AXPress");
      }
    }

    // CoreGraphics Real Event Click
    const script = `
      ObjC.import("CoreGraphics");
      const pt = $.CGPointMake(${targetX}, ${targetY});
      let downType = $.kCGEventLeftMouseDown;
      let upType = $.kCGEventLeftMouseUp;
      let btn = $.kCGMouseButtonLeft;

      if ("${button}" === "right") {
        downType = $.kCGEventRightMouseDown;
        upType = $.kCGEventRightMouseUp;
        btn = $.kCGMouseButtonRight;
      } else if ("${button}" === "middle") {
        downType = $.kCGEventOtherMouseDown;
        upType = $.kCGEventOtherMouseUp;
        btn = $.kCGMouseButtonCenter;
      }

      const downEv = $.CGEventCreateMouseEvent(null, downType, pt, btn);
      const upEv = $.CGEventCreateMouseEvent(null, upType, pt, btn);
      if (${clickCount} > 1) {
        $.CGEventSetIntegerValueField(downEv, $.kCGMouseEventClickState, ${clickCount});
        $.CGEventSetIntegerValueField(upEv, $.kCGMouseEventClickState, ${clickCount});
      }
      $.CGEventPost($.kCGHIDEventTap, downEv);
      $.CGEventPost($.kCGHIDEventTap, upEv);
      true;
    `;
    await this.runJXA(script);

    return {
      ok: true,
      action: "click",
      action_sent: true,
      receipt: `Dispatched CoreGraphics ${button} click (${clickCount}x) at (${targetX}, ${targetY})`,
      target,
    };
  }

  async doubleClick(target: Target, options: ClickOptions = {}): Promise<ActionResult> {
    return this.click(target, { ...options, clickCount: 2 });
  }

  async tripleClick(target: Target, options: ClickOptions = {}): Promise<ActionResult> {
    return this.click(target, { ...options, clickCount: 3 });
  }

  async rightClick(target: Target, options: ClickOptions = {}): Promise<ActionResult> {
    return this.click(target, { ...options, button: "right" });
  }

  async mouseDown(button: "left" | "right" | "middle" = "left"): Promise<ActionResult> {
    const script = `
      ObjC.import("CoreGraphics");
      const pos = $.CGEventGetLocation($.CGEventCreate(null));
      let downType = $.kCGEventLeftMouseDown;
      let btn = $.kCGMouseButtonLeft;
      if ("${button}" === "right") {
        downType = $.kCGEventRightMouseDown;
        btn = $.kCGMouseButtonRight;
      } else if ("${button}" === "middle") {
        downType = $.kCGEventOtherMouseDown;
        btn = $.kCGMouseButtonCenter;
      }
      const ev = $.CGEventCreateMouseEvent(null, downType, pos, btn);
      $.CGEventPost($.kCGHIDEventTap, ev);
      true;
    `;
    await this.runJXA(script);
    return {
      ok: true,
      action: "mouse_down",
      action_sent: true,
      receipt: `Dispatched CoreGraphics mouse_down (${button})`,
    };
  }

  async mouseUp(button: "left" | "right" | "middle" = "left"): Promise<ActionResult> {
    const script = `
      ObjC.import("CoreGraphics");
      const pos = $.CGEventGetLocation($.CGEventCreate(null));
      let upType = $.kCGEventLeftMouseUp;
      let btn = $.kCGMouseButtonLeft;
      if ("${button}" === "right") {
        upType = $.kCGEventRightMouseUp;
        btn = $.kCGMouseButtonRight;
      } else if ("${button}" === "middle") {
        upType = $.kCGEventOtherMouseUp;
        btn = $.kCGMouseButtonCenter;
      }
      const ev = $.CGEventCreateMouseEvent(null, upType, pos, btn);
      $.CGEventPost($.kCGHIDEventTap, ev);
      true;
    `;
    await this.runJXA(script);
    return {
      ok: true,
      action: "mouse_up",
      action_sent: true,
      receipt: `Dispatched CoreGraphics mouse_up (${button})`,
    };
  }

  async drag(toX: number, toY: number, fromX?: number, fromY?: number): Promise<ActionResult> {
    if (fromX !== undefined && fromY !== undefined) {
      await this.movePointer(fromX, fromY);
    }
    const script = `
      ObjC.import("CoreGraphics");
      const startPos = $.CGEventGetLocation($.CGEventCreate(null));
      const endPos = $.CGPointMake(${toX}, ${toY});

      const down = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, startPos, $.kCGMouseButtonLeft);
      const drag = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDragged, endPos, $.kCGMouseButtonLeft);
      const up = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, endPos, $.kCGMouseButtonLeft);

      $.CGEventPost($.kCGHIDEventTap, down);
      $.CGEventPost($.kCGHIDEventTap, drag);
      $.CGEventPost($.kCGHIDEventTap, up);
      true;
    `;
    await this.runJXA(script);
    return {
      ok: true,
      action: "left_click_drag",
      action_sent: true,
      receipt: `Dragged pointer to (${toX}, ${toY})`,
    };
  }

  async scroll(options: ScrollOptions): Promise<ActionResult> {
    const deltaY = options.deltaY ?? (options.direction === "up" ? -100 : options.direction === "down" ? 100 : 0);
    const deltaX = options.deltaX ?? (options.direction === "left" ? -100 : options.direction === "right" ? 100 : 0);

    const script = `
      ObjC.import("CoreGraphics");
      const ev = $.CGEventCreateScrollWheelEvent2(null, $.kCGScrollEventUnitPixel, 2, ${deltaY}, ${deltaX}, 0);
      $.CGEventPost($.kCGHIDEventTap, ev);
      true;
    `;
    await this.runJXA(script);
    return {
      ok: true,
      action: "scroll",
      action_sent: true,
      receipt: `Dispatched CoreGraphics scroll: deltaY=${deltaY}, deltaX=${deltaX}`,
    };
  }

  async typeText(text: string, _options?: TypeOptions, target?: Target): Promise<ActionResult> {
    if (target) {
      await this.click(target);
      await new Promise((r) => setTimeout(r, 100));
    }

    const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const appleScript = `tell application "System Events" to keystroke "${escaped}"`;
    await execFile("osascript", ["-e", appleScript]);

    return {
      ok: true,
      action: "type_text",
      action_sent: true,
      receipt: `Typed ${text.length} characters`,
      target,
    };
  }

  async pressKey(key: string, modifiers: string[] = []): Promise<ActionResult> {
    const macMods = modifiers
      .map((m) => {
        const l = m.toLowerCase();
        if (l === "command" || l === "cmd") return "command down";
        if (l === "control" || l === "ctrl") return "control down";
        if (l === "alt" || l === "option") return "option down";
        if (l === "shift") return "shift down";
        return null;
      })
      .filter(Boolean);

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
      throw new StaleHandleError(target.handle ?? target.index ?? "unknown", stateId);
    }

    const { appRef, tree } = this.activeStates.get(stateId)!;
    const resolved = resolveElementWithAmbiguity(tree, target);
    if (resolved.ambiguous) {
      throw new AmbiguousElementError(
        `Target matched ${resolved.count} elements. Action rejected to prevent unintended side effects.`,
        []
      );
    }
    if (!resolved.element) {
      throw new ElementNotFoundError(`Element target not found in state ${stateId}`);
    }

    const elem = resolved.element;
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
            throw new Error("TextField '${escapedName}' not found in front window");
          }
        } else {
          throw new Error("No process or window found for pid ${pid}");
        }
      `;
      await this.runJXA(script);
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
          throw new Error("Element '${escapedName}' not found in front window");
        }
      } else {
        throw new Error("No process or window found for pid ${pid}");
      }
    `;
    await this.runJXA(script);

    return {
      ok: true,
      action: "perform_action",
      action_sent: true,
      receipt: `Executed ${action} on ${elem.role} "${elem.name}"`,
    };
  }

  async readClipboard(): Promise<string> {
    const { stdout } = await execFile("pbpaste", []);
    return stdout;
  }

  async writeClipboard(text: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const child = spawn("pbcopy");
      child.stdin.write(text, "utf8");
      child.stdin.end();
      child.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new ComputerUseError(`pbcopy exited with code ${code}`, "operation_failed"));
      });
      child.on("error", (err) => reject(new ComputerUseError(`pbcopy failed: ${err.message}`, "operation_failed")));
    });
  }

  async checkPermissions(): Promise<PermissionReport> {
    try {
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
