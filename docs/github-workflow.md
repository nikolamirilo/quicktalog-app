# Git Workflow: `main` and `test` Branches

This document describes the recommended Git workflow for projects with two main branches:

- **`test`**: Development and testing branch (all ongoing development happens here)
- **`main`**: Production branch (stable, release-ready code)

---

## Environments

| Environment | URL                         | Branch |
| ----------- | --------------------------- | ------ |
| Production  | https://www.quicktalog.app  | main   |
| Test        | https://test.quicktalog.app | test   |

---

## Branch Purposes

| Branch | Role                                |
| ------ | ----------------------------------- |
| `test` | Development and testing environment |
| `main` | Production-ready stable releases    |

---

## Workflow Overview

### 1. Work on the `test` Branch (Development & Testing)

- Use the `test` branch for daily development.
- Commit and push your changes regularly to `test`.
- This branch may contain unstable or experimental code.
- Perform all testing and QA here before considering a release.

```bash
git checkout test
# Make changes, add new features or fixes
git add .
git commit -m "Description of changes"
git push origin test
```

---

### 2. Merge `test` into `main` (Release to Production)

After completing a full development and testing cycle on the `test` branch, and once all features and fixes for that phase are stable and verified, merge `test` into `main`.

This process marks the end of a development cycle and the official release of production-ready code. Only code that has passed all tests and QA in `test` should be merged into `main`.

```bash
git checkout main
git pull origin main          # Update local main branch
git merge test                  # Merge tested changes from 'test'
git push origin main          # Push updates to remote main
```

**Optional:** Tag the release for easier reference.

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

---

### 3. Continue Development on `test`

After merging, continue your active development on the `test` branch.

```bash
git checkout test
git pull origin test
```

---

## Best Practices

- Always pull the latest changes before pushing or merging to avoid conflicts.
- Use clear, descriptive commit messages for better tracking.
- Consider creating feature branches off `test` for large or risky changes, then merge back into `test` once ready.
- Run automated tests and QA on the `test` branch before merging to `main`.
- Never commit directly to `main` unless it’s a hotfix or urgent patch (and still tested).
- Communicate clearly in your team about when merges to `main` happen.

---

## Summary of Commands

| Task                    | Commands                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| Switch to test branch   | `git checkout test`                                                                         |
| Commit and push to test | `git add .`<br>`git commit -m "message"`<br>`git push origin test`                          |
| Merge test into main    | `git checkout main`<br>`git pull origin main`<br>`git merge test`<br>`git push origin main` |
| Tag a release on main   | `git tag -a vX.Y.Z -m "Release vX.Y.Z"`<br>`git push origin vX.Y.Z`                         |
| Switch back to test     | `git checkout test`<br>`git pull origin test`                                               |
