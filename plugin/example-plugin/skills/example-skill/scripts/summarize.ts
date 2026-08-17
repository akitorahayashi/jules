#!/usr/bin/env bun

/**
 * Summarize a list of numbers passed as arguments, printing one JSON document.
 *
 * This is the example skill CLI for the skills-plugin-bun template. It shows
 * the conventions every script here follows: built-in modules only, one JSON
 * document on stdout, explicit validation with an actionable error, and
 * meaningful exit codes.
 *
 * Exit codes:
 * - 0: summarized at least one number
 * - 1: no numbers were given
 * - 2: an argument was not a number; stderr carries JSON with an "action"
 */

/** An input error carrying an action for the user to fix. */
class SkillInputError extends Error {
  readonly action: string;

  constructor(message: string, action: string) {
    super(message);
    this.name = 'SkillInputError';
    this.action = action;
  }
}

interface Summary {
  count: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
}

const usage = [
  'Summarize a list of numbers.',
  '',
  'Usage: bun summarize.ts [--help] <number>...',
].join('\n');

function parseNumber(text: string): number {
  const value = Number(text);

  if (text.trim().length === 0 || !Number.isFinite(value)) {
    throw new SkillInputError(
      `Not a number: ${JSON.stringify(text)}`,
      'Pass only numeric values, e.g. 10 6 2.5.',
    );
  }

  return value;
}

function summarize(numbers: readonly number[]): Summary {
  const sum = numbers.reduce((total, value) => total + value, 0);

  return {
    count: numbers.length,
    sum,
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    mean: sum / numbers.length,
  };
}

function run(args: readonly string[]): 0 | 1 {
  if (args.includes('--help')) {
    console.log(usage);
    return 0;
  }

  const numbers = args.map(parseNumber);

  if (numbers.length === 0) {
    console.log(
      JSON.stringify(
        { count: 0, hint: 'Pass one or more numbers to summarize.' },
        null,
        2,
      ),
    );
    return 1;
  }

  console.log(JSON.stringify(summarize(numbers), null, 2));
  return 0;
}

function main(args: readonly string[]): 0 | 1 | 2 {
  try {
    return run(args);
  } catch (error) {
    if (error instanceof SkillInputError) {
      console.error(
        JSON.stringify({ error: error.message, action: error.action }, null, 2),
      );
      return 2;
    }
    throw error;
  }
}

if (import.meta.main) {
  process.exitCode = main(Bun.argv.slice(2));
}
