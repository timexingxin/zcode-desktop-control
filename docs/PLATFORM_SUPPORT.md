# Platform Support Matrix

In adherence to truth-in-advertising and strict evidence criteria, the following matrix documents the exact verified operational status across platforms.

---

## 1. Operating System Support Matrix

| Platform & Architecture | Automation Mechanism | Status | Tested OS / Environment | Verification Evidence |
| :--- | :--- | :---: | :--- | :--- |
| **macOS (Apple Silicon arm64)** | Accessibility (AX), System Events, CoreGraphics | **Tested & Verified** | macOS Sequoia (15.x) | Live smoke test passed; Accessibility & Screen Recording validated. |
| **macOS (Intel x64)** | Accessibility (AX), System Events, CoreGraphics | **Supported (Expected)** | macOS Sonoma / Sequoia | Architecture-agnostic scripts; unverified on physical Intel hardware. |
| **Windows (x64)** | UI Automation (UIA) & PowerShell CLI | **Architecturally Prepared** | Windows 11 | Structural adapter and smoke tests in place; pending native hardware verification. |
| **Windows (arm64)** | UI Automation (UIA) & PowerShell CLI | **Unknown** | Windows 11 on ARM | Untested. |
| **Linux (X11)** | AT-SPI2 / X11 | **Experimental** | Ubuntu 22.04 LTS / 24.04 | Architecture stub in place; headless CI only. |
| **Linux (Wayland)** | AT-SPI2 / Portal | **Experimental / Limited** | Fedora / GNOME Wayland | Wayland security boundaries restrict global synthetic events without portal prompts. |

---

## 2. macOS Permissions Onboarding

Running on macOS requires two explicit user grants in **System Settings > Privacy & Security**:
1. **Accessibility**: Allows reading UI element trees and dispatching semantic AX actions.
2. **Screen Recording**: Allows capturing window and display screenshots via `screencapture`.

Run `cua doctor` at any time to verify current permission grants.
