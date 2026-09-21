# Platform Support & Operational Matrix
> **Policy**: **Truthfulness > Tool Count**. No synthetic or unexecuted receipts.

---

## 1. Operating System Status

| Platform & Architecture | Automation Mechanism | Status | Zero Fake-Success Guarantee | Verification Evidence |
| :--- | :--- | :---: | :--- | :--- |
| **macOS (Apple Silicon arm64)** | Native AX, CoreGraphics, screencapture | **VERIFIED** | Real OS events; verified via TextEdit GUI E2E | macOS Sequoia 15.x live tests passed. |
| **macOS (Intel x64)** | Native AX, CoreGraphics, screencapture | **VERIFIED** | Real OS events | Cross-architecture compatibility verified. |
| **Windows (x64)** | Windows UI Automation & PowerShell | **EXPERIMENTAL** | Unverified actions throw `UnsupportedPlatformError` | Type definitions and skeleton contracts. |
| **Linux (X11 / Wayland)** | AT-SPI2 / Portal | **EXPERIMENTAL** | Unverified actions throw `UnsupportedPlatformError` | Type definitions and skeleton contracts. |

See [`docs/CAPABILITY_MATRIX.md`](CAPABILITY_MATRIX.md) for the exhaustive tool-by-tool breakdown across all 41 tools.

---

## 2. macOS Permissions Onboarding

Running on macOS requires two explicit user grants in **System Settings > Privacy & Security**:
1. **Accessibility**: Allows reading UI element trees and dispatching semantic AX actions.
2. **Screen Recording**: Allows capturing window and display screenshots via `screencapture`.

Run `cua doctor` at any time to verify current permission grants.
