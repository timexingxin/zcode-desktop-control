# Platform Support & Operational Matrix
> **Policy**: **Truthfulness > Tool Count**. No synthetic or unexecuted receipts.

---

## 1. Operating System Status

| Platform & Architecture | Automation Mechanism | Status | Zero Fake-Success Guarantee | Verification Evidence |
| :--- | :--- | :---: | :--- | :--- |
| **macOS (Apple Silicon arm64)** | Native AX, CoreGraphics, screencapture | **IMPLEMENTED** | Real TextEdit E2E is a separate gate | Current checkout needs a passing physical E2E run to verify its covered actions. |
| **macOS (Intel x64)** | Native AX, CoreGraphics, screencapture | **IMPLEMENTED** | Real OS events require a physical test | CI build and unit tests only; no physical Intel verification recorded. |
| **Windows (x64)** | Windows UI Automation & PowerShell | **EXPERIMENTAL** | Unverified actions throw `UnsupportedPlatformError` | Type definitions and skeleton contracts. |
| **Linux (X11 / Wayland)** | AT-SPI2 / Portal | **EXPERIMENTAL** | Unverified actions throw `UnsupportedPlatformError` | Type definitions and skeleton contracts. |

See [`docs/CAPABILITY_MATRIX.md`](CAPABILITY_MATRIX.md) for the exhaustive tool-by-tool breakdown across all 41 tools.

---

## 2. macOS Permissions Onboarding

Running the full macOS GUI test requires three distinct user grants in **System Settings > Privacy & Security**:
1. **Accessibility**: Allows reading UI element trees and dispatching semantic AX actions.
2. **Screen Recording**: Allows capturing window and display screenshots via `screencapture`.
3. **Automation for TextEdit**: Allows the strict E2E to inspect and clean up its own document. macOS can display a consent prompt when this is first checked.

Run `cua doctor` to check Accessibility and Screen Recording. `cua doctor --require-real-gui` also probes TextEdit Automation and exits nonzero if any required check fails. The Screen Recording preflight uses `/usr/bin/swift`, so a working Swift toolchain is needed for the strict check.
