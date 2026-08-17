# Contributing

A multi-client Agent Skills plugin for Google Jules. User-facing documentation
is in [README.md](README.md); this guide covers the development workflow.

## Scope

This repository owns:

- `plugin/` — the distributed plugin: both client manifests and the shared
  `skills/` directory
- `tests/` — tests for `jules-task-delegation`'s CLI
- `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` — the
  distribution catalogs

## Runtime contract

`plugin/skills/jules-task-delegation/scripts/create-session.ts` runs on the
plugin user's own `bun`. Dependencies are Bun globals and `node:` built-in
modules only — no package import enters `plugin/**/scripts/`, and the
distributed subtree contains no `package.json`, no lockfile, and no
`node_modules`, so an installed skill runs without an install step.

## Environment

Development dependencies are managed with [pnpm](https://pnpm.io):
`pnpm install` syncs Biome, TypeScript, `@types/bun`, and husky into
`node_modules`, and installs the husky hooks through the `prepare` script.
This installs nothing into the distributed `plugin/` subtree.

Running the test suite and the CLI itself additionally requires
[Bun](https://bun.sh) on the development machine — pnpm manages
devDependencies, but does not substitute for the Bun runtime that `bun test`
and `create-session.ts` need to execute.

## Tasks

- `bun test` (or `pnpm test`) runs the test suite.
- `pnpm run fix` applies Biome formatting and autofixes.
- `pnpm run check` runs Biome in check mode and `tsc --noEmit`.

`pnpm run fix` is the pass to run before committing; `pnpm run check` is the
verification pass. Run `pnpm run fix` before `pnpm run check`. The husky hooks
enforce this: `pre-commit` runs `pnpm run check` and `pre-push` runs
`pnpm test`.

## Code style

Formatting and linting are handled by Biome. Type checking is handled by
TypeScript over the plugin skills and `tests`, under `strict` with
`noUncheckedIndexedAccess`. Scripts are fully type-annotated at their
boundaries, and `tsc --noEmit` is expected to report no problems.

Avoid silent fallbacks. Configuration and runtime problems surface as
explicit errors, not a degraded result.

## Tests

Tests live outside the skills, at the repository root under `tests/`.

- `tests/jules-task-delegation/create-session.test.ts` imports
  `create-session.ts`'s exported functions directly rather than driving it as
  a subprocess, because `createJulesSession` takes an injectable `fetchImpl`
  and `repoDetector` specifically so HTTP responses, timeouts, and git-remote
  detection can be simulated without a real network call or a real repo. It
  covers `parseGithubRepo`'s HTTPS/SSH parsing, `parseCliOptions`'s mutually
  exclusive `--prompt`/`--prompt-file` rejection, `main`'s missing-API-key
  rejection, a mapped success response, an upstream automation-mode rejection,
  a malformed success payload, and a request timeout.

Tests assert behavior observable through these exported seams, not internal
composition.

## CLI contract

`create-session.ts` is not JSON-on-stdout with a 0/1/2 exit-code convention —
it prints human-readable progress and result lines (`Creating session...`,
then `ID:`/`Name:`/`URL:`) and exits 0 on success. Any failure — a usage
error, a missing `JULES_API_KEY`, an HTTP error from the Jules API, a request
timeout — throws a `JulesScriptError` (or propagates the underlying error),
which the CLI entry point catches, printing `Error: <message>` to stderr and
exiting 1.

## Distribution boundary

The repository root is the marketplace root for Claude Code and Codex. The
marketplace manifests at `.claude-plugin/marketplace.json` and
`.agents/plugins/marketplace.json` point to `./plugin`.

The `plugin/` directory is the plugin root. Component directories such as
`skills/` live beside the plugin manifests `.claude-plugin/plugin.json` and
`.codex-plugin/plugin.json`; clients do not load components nested inside
either client-manifest directory. Development assets at the repository root
support development and do not enter the installable plugin.
