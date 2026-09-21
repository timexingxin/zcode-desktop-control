import { createInterface } from "node:readline";
import {
  type PlatformAdapter,
  AmbiguousElementError,
  ComputerUseError,
  ElementNotFoundError,
  UnsupportedPlatformError,
  computeStateDiff,
  getPlatformCapabilities,
  reduceToCompactState,
} from "@zcode-community/core";
import { MacOSAdapter } from "@zcode-community/platform-macos";
import { WindowsAdapter } from "@zcode-community/platform-windows";
import { LinuxAdapter } from "@zcode-community/platform-linux";
import { TOOLS_MANIFEST } from "./tools-manifest.js";

export function createPlatformAdapter(): PlatformAdapter {
  switch (process.platform) {
    case "darwin":
      return new MacOSAdapter();
    case "win32":
      return new WindowsAdapter();
    case "linux":
      return new LinuxAdapter();
    default:
      return new MacOSAdapter();
  }
}

export class MCPServer {
  private adapter: PlatformAdapter;
  private lastStateMap = new Map<string, any>();
  private isControlHalted = false;

  constructor(adapter?: PlatformAdapter) {
    this.adapter = adapter || createPlatformAdapter();
  }

  getAdapter(): PlatformAdapter {
    return this.adapter;
  }

  async handleCallTool(name: string, args: Record<string, any> = {}): Promise<{
    content: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
    isError?: boolean;
  }> {
    try {
      const result = await this.dispatchTool(name, args);
      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      const isComputerUseError = err instanceof ComputerUseError;
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: err.message || String(err),
              code: isComputerUseError ? err.code : "operation_failed",
              recoverable: isComputerUseError ? err.recoverable : false,
              action_sent: isComputerUseError ? err.actionSent : false,
            }),
          },
        ],
      };
    }
  }

  private async dispatchTool(name: string, args: Record<string, any>): Promise<any> {
    if (
      this.isControlHalted &&
      name !== "stop_computer_control" &&
      name !== "get_capabilities" &&
      name !== "wait"
    ) {
      throw new ComputerUseError(
        "Computer control session was halted by kill-switch. Restart server to resume.",
        "operation_failed"
      );
    }

    switch (name) {
      // --- Capability Registry ---
      case "get_capabilities":
        return getPlatformCapabilities(this.adapter.platform);

      // --- Observation ---
      case "list_apps":
        return await this.adapter.listApps();

      case "list_windows":
        return await this.adapter.listWindows(args.app_ref);

      case "get_active_window":
        return await this.adapter.getActiveWindow();

      case "get_app_state": {
        const detail = args.detail || "compact";
        const state = await this.adapter.getAppState(args.app_ref, {
          detail: detail === "full" ? "full" : "compact",
          include_screenshot: args.include_screenshot,
        });

        const appKey = args.app_ref?.name || String(args.app_ref?.pid || "default");
        const prevState = this.lastStateMap.get(appKey);
        this.lastStateMap.set(appKey, state);

        if (detail === "compact") {
          return reduceToCompactState(state);
        } else if (detail === "diff" && prevState) {
          return computeStateDiff(prevState, state);
        }
        return state;
      }

      case "screenshot":
        return await this.adapter.takeScreenshot(args);

      case "get_screen_info":
        if (this.adapter.getScreenInfo) {
          return await this.adapter.getScreenInfo();
        }
        throw new UnsupportedPlatformError("get_screen_info", this.adapter.platform);

      // --- Pointer ---
      case "click":
      case "left_click":
        return await this.adapter.click(args.target, {
          clickCount: args.clickCount || 1,
          button: args.button || "left",
          strategy: args.strategy,
        });

      case "double_click":
        return await this.adapter.doubleClick(args.target, args);

      case "triple_click":
        return await this.adapter.click(args.target, { ...args, clickCount: 3 });

      case "right_click":
        return await this.adapter.rightClick(args.target, args);

      case "middle_click":
        return await this.adapter.click(args.target, { ...args, button: "middle" });

      case "move_pointer":
      case "mouse_move":
        return await this.adapter.movePointer(args.x, args.y);

      case "scroll":
        return await this.adapter.scroll(args);

      case "left_click_drag":
        if (this.adapter.drag) {
          return await this.adapter.drag(args.toX ?? args.x, args.toY ?? args.y, args.fromX, args.fromY);
        }
        throw new UnsupportedPlatformError("left_click_drag", this.adapter.platform);

      case "mouse_down":
      case "left_mouse_down":
        if (this.adapter.mouseDown) {
          return await this.adapter.mouseDown(args.button || "left");
        }
        throw new UnsupportedPlatformError("mouse_down", this.adapter.platform);

      case "mouse_up":
      case "left_mouse_up":
        if (this.adapter.mouseUp) {
          return await this.adapter.mouseUp(args.button || "left");
        }
        throw new UnsupportedPlatformError("mouse_up", this.adapter.platform);

      // --- Text & Keyboard ---
      case "type_text":
      case "type":
        return await this.adapter.typeText(args.text, args, args.target);

      case "press_key":
      case "key":
        return await this.adapter.pressKey(args.key, args.modifiers);

      case "hotkey":
        return await this.adapter.hotkey(args.keys || []);

      case "hold_key":
        return await this.adapter.pressKey(args.key, args.modifiers);

      case "set_value":
        return await this.adapter.setValue(args.target, args.value);

      case "select_text":
        throw new UnsupportedPlatformError("select_text", this.adapter.platform);

      // --- Window & App ---
      case "launch_app":
      case "open_application":
        return await this.adapter.launchApp(args.name, args.activate ?? true);

      case "focus_app":
        return { ok: await this.adapter.focusApp(args.app_ref) };

      case "focus_window":
        return { ok: await this.adapter.focusWindow(args.window_id) };

      case "move_window":
        return { ok: await this.adapter.moveWindow(args.window_id, args.x, args.y) };

      case "resize_window":
        return { ok: await this.adapter.resizeWindow(args.window_id, args.width, args.height) };

      case "minimize_window":
        return { ok: await this.adapter.minimizeWindow(args.window_id) };

      case "maximize_window":
        return { ok: await this.adapter.maximizeWindow(args.window_id) };

      // --- High-level ---
      case "find_element": {
        const state = await this.adapter.getAppState(args.app_ref, { detail: "compact" });
        const compact = reduceToCompactState(state);
        const match = compact.elements.find(
          (e) =>
            e.n.toLowerCase().includes(args.name.toLowerCase()) &&
            (!args.role || e.r.toLowerCase() === args.role.toLowerCase())
        );
        return match || { not_found: true, searched_name: args.name };
      }

      case "click_element": {
        const state = await this.adapter.getAppState(args.app_ref, { detail: "compact" });
        const compact = reduceToCompactState(state);
        const matches = compact.elements.filter((e) => e.n.toLowerCase().includes(args.name.toLowerCase()));
        if (matches.length === 0) throw new ElementNotFoundError(`Element "${args.name}" not found`);
        if (matches.length > 1) {
          throw new AmbiguousElementError(
            `Found ${matches.length} elements matching "${args.name}". Specify unique handle.`,
            matches
          );
        }
        const match = matches[0];
        return await this.adapter.click({
          type: "element",
          state_id: state.state_id,
          index: match.i,
          handle: match.h,
        });
      }

      case "set_element_value": {
        const state = await this.adapter.getAppState(args.app_ref, { detail: "compact" });
        const compact = reduceToCompactState(state);
        const matches = compact.elements.filter((e) => e.n.toLowerCase().includes(args.name.toLowerCase()));
        if (matches.length === 0) throw new ElementNotFoundError(`Element "${args.name}" not found`);
        if (matches.length > 1) {
          throw new AmbiguousElementError(
            `Found ${matches.length} elements matching "${args.name}". Specify unique handle.`,
            matches
          );
        }
        const match = matches[0];
        return await this.adapter.setValue(
          { type: "element", state_id: state.state_id, index: match.i, handle: match.h },
          args.value
        );
      }

      case "perform_action":
        return await this.adapter.performAction(args.target, args.action);

      // --- Safety & System ---
      case "request_access":
        return await this.adapter.requestAccess(args.types);

      case "stop_computer_control":
        this.isControlHalted = true;
        return { ok: true, action: "stop_computer_control", receipt: "Control session halted via kill-switch" };

      case "wait":
        await new Promise((r) => setTimeout(r, args.ms || 1000));
        return { ok: true, waited_ms: args.ms || 1000 };

      case "read_clipboard":
        if (this.adapter.readClipboard) {
          const text = await this.adapter.readClipboard();
          return { text };
        }
        throw new UnsupportedPlatformError("read_clipboard", this.adapter.platform);

      case "write_clipboard":
        if (this.adapter.writeClipboard) {
          await this.adapter.writeClipboard(args.text);
          return { ok: true, text: args.text };
        }
        throw new UnsupportedPlatformError("write_clipboard", this.adapter.platform);

      default:
        throw new ComputerUseError(`Tool not recognized: ${name}`, "invalid_argument");
    }
  }

  startStdio(): void {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const sendResponse = (msg: Record<string, any>) => {
      process.stdout.write(JSON.stringify(msg) + "\n");
    };

    rl.on("line", async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const req = JSON.parse(trimmed);
        const { id, method, params } = req;

        // Protocol handshake with version negotiation
        if (method === "initialize") {
          const requestedProto = params?.protocolVersion || "2024-11-05";
          const negotiatedVersion =
            requestedProto === "2026-07-28" || requestedProto >= "2025" ? "2026-07-28" : "2024-11-05";

          sendResponse({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: negotiatedVersion,
              capabilities: {
                tools: { listChanged: false },
              },
              serverInfo: {
                name: "zcode-desktop-control",
                version: "0.2.0-alpha.1",
              },
            },
          });
          return;
        }

        if (method === "notifications/initialized") {
          return;
        }

        if (method === "ping") {
          sendResponse({ jsonrpc: "2.0", id, result: {} });
          return;
        }

        // Tools listing
        if (method === "tools/list") {
          sendResponse({
            jsonrpc: "2.0",
            id,
            result: {
              tools: TOOLS_MANIFEST,
            },
          });
          return;
        }

        // Tool execution
        if (method === "tools/call") {
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};
          const result = await this.handleCallTool(toolName, toolArgs);
          sendResponse({
            jsonrpc: "2.0",
            id,
            result,
          });
          return;
        }

        // Unknown method
        if (id !== undefined) {
          sendResponse({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          });
        }
      } catch (err: any) {
        process.stderr.write(`[mcp-server] Error processing JSON-RPC: ${err.message}\n`);
      }
    });

    for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
      process.on(sig as any, () => {
        process.stderr.write(`[mcp-server] Received ${sig}, shutting down cleanly...\n`);
        process.exit(0);
      });
    }
  }
}
