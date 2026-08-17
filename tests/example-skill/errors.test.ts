import { expect, test } from 'bun:test';
import { runSummarize } from '../cli-runner';

test.each([
  'abc',
  '1.2.3',
  '',
  'ten',
  '3,000',
  'Infinity',
  'NaN',
])('non-numeric argument %p exits two with an action', (bad) => {
  const result = runSummarize('10', bad);

  expect(result.exitCode).toBe(2);

  const payload = JSON.parse(result.stderr);
  expect(payload.error).toBeTruthy();
  expect(payload.action).toBeTruthy();
});

test('a non-numeric argument produces no result on stdout', () => {
  const result = runSummarize('10', 'abc');

  expect(result.stdout).toBe('');
});
