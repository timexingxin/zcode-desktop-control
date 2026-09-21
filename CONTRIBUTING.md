# Contributing to zcode-desktop-control

We welcome community contributions, bug reports, and enhancements!

---

## 1. Development Principles

1. **Accessibility-First**: Prefer semantic Accessibility APIs over raw screen coordinates whenever possible.
2. **Clean-Room Integrity**: Never introduce proprietary binaries or decompiled code.
3. **Fail-Fast Error Classification**: Always throw or return structured `ComputerUseError` types instead of silent failures.
4. **Test Before Submitting**: Ensure `pnpm test` and `pnpm typecheck` pass cleanly.

---

## 2. Pull Request Guidelines

1. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Verify all tests pass:
   ```bash
   pnpm run build
   pnpm run test
   ```
3. Commit using conventional commit messages:
   ```bash
   git commit -m "feat(core): add stable handle caching"
   ```
4. Push and open a Pull Request.
