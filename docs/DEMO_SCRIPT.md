# Real TextEdit Demo (60–120 seconds)

Record on an interactive Apple Silicon Mac after granting Accessibility and
Screen Recording permissions. Use a disposable TextEdit file and capture the
actual screen and terminal output. The supported physical evidence is the
TextEdit observe → type → save workflow; do not present mouse, screenshot,
element-click, or Intel Mac actions as physically verified here.

## Before recording

Install from the intended commit or release, then run `pnpm install` and
`pnpm build`. Check that the real GUI preflight passes on this host:

```bash
pnpm run doctor --require-real-gui
```

Close personal documents and clear private screen content. The real GUI test
also writes a temporary clipboard value, so use a disposable session if the
clipboard contains sensitive material. Keep the test's temporary file if it
reports that safe cleanup could not be established.

## Storyboard

| Time | Show | Evidence to capture |
| --- | --- | --- |
| 0:00–0:15 | The install/build commands and exact commit or release tag. | Successful command exit, with no claim about other platforms. |
| 0:15–0:30 | `pnpm run doctor --require-real-gui`. | Actual OS, architecture, and permission result. Stop if preflight fails. |
| 0:30–0:45 | Connect an MCP client to `cua mcp` and request `tools/list`. | Real client response; avoid a hard-coded tool count. |
| 0:45–1:25 | Run `pnpm run test:e2e:real` while showing its dedicated TextEdit file. | The test observes the frontmost file through AX, types a unique token, re-observes it, presses Command-S, and checks the saved file bytes. |
| 1:25–1:45 | Show the test result and the saved-file assertion. | A passing test is the receipt for this specific workflow. State any skip, failure, or retained file plainly. |

The TextEdit test requires its own file to be frontmost before typing. It does
not demonstrate background typing or prove the other implemented capabilities.
Only publish the sequence and outcomes actually recorded.
