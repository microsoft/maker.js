# Copilot Instructions for maker.js

## Files to Never Commit

When working on this repository, **NEVER** commit the following types of files:

### Build Artifacts
- `docs/target/` directory and its contents (e.g., `docs/target/js/browser.maker.js`)
- `packages/*/gen.js` - Generated JavaScript files from TypeScript
- `packages/*/dist/` - Distribution builds (already in .gitignore)
- `*.map` files - Source map files

### Lock Files
- `package-lock.json` in the root or any subdirectory
- `**/package-lock.json` anywhere in the repository

### Other Generated Files
- `node_modules/` directories (already in .gitignore)
- Any `.log` files
- IDE configuration files (`.vscode`, `.vs`, etc.)

## Before Committing

Always:
1. Review the files being committed with `git status` or equivalent
2. Ensure only source code, tests, and documentation are included
3. Check that no build artifacts or lockfiles are being committed
4. Use `.gitignore` to exclude files that should never be committed

## Why These Rules?

- **Build artifacts** should be generated during the build process, not stored in version control
- **Lockfiles** can cause conflicts in a monorepo with workspaces
- Committing these files increases repository size and causes unnecessary merge conflicts
