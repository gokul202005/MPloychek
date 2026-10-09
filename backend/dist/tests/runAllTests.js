"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xmlStorage_test_1 = require("./xmlStorage.test");
const authAndRecords_test_1 = require("./authAndRecords.test");
async function runAll() {
    console.log('======================================================');
    console.log('🧪 MPloyChek Automated Backend & XML Test Suite');
    console.log('======================================================');
    const start = performance.now();
    try {
        await (0, xmlStorage_test_1.runXmlStorageTests)();
        await (0, authAndRecords_test_1.runAuthAndRecordsTests)();
        const elapsed = Math.round(performance.now() - start);
        console.log('======================================================');
        console.log(`🎉 ALL TESTS PASSED SUCCESSFULLY! (${elapsed}ms)`);
        console.log('======================================================');
        process.exit(0);
    }
    catch (err) {
        console.error('\n❌ TEST RUN FAILED:', err);
        process.exit(1);
    }
}
runAll();
