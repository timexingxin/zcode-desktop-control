export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TOOLS_MANIFEST: ToolDefinition[] = [
  // --- Observation ---
  {
    name: "list_apps",
    description: "List currently running GUI desktop applications with their names, PIDs, bundle IDs, and active states.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_windows",
    description: "List available desktop windows. Optionally filter by application reference (name or PID).",
    inputSchema: {
      type: "object",
      properties: {
        app_ref: {
          type: "object",
          description: "Optional application reference filter {pid?: number, name?: string}",
          properties: {
            pid: { type: "number" },
            name: { type: "string" },
            bundle_id: { type: "string" },
          },
        },
      },
    },
  },
  {
    name: "get_active_window",
    description: "Get metadata and screen bounds for the currently focused/active desktop window.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_app_state",
    description: "Observe an application's accessibility tree. Returns state_id, window bounds, and actionable UI elements. Supports compact (default), full, and diff detail modes.",
    inputSchema: {
      type: "object",
      properties: {
        app_ref: {
          type: "object",
          description: "Application to observe (by pid, name, or bundle_id)",
          properties: {
            pid: { type: "number" },
            name: { type: "string" },
            bundle_id: { type: "string" },
            window_id: { type: "number" },
          },
          required: [],
        },
        detail: {
          type: "string",
          enum: ["compact", "diff", "full"],
          default: "compact",
          description: "Tree detail level. 'compact' flattens and keeps token usage minimal.",
        },
        include_screenshot: {
          type: "boolean",
          default: false,
          description: "Set to true only when visual raster verification is strictly required.",
        },
      },
      required: ["app_ref"],
    },
  },
  {
    name: "screenshot",
    description: "Take a full desktop or window-scoped screenshot. Returns base64 PNG data and dimensions.",
    inputSchema: {
      type: "object",
      properties: {
        window_id: { type: "number", description: "Optional specific window ID to capture" },
        display_id: { type: "number", description: "Optional display index to capture" },
      },
    },
  },
  {
    name: "get_screen_info",
    description: "Get screen resolution, display count, and scaling metadata.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  // --- Pointer & Mouse ---
  {
    name: "click",
    description: "Click a target. Can be a semantic element target or an (x, y) coordinate target.",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "object",
          description: "Target element ({type: 'element', state_id, index or handle}) or coordinate ({type: 'coordinate', x, y})",
        },
        button: { type: "string", enum: ["left", "right", "middle"], default: "left" },
        clickCount: { type: "number", default: 1 },
        strategy: { type: "string", enum: ["auto", "a11y", "event"], default: "auto" },
      },
      required: ["target"],
    },
  },
  {
    name: "left_click",
    description: "Legacy alias for click with left button.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
        clickCount: { type: "number", default: 1 },
      },
      required: ["target"],
    },
  },
  {
    name: "double_click",
    description: "Double-click an element or coordinate.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
      },
      required: ["target"],
    },
  },
  {
    name: "triple_click",
    description: "Triple-click an element or coordinate (e.g. to select an entire line).",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
      },
      required: ["target"],
    },
  },
  {
    name: "right_click",
    description: "Right-click an element or coordinate to open context menus.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
      },
      required: ["target"],
    },
  },
  {
    name: "middle_click",
    description: "Middle-click an element or coordinate.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
      },
      required: ["target"],
    },
  },
  {
    name: "move_pointer",
    description: "Move the virtual mouse cursor to coordinates (x, y).",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "mouse_move",
    description: "Legacy alias for move_pointer.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "scroll",
    description: "Scroll the view vertically or horizontally.",
    inputSchema: {
      type: "object",
      properties: {
        deltaY: { type: "number", description: "Vertical scroll amount (positive down, negative up)" },
        deltaX: { type: "number", description: "Horizontal scroll amount" },
        direction: { type: "string", enum: ["up", "down", "left", "right"] },
        target: { type: "object" },
      },
    },
  },
  {
    name: "left_click_drag",
    description: "Click and drag from current position to (x, y) coordinates.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
      },
      required: ["x", "y"],
    },
  },

  // --- Text & Keyboard ---
  {
    name: "type_text",
    description: "Type a text string into the active element or target element.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        target: { type: "object" },
        clearFirst: { type: "boolean", default: false },
      },
      required: ["text"],
    },
  },
  {
    name: "type",
    description: "Legacy alias for type_text.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        target: { type: "object" },
      },
      required: ["text"],
    },
  },
  {
    name: "press_key",
    description: "Press a keyboard key (e.g. Return, Escape, Tab, Backspace, Space, ArrowDown) with optional modifiers.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string" },
        modifiers: {
          type: "array",
          items: { type: "string" },
          description: "e.g. ['cmd'], ['ctrl'], ['alt'], ['shift']",
        },
      },
      required: ["key"],
    },
  },
  {
    name: "key",
    description: "Legacy alias for press_key.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string" },
        modifiers: { type: "array", items: { type: "string" } },
      },
      required: ["key"],
    },
  },
  {
    name: "hotkey",
    description: "Press a keyboard shortcut combination simultaneously (e.g. ['cmd', 'shift', 'g']).",
    inputSchema: {
      type: "object",
      properties: {
        keys: { type: "array", items: { type: "string" } },
      },
      required: ["keys"],
    },
  },
  {
    name: "set_value",
    description: "Semantically set the value of an editable accessibility element directly without synthetic keystrokes.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Target element ({type: 'element', state_id, index or handle})" },
        value: { type: "string" },
      },
      required: ["target", "value"],
    },
  },
  {
    name: "select_text",
    description: "Select text inside a text field or document element.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
        start: { type: "number" },
        end: { type: "number" },
      },
      required: ["target"],
    },
  },

  // --- Window & App Lifecycle ---
  {
    name: "launch_app",
    description: "Launch or activate a desktop application by name or bundle identifier.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "App name or bundle ID (e.g. 'Calculator', 'com.apple.Notes')" },
        activate: { type: "boolean", default: true },
      },
      required: ["name"],
    },
  },
  {
    name: "open_application",
    description: "Legacy alias for launch_app.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        activate: { type: "boolean", default: true },
      },
      required: ["name"],
    },
  },
  {
    name: "focus_app",
    description: "Bring a running application to the front.",
    inputSchema: {
      type: "object",
      properties: {
        app_ref: { type: "object" },
      },
      required: ["app_ref"],
    },
  },
  {
    name: "focus_window",
    description: "Bring a specific window to the foreground.",
    inputSchema: {
      type: "object",
      properties: {
        window_id: { type: "number" },
      },
      required: ["window_id"],
    },
  },
  {
    name: "move_window",
    description: "Move a window to coordinates (x, y).",
    inputSchema: {
      type: "object",
      properties: {
        window_id: { type: "number" },
        x: { type: "number" },
        y: { type: "number" },
      },
      required: ["window_id", "x", "y"],
    },
  },
  {
    name: "resize_window",
    description: "Resize a window to specific width and height.",
    inputSchema: {
      type: "object",
      properties: {
        window_id: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
      },
      required: ["window_id", "width", "height"],
    },
  },
  {
    name: "minimize_window",
    description: "Minimize a window.",
    inputSchema: {
      type: "object",
      properties: {
        window_id: { type: "number" },
      },
      required: ["window_id"],
    },
  },
  {
    name: "maximize_window",
    description: "Maximize or fullscreen a window.",
    inputSchema: {
      type: "object",
      properties: {
        window_id: { type: "number" },
      },
      required: ["window_id"],
    },
  },

  // --- High-Level & Semantic ---
  {
    name: "find_element",
    description: "Search for a UI element by name, role, or partial label in an app state.",
    inputSchema: {
      type: "object",
      properties: {
        app_ref: { type: "object" },
        name: { type: "string" },
        role: { type: "string" },
      },
      required: ["app_ref", "name"],
    },
  },
  {
    name: "click_element",
    description: "Convenience tool to find and click an element by name in one operation.",
    inputSchema: {
      type: "object",
      properties: {
        app_ref: { type: "object" },
        name: { type: "string" },
        role: { type: "string" },
      },
      required: ["app_ref", "name"],
    },
  },
  {
    name: "set_element_value",
    description: "Convenience tool to find an editable element by name and set its text value.",
    inputSchema: {
      type: "object",
      properties: {
        app_ref: { type: "object" },
        name: { type: "string" },
        value: { type: "string" },
      },
      required: ["app_ref", "name", "value"],
    },
  },
  {
    name: "perform_action",
    description: "Trigger a named accessibility action on a target element (e.g. AXPress, AXConfirm, AXShowMenu).",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
        action: { type: "string" },
      },
      required: ["target", "action"],
    },
  },

  // --- Safety & Control ---
  {
    name: "request_access",
    description: "Check desktop automation permissions (Accessibility and Screen Recording) and request onboarding if denied.",
    inputSchema: {
      type: "object",
      properties: {
        types: {
          type: "array",
          items: { type: "string", enum: ["accessibility", "screen_recording"] },
        },
      },
    },
  },
  {
    name: "stop_computer_control",
    description: "Emergency kill switch: immediately ceases active automated control sessions.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "wait",
    description: "Pause execution for a specified duration in milliseconds.",
    inputSchema: {
      type: "object",
      properties: {
        ms: { type: "number", default: 1000 },
      },
    },
  },
  {
    name: "read_clipboard",
    description: "Read plain text currently stored in the system clipboard.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "write_clipboard",
    description: "Write text into the system clipboard.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
      },
      required: ["text"],
    },
  },
  {
    name: "get_capabilities",
    description: "Query runtime feature support and platform capability registry (Zero Fake-Success contract).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];
