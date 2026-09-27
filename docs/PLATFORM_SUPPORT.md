# Platform Support & Operational Matrix
> **Policy**: **Truthfulness > Tool Count**. No synthetic or unexecuted receipts.

---

## 1. Operating System Status

| Platform & Architecture | Automation Mechanism | Status | Zero Fake-Success Guarantee | Verification Evidence |
| :--- | :--- | :---: | :--- | :--- |
| **macOS (Apple Silicon arm64)** | Native AX, CoreGraphics, screencapture | **IMPLEMENTED**; TextEdit file workflow VERIFIED | Real TextEdit E2E is a separate gate | Local physical E2E passed for AX observation, typing, save, and clipboard; other native actions lack physical assertions. |
| **macOS (Intel x64)** | Native AX, CoreGraphics, screencapture | **IMPLEMENTED** | Real OS events require a physical test | CI build and unit tests only; no physical Intel verification recorded. |
| **Windows (x64)** | Windows UI Automation & PowerShell | **EXPERIMENTAL** | Unverified actions throw `UnsupportedPlatformError` | Type definitions and skeleton contracts. |
| **Linux (X11 / Wayland)** | AT-SPI2 / Portal | **EXPERIMENTAL** | Unverified actions throw `UnsupportedPlatformError` | Type definitions and skeleton contracts. |

See [`docs/CAPABILITY_MATRIX.md`](CAPABILITY_MATRIX.md) for the exhaustive tool-by-tool breakdown across all 41 tools.

---

## 2. macOS Permissions Onboarding

Running the full macOS GUI test requires two distinct user grants in **System Settings > Privacy & Security**:
1. **Accessibility**: Allows reading UI element trees and dispatching semantic AX actions.
2. **Screen Recording**: Allows capturing window and display screenshots via `screencapture`.

Run `cua doctor` to check Accessibility and Screen Recording. `cua doctor --require-real-gui` exits nonzero if any required check fails. The Screen Recording preflight uses `/usr/bin/swift`, so a working Swift toolchain is needed for the strict check. The TextEdit E2E opens a dedicated temporary file through LaunchServices and checks its accessibility tree and saved bytes; it does not send Apple Events directly to TextEdit.
