# Copilot Instructions for maker.js

## Files to Never Commit

When working on this repository, **NEVER** commit the following types of files:

### Build Artifacts
- `docs/target/` directory and its contents (e.g., `docs/target/js/browser.maker.js`)
- `packages/*/gen.js` - Generated JavaScript files from TypeScript
- `*.map` files - Source map files

### Lock Files
- `package-lock.json` in the root or any subdirectory
- `**/package-lock.json` anywhere in the repository

### Other Generated Files
- Any `.log` files

## Important Note

**DO NOT add these files to `.gitignore`**. Users need to see these files locally for development and building. The files should exist in the working directory but should not be committed to the repository.

## Before Committing

Always:
1. Review the files being committed with `git status` or `git diff --cached`
2. Ensure only source code, tests, and documentation are included
3. Check that no build artifacts or lockfiles are being staged for commit
4. If build artifacts or lockfiles appear, use `git rm --cached <file>` to unstage them

## Why These Rules?

- **Build artifacts** should be generated during the build process, not stored in version control
- **Lockfiles** can cause conflicts in a monorepo with workspaces
- Users need these files locally for development, so they should not be in `.gitignore`
- Committing these files increases repository size and causes unnecessary merge conflicts

