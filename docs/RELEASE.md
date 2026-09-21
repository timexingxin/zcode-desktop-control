# Release Process (docs/RELEASE.md)

This project strictly follows [Semantic Versioning (SemVer)](https://semver.org/).

---

## Release Checklist

1. **Clean Working Tree**: Ensure `git status` has zero untracked files or unstaged changes.
2. **Typecheck & Tests**:
   ```bash
   pnpm run typecheck
   pnpm run test
   ```
3. **Doctor Verification**:
   ```bash
   pnpm run doctor
   ```
4. **Secret Scan**:
   Verify zero sensitive keys or local paths exist.
5. **Tag & Publish**:
   ```bash
   git tag v0.1.0
   git push origin main --tags
   ```
6. **GitHub Release**:
   Create a GitHub release draft with release notes from `CHANGELOG.md`.
