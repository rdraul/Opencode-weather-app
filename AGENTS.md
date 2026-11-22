# AGENTS.md

- Bun-only project (`bun init` scaffold). Use `bun` / `bunx`, not npm/npx; `bun.lock` is the lockfile. `index.ts` boots the CLI; logic lives in `src/` (`cli`, `openmeteo`, `store`, `format`, `types`, `errors`), tests in `tests/`.
- Commands: `bun run start`, `bun run typecheck` (`bun check`), `bun test`, `bun run build` (`bun-windows-x64` → `dist/weather.exe`). No lint or format scripts.
- `bun check` prints its success message to stderr; in PowerShell a piped run can surface `NativeCommandError` even when it passes. Judge by the output/exit code.
- `tsconfig.json` uses Bun's bundler defaults with strict flags, including `noUncheckedIndexedAccess` and `verbatimModuleSyntax`, plus `noEmit` (no compiled JS in the repo).
- The spec is `Readme.md` (Spanish, includes the target menu): interactive CLI for default/saved cities; Open-Meteo geocoding → forecast, no API key. Keep CLI copy and docs in Spanish.
- Config persists at `~/.weather-cli/config.json` (`{ cities, defaultCityId, unit }`); `WEATHER_CONFIG_DIR` overrides the directory and is used by tests. Writes go through a temp file + rename.
- `src/cli.ts` uses a custom line queue over `node:readline`, not `readline/promises`: piped multi-line stdin loses buffered lines with `question()`. Preserve this when changing input handling.
- Tests do not hit the network: `tests/openmeteo.test.ts` stubs `fetch`; `tests/store.test.ts` uses a temp config dir.
