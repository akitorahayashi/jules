# Contributing

This repository is a template for a multi-client Agent Skills plugin whose
skills are backed by Bun TypeScript scripts. User-facing documentation is in
[README.md](README.md); this guide covers the development workflow.

## Scope

This repository owns:

- `plugin/example-plugin/` — the distributed plugin: both client manifests and
  the shared `skills/` directory
- `tests/` — process-boundary tests for the skill CLIs
- `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` — the
  distribution catalogs

## Runtime constraint

The skill CLIs run on the plugin user's own `bun`. Dependencies are Bun globals
and `node:` built-in modules only. No package import enters
`plugin/**/skills/**/scripts/`, and the distributed subtree contains no
`package.json`, no lockfile, and no `node_modules`, so an installed skill runs
without an install step. The dependencies declared in `package.json` are
development tools and never ship as a runtime requirement.

## Environment

Development uses [Bun](https://bun.sh). The Bun version is fixed by the
`packageManager` field in `package.json`. `bun install` syncs the development
tools into `node_modules` and installs the husky hooks through the `prepare`
script.

## Tasks

- `bun test` runs the test suite.
- `bun run fix` applies Biome formatting and autofixes.
- `bun run check` runs Biome in check mode and `tsc --noEmit`.

`bun run fix` is the pass to run before committing; `bun run check` is the
verification pass. Run `bun run fix` before `bun run check`. The husky hooks
enforce this: `pre-commit` runs `bun run check` and `pre-push` runs `bun test`.

## Code style

Formatting and linting are handled by Biome. Type checking is handled by
TypeScript over the plugin skills and `tests`, under `strict` with
`noUncheckedIndexedAccess`. Scripts are fully type-annotated at their
boundaries, and `tsc --noEmit` is expected to report no problems.

Avoid silent fallbacks. Configuration and runtime problems surface as explicit
errors carrying a user-actionable `action`, not a degraded result.

## Tests

Tests live outside the skills, at the repository root under `tests/`, as Bun
test files split by skill into directories. They assert each CLI's process
boundary (exit code, the stdout and stderr JSON, any written files), not
internal functions.

- `tests/cli-runner.ts` provides a subprocess runner that invokes a skill CLI
  with the given arguments, plus the binding for the example CLI.
- `tests/example-skill/` verifies the example CLI by concern: `summary.test.ts`
  covers the reported shape and the empty-result path, `errors.test.ts` covers
  non-numeric arguments, and `usage.test.ts` covers `--help`.

Enumerate matrix cases with `test.each`, and keep any temporary state in a
directory created under the runtime's temporary directory and removed in a
`finally` block. Tests assert behavior observable at the CLI boundary and do not
fix internal composition.

## CLI contract

Each skill CLI prints one JSON document on stdout and uses meaningful exit
codes. The convention across the template is exit 0 for an affirmative or
successful result, 1 for a valid request with a negative or empty result, and 2
for a configuration or runtime error. On exit 2, the CLI prints JSON to stderr
carrying an `action` describing what the user should fix.

The example CLI,
`plugin/example-plugin/skills/example-skill/scripts/summarize.ts`, takes a list
of numbers as arguments and reports their count, sum, min, max, and mean.

Scripts that accept options parse them with `parseArgs` from `node:util`. The
example CLI reads its positional arguments from `Bun.argv` directly, because
`parseArgs` rejects a negative number such as `-1.5` as an unknown short option.

## Distribution boundary

The distributed plugin is whatever `source` in
[.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) points to. It
is a `git-subdir` source scoped to `plugin/example-plugin`, which holds only both
manifests and `skills/`. Claude Code and Codex both read this marketplace and
sparse-clone that subtree, so the development assets at the repository root
(`tests/`, `package.json`, `biome.json`, `tsconfig.json`, `bunfig.toml`,
`bun.lock`, `.husky/`) are excluded from the installed plugin.

Component directories such as `skills/` live at the subtree root, not inside
`plugin/example-plugin/.claude-plugin/` or `.codex-plugin/`, or the clients
would not load them. Keep development assets at the repository root and leave
only the manifests and `skills/` inside `plugin/example-plugin/`.
