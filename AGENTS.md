# AGENTS.md

- Bun-only project (`bun init` scaffold). Use `bun` / `bunx`, not npm/npx; `bun.lock` is the lockfile. `index.ts` is the entrypoint (currently just a hello-world stub).
- Commands: `bun run index.ts` to run, `bun check` to typecheck (the `typecheck` script). There are no test, lint, format, or build scripts.
- `bun check` prints its success message to stderr; in PowerShell it can surface a `NativeCommandError` even when it passes. Judge by the output/exit code, not that error wrapper.
- `tsconfig.json` uses Bun's bundler defaults with strict flags, including `noUncheckedIndexedAccess` and `verbatimModuleSyntax`, plus `noEmit` (no compiled JS in the repo).
- The spec is in `Readme.md` (Spanish, including the target menu): interactive CLI for default/saved cities; data comes from two Open-Meteo HTTP calls (geocoding, then forecast), no API key. Keep CLI copy and docs in Spanish.
- Shipping a standalone executable is the stated end goal, but no compile/build script is configured yet.
