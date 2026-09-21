# Troubleshooting & Common Issues

This guide addresses recurring issues, recovery protocols, and common diagnostic paths.

---

## 1. Permission Denied Errors (`permission_denied`)

### Symptoms
`cua doctor` shows:
```
[FAIL] Accessibility Permission: Not Granted / Untrusted
```
Or tool calls fail with: `Permission denied: Not authorized to send Apple events`.

### Fix
1. Open **System Settings > Privacy & Security > Accessibility**.
2. Locate your terminal app (Terminal, iTerm2, VS Code, or Antigravity) and ensure it is toggled **ON**.
3. If it is already on, toggle it **OFF** and then **ON** again (macOS TCC database sometimes caches stale process identities).
4. Run `cua doctor` to verify.

---

## 2. Stale Element Handle (`stale_handle`)

### Symptoms
Action fails with:
```json
{
  "error": "Stale element handle: 'h_button_a1b2c3' is no longer valid. The UI has changed.",
  "code": "stale_handle",
  "recoverable": true
}
```

### Cause
The application refreshed its layout or switched views between observation and action.

### Recovery
1. Call `get_app_state(app_ref, detail="compact")` once to capture the fresh UI state.
2. Select the new handle or index from the refreshed tree.
3. Re-issue the action.

---

## 3. Window Not Found (`window_not_found`)

### Symptoms
`focus_window` or `get_app_state` fails targeting a specific `window_id`.

### Recovery
Run `list_windows({ app_ref: { name: "..." } })` to obtain active window IDs. On macOS, closed dialogs or minimized windows drop their active IDs.
