import path from 'node:path';

export interface SkillCliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

const repositoryRoot = path.join(import.meta.dir, '..');

const summarizeCli =
  'plugin/example-plugin/skills/example-skill/scripts/summarize.ts';

/** Run a skill CLI as a subprocess with the given arguments. */
export function runSkillCli(
  script: string,
  ...args: readonly (string | number)[]
): SkillCliResult {
  const command = Bun.spawnSync(
    ['bun', path.join(repositoryRoot, script), ...args.map(String)],
    { cwd: repositoryRoot, stdout: 'pipe', stderr: 'pipe' },
  );

  return {
    exitCode: command.exitCode ?? 1,
    stdout: command.stdout.toString(),
    stderr: command.stderr.toString(),
  };
}

/** Run the example skill CLI with the given values as arguments. */
export function runSummarize(
  ...values: readonly (string | number)[]
): SkillCliResult {
  return runSkillCli(summarizeCli, ...values);
}
