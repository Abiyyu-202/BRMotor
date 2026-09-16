/**
 * Opaque-box E2E Test Harness for BR Motor
 * Zero external dependencies, pure TypeScript execution via tsx.
 */

import assert from 'node:assert';

export interface TestCase {
  id: string;
  name: string;
  tier: number;
  feature?: string;
  fn: () => void | Promise<void>;
}

export interface TestResult {
  id: string;
  name: string;
  tier: number;
  feature?: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export class TestSuite {
  name: string;
  tierNumber: number;
  tests: TestCase[] = [];

  constructor(name: string, tierNumber: number) {
    this.name = name;
    this.tierNumber = tierNumber;
  }

  addTest(id: string, name: string, fn: () => void | Promise<void>, feature?: string) {
    this.tests.push({
      id,
      name,
      tier: this.tierNumber,
      feature,
      fn
    });
  }

  async run(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    for (const t of this.tests) {
      const start = Date.now();
      try {
        await t.fn();
        results.push({
          id: t.id,
          name: t.name,
          tier: t.tier,
          feature: t.feature,
          passed: true,
          durationMs: Date.now() - start
        });
      } catch (err: any) {
        results.push({
          id: t.id,
          name: t.name,
          tier: t.tier,
          feature: t.feature,
          passed: false,
          error: err?.message || String(err),
          durationMs: Date.now() - start
        });
      }
    }
    return results;
  }
}

// Fluent assertions
export function assertTrue(condition: boolean, message = 'Condition must be true'): void {
  assert.strictEqual(condition, true, message);
}

export function assertFalse(condition: boolean, message = 'Condition must be false'): void {
  assert.strictEqual(condition, false, message);
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  assert.strictEqual(actual, expected, message);
}

export function assertNotEqual<T>(actual: T, expected: T, message?: string): void {
  assert.notStrictEqual(actual, expected, message);
}

export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
  assert.deepStrictEqual(actual, expected, message);
}

export function assertMatch(actual: string, regex: RegExp, message?: string): void {
  assert.match(actual, regex, message);
}

export function assertIncludes<T>(container: T[] | string, item: any, message?: string): void {
  if (typeof container === 'string') {
    assertTrue(container.includes(item), message || `Expected string to include "${item}"`);
  } else {
    assertTrue(container.includes(item), message || `Expected array to include item`);
  }
}

export function assertNotIncludes<T>(container: T[] | string, item: any, message?: string): void {
  if (typeof container === 'string') {
    assertFalse(container.includes(item), message || `Expected string NOT to include "${item}"`);
  } else {
    assertFalse(container.includes(item), message || `Expected array NOT to include item`);
  }
}

export function assertThrows(fn: () => any, message = 'Expected function to throw'): void {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  assertTrue(threw, message);
}
