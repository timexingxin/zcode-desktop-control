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
   Record the host OS, architecture, and any missing permissions. A passing
   doctor or headless CI run does not establish physical GUI coverage on every
   platform; use `pnpm run test:e2e:real` on an interactive, permissioned macOS
   host and report the capabilities actually exercised.
4. **Secret Scan**:
   Verify zero sensitive keys or local paths exist.
5. **Version & Artifact**:
   Update `package.json` and `CHANGELOG.md` for the proposed version. Build and
   inspect the plugin archive with `pnpm run package:plugin`; record its digest
   if it will be distributed. Do not reuse an existing version tag.
6. **Tag & Publish (after release approval)**:
   ```bash
   git tag vX.Y.Z <verified-main-sha>
   git push origin vX.Y.Z
   ```
   Replace the placeholders with the intended version and verified `main`
   commit. Pushing a `v*` tag triggers `.github/workflows/release.yml`, which
   builds, tests, and creates a published GitHub Release with generated notes.
   It does **not** attach the plugin archive automatically. Check the workflow
   result, release notes, tag target, and any manually uploaded asset before
   calling the release complete.
