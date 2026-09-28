---
name: Platform verification report
about: Report independently observed install, doctor, and real GUI results
title: '[PLATFORM] '
assignees: ''
---

## Environment

- OS and version:
- Architecture and hardware model:
- Node.js and pnpm versions:
- ZCode desktop control version, commit, or release tag:
- Install method (source, plugin archive, or other):
- Test date:

## Reproduction

- `pnpm run doctor` result (paste relevant output; remove personal paths and tokens):
- Accessibility and Screen Recording permission state, if applicable:
- MCP `tools/list` result or reason it was not run:
- `pnpm run test:e2e:real` result or reason it was not run:
- Application used for real GUI testing (for example, TextEdit):

## Observed capabilities

List only actions you personally exercised. For each, give the action,
observed OS result, and pass/fail status. Separate implemented capabilities
that were not tested from observed passes.

## Failures or limitations

Include reproduction steps and relevant logs after removing secrets, private
screen content, and personal file paths. A headless CI pass alone is not a
real GUI verification result.
