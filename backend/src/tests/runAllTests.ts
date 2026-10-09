import { runXmlStorageTests } from './xmlStorage.test';
import { runAuthAndRecordsTests } from './authAndRecords.test';

async function runAll() {
  console.log('======================================================');
  console.log('🧪 MPloyChek Automated Backend & XML Test Suite');
  console.log('======================================================');
  const start = performance.now();

  try {
    await runXmlStorageTests();
    await runAuthAndRecordsTests();

    const elapsed = Math.round(performance.now() - start);
    console.log('======================================================');
    console.log(`🎉 ALL TESTS PASSED SUCCESSFULLY! (${elapsed}ms)`);
    console.log('======================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  }
}

runAll();
