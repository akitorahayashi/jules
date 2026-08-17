import { expect, test } from 'bun:test';
import { runSummarize } from '../cli-runner';

test('--help describes the invocation and exits zero', () => {
  const result = runSummarize('--help');

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('summarize.ts');
  expect(result.stderr).toBe('');
});
