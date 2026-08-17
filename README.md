# skills-plugin-bun

A template for packaging Agent Skills that are backed by Bun TypeScript
scripts, as a plugin that installs natively on Claude Code and Codex CLI. One
repository is one plugin holding one or more related skills, distributed from a
single shared `skills/` directory with one small manifest per client. Each skill
drives a dependency-free TypeScript CLI that runs on the user's own `bun` and
prints one JSON document.

The plugin lives in the `plugin/example-plugin/` subtree so that development
assets at the repository root stay out of what gets installed.

## Structure

```text
skills-plugin-bun/
├── plugin/
│   └── example-plugin/                       # the distributed plugin (only this subtree installs)
│       ├── .claude-plugin/plugin.json        # Claude Code manifest
│       ├── .codex-plugin/plugin.json         # Codex manifest
│       └── skills/
│           └── example-skill/
│               ├── SKILL.md                   # name comes from frontmatter
│               └── scripts/summarize.ts       # dependency-free CLI, one JSON document, exit codes 0/1/2
├── .claude-plugin/
│   └── marketplace.json                       # Claude Code catalog; git-subdir source -> plugin/example-plugin
├── .agents/plugins/
│   └── marketplace.json                       # Codex catalog; local source -> ./plugin/example-plugin
├── tests/
│   ├── cli-runner.ts                          # subprocess runner for a skill CLI
│   └── example-skill/                         # process-boundary tests, split by concern
├── package.json                               # development tools only (biome / typescript / husky)
├── biome.json                                 # formatter and linter configuration
├── tsconfig.json                              # typecheck over the plugin skills and tests
├── bunfig.toml                                # test runner configuration
├── bun.lock                                   # development dependency lock
├── .husky/                                    # pre-commit check, pre-push test
├── README.md
├── AGENTS.md
└── CONTRIBUTING.md
```

`skills/` is shared across both clients. Each manifest carries only that
client's identity; the skill body is never duplicated. Component directories
(`skills/`, and later `hooks/`, `agents/`, `commands/`, `.mcp.json`) live at the
plugin-subtree root. Only `plugin.json` belongs inside `.claude-plugin/` and
`.codex-plugin/`.

## What each manifest requires

Each manifest lives inside `plugin/example-plugin/`.

- Claude Code — skills under `skills/` are auto-discovered, so `plugin.json`
  needs no `skills` field. Metadata like `author`, `homepage`, `repository`,
  `license`, and `keywords` is optional.
- Codex — `.codex-plugin/plugin.json` declares `"skills": "./skills/"` and
  accepts the same optional metadata plus an `interface` block for
  install-surface presentation.

## The example skill

`plugin/example-plugin/skills/example-skill` demonstrates the conventions every
skill in this template follows. Its CLI takes a list of numbers as arguments and
prints their count, sum, min, max, and mean as one JSON document. It shows the
whole contract: dependency-free TypeScript, explicit validation with an
actionable error, and exit codes 0 (a result), 1 (no numbers given), and 2 (a
non-numeric argument, reported as JSON on stderr with an `action`). A skill
needs only a `SKILL.md` and, here, a `scripts/` directory; optional
`references/` and `assets/` directories are supported when a skill needs them.
Rename the directory and replace the skill with your own.

## Runtime and development separation

The skill CLIs run on the plugin user's own `bun` with no runtime dependency.
Every script under `skills/**/scripts/` imports only Bun globals and `node:`
built-in modules, so a skill works the moment it is installed, with no
`bun install` step and no `node_modules` in the distributed subtree. The
dependencies in `package.json` are development tools (Biome, TypeScript,
husky); they are never installed into the runtime and never ship as a plugin
requirement.

## Distribution boundary

The distributed plugin is the `plugin/example-plugin/` subtree, selected by the
`git-subdir` source in `.claude-plugin/marketplace.json`. Claude Code and Codex
both read this marketplace and sparse-clone only that subtree, so the
development assets at the repository root (`tests/`, `package.json`,
`biome.json`, `tsconfig.json`, `bunfig.toml`, `bun.lock`, `.husky/`) are never
part of the installed plugin. Component directories such as `skills/` live at
the subtree root, not inside its `.claude-plugin/`, or the clients would not
load them.

## Develop

Development uses [Bun](https://bun.sh). `bun run fix` applies formatting and
autofixes; `bun run check` runs Biome and `tsc --noEmit`; `bun test` runs the
test suite. Run `bun run fix` before `bun run check`. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow and the CLI contract.

## Customize

1. Rename `plugin/example-plugin/` to your plugin name, and update the `path` in
   `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` to
   match. Rename `plugin/<name>/skills/example-skill/` to your skill's name and
   rewrite its `SKILL.md`. The `name` frontmatter sets the invocation name; the
   `description` frontmatter is the sentence the agent reads to decide when to
   use the skill, so make it a specific trigger. Replace the CLI under
   `scripts/` with your own, and add optional `references/` and `assets/`
   directories if your skill needs them.
2. Replace `example-plugin` with your plugin name (kebab-case) in the two plugin
   manifests, and `example-marketplace` / `your-name` / the git-subdir `url` in
   the two marketplace manifests.
3. Add more skills as sibling directories under `plugin/<name>/skills/`, and add
   tests under `tests/`. Group related skills in one plugin rather than
   splitting one plugin per skill.
4. Validate before distributing:

   ```bash
   claude plugin validate .
   claude plugin validate ./plugin/example-plugin
   ```

## Install

Replace the repository URL and the `plugin@marketplace` names with your own.

### Claude Code

```bash
claude plugin marketplace add git@github.com:your-org/your-repo.git
claude plugin install example-plugin@example-marketplace
```

Public repositories can use the HTTPS URL instead of the SSH one. The
`git-subdir` source sparse-clones only `plugin/example-plugin`.

### Codex

```bash
codex plugin marketplace add git@github.com:your-org/your-repo.git
codex plugin install example-plugin@example-marketplace
```

Alternatively, run `/plugins` in the Codex TUI to browse the registered
marketplaces and install interactively.
