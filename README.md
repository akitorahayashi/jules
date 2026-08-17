# jules

A GitHub-installable Agent Skills plugin for working with Google Jules, an
asynchronous cloud coding agent. The repository root is the marketplace root
for Claude Code and Codex, and the `plugin/` directory is the plugin root for
both.

One skill is guidance-only; the other drives a dependency-free Bun TypeScript
CLI, so a plugin user needs no `npm install` step and no project files added
to the repository they are working in.

## Structure

```text
jules/
├── .claude-plugin/
│   └── marketplace.json                 # Claude Code marketplace manifest
├── .agents/
│   └── plugins/
│       └── marketplace.json             # Codex marketplace manifest
├── plugin/
│   ├── skills/
│   │   ├── google-jules/
│   │   │   └── SKILL.md                 # fit/non-fit guidance, no CLI
│   │   └── jules-task-delegation/
│   │       ├── SKILL.md                 # drives create-session.ts
│   │       ├── agents/openai.yaml       # Codex invocation policy
│   │       └── scripts/create-session.ts
│   ├── .claude-plugin/plugin.json       # Claude Code manifest
│   └── .codex-plugin/plugin.json        # Codex manifest
├── tests/                               # process- and unit-level tests
├── package.json                         # development tools only
├── biome.json / tsconfig.json           # format, lint, typecheck
├── bunfig.toml                          # test runner configuration
├── pnpm-lock.yaml
├── .husky/
├── README.md
└── CONTRIBUTING.md
```

The marketplace manifests expose the plugin in this repository by pointing to
`./plugin`. They are installation indexes only; the plugin body is not
duplicated under a `plugins/` directory.

`plugin/skills/` is shared across both clients. Each manifest carries only
that client's identity; the skill body is never duplicated. Component
directories (`skills/`, and later `hooks/`, `agents/`, `commands/`,
`.mcp.json`) live at the plugin root. Only `plugin.json` belongs inside
`.claude-plugin/` and `.codex-plugin/`.

## What each manifest requires

- Claude Code — skills under `plugin/skills/` are auto-discovered, so
  `.claude-plugin/plugin.json` needs no `skills` field.
- Codex — `.codex-plugin/plugin.json` declares `"skills": "./skills/"` and
  accepts an `interface` block for install-surface presentation.

## The skills

- `plugin/skills/google-jules` — reference model for deciding whether a task
  fits Jules: the session/source/activity concepts, fit and non-fit criteria,
  branch and automation-mode behavior. No scripts; guidance only.
- `plugin/skills/jules-task-delegation` — creates a Jules API session.
  `scripts/create-session.ts` parses CLI options, detects the GitHub repo from
  `remote.origin.url` when `--repo` is omitted, and calls the Jules API to
  open a session. `agents/openai.yaml` mirrors the `SKILL.md` frontmatter's
  `disable-model-invocation: true` for Codex, restricting the skill to
  explicit user invocation.

## Runtime and development separation

`create-session.ts` runs on the plugin user's own `bun`, with no runtime
dependency — only Bun globals and `node:` built-in modules. The distributed
`plugin/` subtree carries no `package.json`, lockfile, or `node_modules`.

Development dependencies (Biome, TypeScript, husky, `@types/bun`) are managed
with pnpm, installed via `pnpm install`. This is a separate concern from the
Bun runtime: pnpm never installs anything into the distributed plugin, and
Bun is still required on the development machine to run `bun test` and to
exercise the CLI itself.

## Develop

Development uses [pnpm](https://pnpm.io) for dependencies and
[Bun](https://bun.sh) as the runtime. `pnpm run fix` applies formatting and
autofixes; `pnpm run check` runs Biome and `tsc --noEmit`; `bun test` (or
`pnpm test`) runs the test suite. Run `pnpm run fix` before `pnpm run check`.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow and the CLI
contract.

## Validate

```bash
claude plugin validate .
claude plugin validate ./plugin
```

## Install

The repository root is the marketplace root for GitHub distribution.

### Claude Code

```bash
claude plugin marketplace add akitorahayashi/jules
claude plugin install jules@jules
```

For local development, Claude Code can load the plugin root for the current
session with `claude --plugin-dir ./plugin`.

### Codex

```bash
codex plugin marketplace add akitorahayashi/jules
codex plugin add jules@jules
```
