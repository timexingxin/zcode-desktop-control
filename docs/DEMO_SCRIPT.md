# Demo Recording Script (30–60s)

A step-by-step walkthrough to record a high-impact, professional demonstration of `zcode-desktop-control` operating safely without stealing user focus.

---

## Target Scenario: Safe Calculator Automation

Target Application: **macOS Calculator (计算器)**  
Risk Level: **Zero** (no personal data, credentials, or network exposure).

---

## Timeline & Narration Script

### [0:00 - 0:10] Preflight & Doctor Verification
1. Open Terminal in the `zcode-desktop-control` workspace.
2. Run:
   ```bash
   pnpm doctor
   ```
3. Highlight the green `[PASS]` marks verifying Node.js, macOS Accessibility, and 40 MCP tools registered.

### [0:10 - 0:25] App Discovery & Semantic Observation
1. Launch Calculator in background:
   ```bash
   open -a Calculator
   ```
2. Query active state via CLI or MCP inspector:
   ```bash
   node packages/cli/bin/cua.mjs list-apps
   ```
3. Show that `Calculator` is detected with PID and window coordinates.

### [0:25 - 0:45] Semantic Element Interaction
1. Demonstrate semantic click on Calculator buttons:
   - Click "7" button semantically via Accessibility (no cursor movement).
   - Click "+" button.
   - Click "5" button.
   - Click "=" button.
2. Observe result: Display updates to `12`.
3. Highlight that the user's physical mouse remained still and user was free to type in another window.

### [0:45 - 0:60] Clean Exit & Kill Switch
1. Call `stop_computer_control` or close Calculator.
2. End on project GitHub link: `https://github.com/timexingxin/zcode-desktop-control`.
