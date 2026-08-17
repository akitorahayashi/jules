import { expect, test } from 'bun:test';
import { runSummarize } from '../cli-runner';

test('summarizes numbers and exits zero', () => {
  const result = runSummarize(10, 6, 2);

  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({
    count: 3,
    sum: 18,
    min: 2,
    max: 10,
    mean: 6,
  });
});

test('accepts decimals and negatives', () => {
  const result = runSummarize('-1.5', '2.5');

  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({
    count: 2,
    sum: 1,
    min: -1.5,
    max: 2.5,
    mean: 0.5,
  });
});

test('no numbers exits one with a hint', () => {
  const result = runSummarize();

  expect(result.exitCode).toBe(1);

  const payload = JSON.parse(result.stdout);
  expect(payload.count).toBe(0);
  expect(payload.hint).toBeTruthy();
});
