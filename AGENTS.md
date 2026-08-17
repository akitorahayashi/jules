# skills-plugin-bun

## Project Overview

A template for a multi-client Agent Skills plugin whose skills are backed by Bun
TypeScript scripts. One repository is one plugin, installable on Claude Code and
Codex CLI from a shared `skills/` directory. Each skill drives a standalone,
dependency-free TypeScript CLI that runs on the user's own `bun` and prints one
JSON document. `example-skill` is a placeholder, meant to be renamed and
replaced.

## Directory Structure

```
plugin/
  example-plugin/                    Distributed plugin — the marketplace `source` target
    .claude-plugin/plugin.json       Claude Code manifest
    .codex-plugin/plugin.json        Codex manifest
    skills/
      example-skill/
        SKILL.md                     Drives summarize.ts
        scripts/summarize.ts         Example CLI — count/sum/min/max/mean
.claude-plugin/marketplace.json      Claude Code catalog; git-subdir → plugin/example-plugin
.agents/plugins/marketplace.json     Codex catalog; local → ./plugin/example-plugin
tests/                               Bun process-boundary tests; excluded from the plugin
  cli-runner.ts                      Subprocess CLI runner
  example-skill/                     summarize.ts tests, split by concern
package.json                         Dev-tool configuration only (Biome, TypeScript, husky)
biome.json / tsconfig.json           Format and lint; typecheck over plugin skills and tests
bunfig.toml                          Test runner configuration
.husky/                              pre-commit runs check, pre-push runs test
```

Only the `plugin/example-plugin/` subtree ships, selected by the `git-subdir`
source in `.claude-plugin/marketplace.json`. Development assets stay at the
repository root and are excluded from the installed plugin. Component
directories (`skills/`, and later `hooks/`, `agents/`, `commands/`, `.mcp.json`)
live at the subtree root, not inside its `.claude-plugin/`. CONTRIBUTING.md
covers the per-client details.

## Testing

Tests live under `tests/`, outside the distributed subtree, one directory per
skill. They assert the CLI process boundary — exit code, stdout/stderr JSON,
written files — not internal composition. `tests/cli-runner.ts` holds the
subprocess runner.

Run `bun run fix` first, then `bun run check` and `bun test`.

## Core Concepts

### Dependency-Free Runtime

Bun globals and `node:` built-in modules only. No package import enters
`plugin/**/skills/**/scripts/`, and the subtree carries no `package.json`,
lockfile, or `node_modules`, so a skill runs on the user's own `bun` as
installed. The `package.json` dependencies are dev tools that never ship.

### CLI Contract

One JSON document on stdout. Exit 0 for an affirmative result, 1 for a valid
request with a negative or empty result, 2 for a config or runtime error. Exit 2
prints JSON to stderr carrying an actionable `action`. Failures surface
explicitly, never as a silently degraded result.

### Argument Parsing

`parseArgs` from `node:util` is the built-in option parser. It rejects a
negative number such as `-1.5` as an unknown short option, so the example CLI
reads its positional arguments from `Bun.argv` directly.

## Documentation Responsibilities

- AGENTS.md — source map and invariants. The orientation layer.
- README.md — structure, manifests, install, and customization. The front door.
- CONTRIBUTING.md — development workflow and the distribution boundary in full.
- `skills/<name>/SKILL.md` — agent-facing behavior of that skill.
