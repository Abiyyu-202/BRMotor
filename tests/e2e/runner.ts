/**
 * Master E2E Test Suite Runner for BR Motor
 * Usage: npx tsx tests/e2e/runner.ts
 */

import { createTier1Suite } from './tier1_features.test.ts';
import { createTier2Suite } from './tier2_boundary.test.ts';
import { createTier3Suite } from './tier3_pairwise.test.ts';
import { createTier4Suite } from './tier4_realworld.test.ts';
import { TestResult } from './harness.ts';

async function main() {
  const startTime = Date.now();
  console.log('============================================================');
  console.log('BR MOTOR E2E TEST SUITE RUNNER');
  console.log('============================================================\n');

  const suite1 = createTier1Suite();
  const suite2 = createTier2Suite();
  const suite3 = createTier3Suite();
  const suite4 = createTier4Suite();

  const suites = [suite1, suite2, suite3, suite4];
  const allResults: TestResult[] = [];
  const tierStats: { name: string; total: number; passed: number; failed: number }[] = [];

  for (const suite of suites) {
    console.log(`Executing ${suite.name} (${suite.tests.length} tests)...`);
    const results = await suite.run();
    allResults.push(...results);

    let tierPassed = 0;
    let tierFailed = 0;

    for (const r of results) {
      if (r.passed) {
        tierPassed++;
        console.log(`  [PASS] ${r.id}: ${r.name} (${r.durationMs}ms)`);
      } else {
        tierFailed++;
        console.log(`  [FAIL] ${r.id}: ${r.name} (${r.durationMs}ms)`);
        console.log(`         Error: ${r.error}`);
      }
    }

    tierStats.push({
      name: suite.name,
      total: suite.tests.length,
      passed: tierPassed,
      failed: tierFailed
    });
    console.log('');
  }

  const totalTime = Date.now() - startTime;
  const totalTests = allResults.length;
  const totalPassed = allResults.filter((r) => r.passed).length;
  const totalFailed = allResults.filter((r) => !r.passed).length;

  console.log('============================================================');
  console.log('TEST SUMMARY REPORT');
  console.log('============================================================');
  for (const stat of tierStats) {
    const paddedName = (stat.name + ':').padEnd(38, ' ');
    console.log(`${paddedName} ${stat.passed} / ${stat.total} passed (${stat.failed} failed)`);
  }
  console.log('------------------------------------------------------------');
  console.log(`Total Tests:    ${totalTests}`);
  console.log(`Total Passed:   ${totalPassed}`);
  console.log(`Total Failed:   ${totalFailed}`);
  console.log(`Execution Time: ${totalTime}ms`);
  console.log('============================================================');

  if (totalFailed > 0) {
    console.log(`\nResult: FAILED (${totalFailed} tests failing due to pending implementation).`);
    process.exit(1);
  } else {
    console.log('\nResult: ALL TESTS PASSED.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
