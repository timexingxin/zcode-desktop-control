# Computer Use MCP Tools Reference

`zcode-desktop-control` exposes 30+ standardized tools through the Model Context Protocol (MCP).

---

## Tool Status Classification

- **Stable**: Fully supported, production-tested, fail-safe.
- **Experimental**: Functionally available; cross-platform nuances may apply.
- **Unsupported**: Not supported on the target platform.

---

## 1. Observation Tools

| Tool | Status | Description | Key Parameters |
| :--- | :---: | :--- | :--- |
| `list_apps` | **Stable** | Lists all running desktop applications. | `{}` |
| `list_windows` | **Stable** | Lists windows across desktop or filtered by app. | `app_ref?: { pid, name }` |
| `get_active_window` | **Stable** | Returns current frontmost window info. | `{}` |
| `get_app_state` | **Stable** | Accessibility tree snapshot with stable handles. | `app_ref`, `detail?: "compact"\|"diff"\|"full"`, `include_screenshot?: bool` |
| `screenshot` | **Stable** | Captures desktop or window PNG. | `window_id?: number`, `display_id?: number` |
| `get_screen_info` | **Stable** | Returns screen resolution and display metrics. | `{}` |

---

## 2. Interaction Tools

| Tool | Status | Description | Key Parameters |
| :--- | :---: | :--- | :--- |
| `click` | **Stable** | Clicks element target or coordinate target. | `target: Target`, `button?: string`, `clickCount?: number` |
| `double_click` | **Stable** | Convenience tool for double-clicking. | `target: Target` |
| `triple_click` | **Stable** | Convenience tool for triple-clicking. | `target: Target` |
| `right_click` | **Stable** | Context menu click. | `target: Target` |
| `middle_click` | **Stable** | Middle mouse click. | `target: Target` |
| `move_pointer` | **Stable** | Moves mouse cursor to `(x, y)`. | `x: number`, `y: number` |
| `scroll` | **Stable** | Scrolls vertically or horizontally. | `deltaY?: number`, `direction?: string`, `target?: Target` |
| `type_text` | **Stable** | Types text string into target or focused field. | `text: string`, `target?: Target`, `clearFirst?: bool` |
| `press_key` | **Stable** | Presses a single keyboard key with modifiers. | `key: string`, `modifiers?: string[]` |
| `hotkey` | **Stable** | Simultaneous chord shortcut. | `keys: string[]` (e.g. `["cmd", "shift", "g"]`) |
| `set_value` | **Stable** | Instant semantic value setting on editable element. | `target: ElementTarget`, `value: string` |
| `select_text` | **Stable** | Selects text range inside element. | `target: ElementTarget`, `start?: number`, `end?: number` |

---

## 3. Window & Application Lifecycle

| Tool | Status | Description | Key Parameters |
| :--- | :---: | :--- | :--- |
| `launch_app` | **Stable** | Launches or brings application to foreground. | `name: string`, `activate?: boolean` |
| `focus_app` | **Stable** | Focuses existing application. | `app_ref: AppRef` |
| `focus_window` | **Stable** | Raises specific window. | `window_id: number` |
| `move_window` | **Stable** | Relocates window to `(x, y)`. | `window_id: number`, `x: number`, `y: number` |
| `resize_window` | **Stable** | Resizes window dimensions. | `window_id: number`, `width: number`, `height: number` |
| `minimize_window`| **Stable** | Minimizes window. | `window_id: number` |
| `maximize_window`| **Stable** | Fullscreen / maximizes window. | `window_id: number` |

---

## 4. Semantic & High-Level Helpers

| Tool | Status | Description | Key Parameters |
| :--- | :---: | :--- | :--- |
| `find_element` | **Stable** | Looks up element by label or role in app tree. | `app_ref: AppRef`, `name: string`, `role?: string` |
| `click_element` | **Stable** | Finds and clicks an element by name in 1 turn. | `app_ref: AppRef`, `name: string` |
| `set_element_value` | **Stable** | Finds and sets value of an element by name in 1 turn. | `app_ref: AppRef`, `name: string`, `value: string` |
| `perform_action` | **Stable** | Triggers named AX action (`AXPress`, `AXConfirm`). | `target: ElementTarget`, `action: string` |

---

## 5. Safety, System & Clipboard

| Tool | Status | Description | Key Parameters |
| :--- | :---: | :--- | :--- |
| `request_access` | **Stable** | Diagnoses OS permissions (Accessibility/Screen). | `types?: string[]` |
| `stop_computer_control`| **Stable**| Emergency Kill Switch halting automation sessions. | `{}` |
| `wait` | **Stable** | Pauses execution for `ms` milliseconds. | `ms: number` (default 1000) |
| `read_clipboard` | **Stable** | Reads plain text from OS clipboard. | `{}` |
| `write_clipboard`| **Stable** | Writes text to OS clipboard. | `text: string` |

---

## Legacy Aliases (100% Backward Compatible)

To ensure existing workflows work without breaking changes, the following aliases are automatically mapped:
- `left_click` → `click`
- `mouse_move` → `move_pointer`
- `open_application` → `launch_app`
- `type` → `type_text`
- `key` → `press_key`
- `left_mouse_down` → `mouse_down`
- `left_mouse_up` → `mouse_up`
