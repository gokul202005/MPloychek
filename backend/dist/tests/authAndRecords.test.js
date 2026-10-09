"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAuthAndRecordsTests = runAuthAndRecordsTests;
const assert_1 = __importDefault(require("assert"));
const authService_1 = require("../services/authService");
const recordService_1 = require("../services/recordService");
const clarificationService_1 = require("../services/clarificationService");
const confidenceScoreService_1 = require("../services/confidenceScoreService");
const auditService_1 = require("../services/auditService");
const userRepository_1 = require("../repositories/xml/userRepository");
async function runAuthAndRecordsTests() {
    console.log('▶ [TEST SUITE] Authentication, Verification & Security Workflows');
    const authService = new authService_1.AuthService();
    const recordService = new recordService_1.RecordService();
    const clarService = new clarificationService_1.ClarificationService();
    const confidenceService = new confidenceScoreService_1.ConfidenceScoreService();
    const auditService = new auditService_1.AuditService();
    const userRepo = new userRepository_1.UserRepository();
    const dummyMeta = {
        ip: '127.0.0.1',
        userAgent: 'test-runner',
        requestId: 'req-test-runner-01'
    };
    // Test 1: Admin and User Login
    console.log('  • Test 1: Authentication with bcrypt verification');
    const adminLogin = await authService.login('admin@mploychek.test', 'Admin@123', dummyMeta);
    (0, assert_1.default)(adminLogin.token, 'Token should be returned');
    assert_1.default.strictEqual(adminLogin.user.email, 'admin@mploychek.test');
    assert_1.default.strictEqual(adminLogin.user.role, 'ADMIN');
    const userLogin = await authService.login('user@mploychek.test', 'User@123', dummyMeta);
    (0, assert_1.default)(userLogin.token, 'Token should be returned');
    assert_1.default.strictEqual(userLogin.user.email, 'user@mploychek.test');
    assert_1.default.strictEqual(userLogin.user.role, 'USER');
    console.log('    ✓ Passed: Successful login for both Administrator and General User');
    // Test 2: Invalid Password and Non-existent User
    console.log('  • Test 2: Failed login handling & credential security');
    let passFailed = false;
    try {
        await authService.login('admin@mploychek.test', 'WrongPassword!123', dummyMeta);
    }
    catch {
        passFailed = true;
    }
    assert_1.default.strictEqual(passFailed, true, 'Bad password must be rejected');
    let missingUserFailed = false;
    try {
        await authService.login('nonexistent@test.com', 'Admin@123', dummyMeta);
    }
    catch {
        missingUserFailed = true;
    }
    assert_1.default.strictEqual(missingUserFailed, true, 'Non-existent user must be rejected');
    console.log('    ✓ Passed: Invalid credentials securely rejected');
    // Test 3: Confidence Score Calculation Rules
    console.log('  • Test 3: Rules-based Confidence Score calculation');
    const testRec = {
        employeeName: 'Jane Doe',
        employeeId: 'EMP-777',
        department: 'Engineering',
        jobTitle: 'Staff Engineer',
        startDate: '2025-01-01',
        employmentType: 'FULL_TIME',
        backgroundCheckStatus: 'PASSED'
    };
    const breakdown = confidenceService.calculateScore(testRec, [], []);
    (0, assert_1.default)(breakdown.score > 0, 'Score should be calculated');
    assert_1.default.strictEqual(breakdown.factors.length, 5, 'Should evaluate all 5 trust pillars');
    console.log(`    ✓ Passed: Confidence score engine calculated ${breakdown.score}/100 across 5 pillars`);
    // Test 4: Record creation by General User
    console.log('  • Test 4: Record creation with baseline confidence');
    const createdRecord = await recordService.createRecord({
        employeeId: 'EMP-UNIT-01',
        employeeName: 'Unit Test Worker',
        department: 'Technology',
        jobTitle: 'Software Architect',
        employmentType: 'FULL_TIME',
        startDate: '2026-01-01'
    }, userLogin.user, dummyMeta);
    assert_1.default.strictEqual(createdRecord.employeeName, 'Unit Test Worker');
    assert_1.default.strictEqual(createdRecord.verificationStatus, 'PENDING');
    console.log('    ✓ Passed: Record created with automatic timeline logging');
    // Test 5: Reviewer Decision (Admin only)
    console.log('  • Test 5: Admin verification decision');
    const decidedRecord = await recordService.recordVerificationDecision(createdRecord.id, 'VERIFIED', 'Credentials thoroughly reviewed during automated test pass.', 'Public approval notice', 'Confidential reviewer notes - verified', undefined, adminLogin.user, dummyMeta);
    assert_1.default.strictEqual(decidedRecord.verificationStatus, 'VERIFIED');
    assert_1.default.strictEqual(decidedRecord.assignedReviewerId, adminLogin.user.id);
    console.log('    ✓ Passed: Administrator verification decision recorded');
    // Test 6: Verify Audit Trail recorded the events
    console.log('  • Test 6: Audit Explorer event recording');
    const auditResult = await auditService.queryAuditTrail({
        organizationId: adminLogin.user.organizationId,
        entityId: createdRecord.id
    });
    (0, assert_1.default)(auditResult.items.length >= 2, 'Should have RECORD_CREATE and VERIFICATION_DECISION audit events');
    console.log(`    ✓ Passed: Found ${auditResult.items.length} immutable audit events recorded in XML`);
    console.log('✅ All Authentication & Verification workflow tests passed successfully.\n');
}
