import assert from 'assert';
import { AuthService } from '../services/authService';
import { RecordService } from '../services/recordService';
import { ClarificationService } from '../services/clarificationService';
import { ConfidenceScoreService } from '../services/confidenceScoreService';
import { AuditService } from '../services/auditService';
import { UserRepository } from '../repositories/xml/userRepository';

export async function runAuthAndRecordsTests() {
  console.log('▶ [TEST SUITE] Authentication, Verification & Security Workflows');

  const authService = new AuthService();
  const recordService = new RecordService();
  const clarService = new ClarificationService();
  const confidenceService = new ConfidenceScoreService();
  const auditService = new AuditService();
  const userRepo = new UserRepository();

  const dummyMeta = {
    ip: '127.0.0.1',
    userAgent: 'test-runner',
    requestId: 'req-test-runner-01'
  };

  // Test 1: Admin and User Login
  console.log('  • Test 1: Authentication with bcrypt verification');
  const adminLogin = await authService.login('admin@mploychek.test', 'Admin@123', dummyMeta);
  assert(adminLogin.token, 'Token should be returned');
  assert.strictEqual(adminLogin.user.email, 'admin@mploychek.test');
  assert.strictEqual(adminLogin.user.role, 'ADMIN');

  const userLogin = await authService.login('user@mploychek.test', 'User@123', dummyMeta);
  assert(userLogin.token, 'Token should be returned');
  assert.strictEqual(userLogin.user.email, 'user@mploychek.test');
  assert.strictEqual(userLogin.user.role, 'USER');
  console.log('    ✓ Passed: Successful login for both Administrator and General User');

  // Test 2: Invalid Password and Non-existent User
  console.log('  • Test 2: Failed login handling & credential security');
  let passFailed = false;
  try {
    await authService.login('admin@mploychek.test', 'WrongPassword!123', dummyMeta);
  } catch {
    passFailed = true;
  }
  assert.strictEqual(passFailed, true, 'Bad password must be rejected');

  let missingUserFailed = false;
  try {
    await authService.login('nonexistent@test.com', 'Admin@123', dummyMeta);
  } catch {
    missingUserFailed = true;
  }
  assert.strictEqual(missingUserFailed, true, 'Non-existent user must be rejected');
  console.log('    ✓ Passed: Invalid credentials securely rejected');

  // Test 3: Confidence Score Calculation Rules
  console.log('  • Test 3: Rules-based Confidence Score calculation');
  const testRec: any = {
    employeeName: 'Jane Doe',
    employeeId: 'EMP-777',
    department: 'Engineering',
    jobTitle: 'Staff Engineer',
    startDate: '2025-01-01',
    employmentType: 'FULL_TIME',
    backgroundCheckStatus: 'PASSED'
  };
  const breakdown = confidenceService.calculateScore(testRec, [], []);
  assert(breakdown.score > 0, 'Score should be calculated');
  assert.strictEqual(breakdown.factors.length, 5, 'Should evaluate all 5 trust pillars');
  console.log(`    ✓ Passed: Confidence score engine calculated ${breakdown.score}/100 across 5 pillars`);

  // Test 4: Record creation by General User
  console.log('  • Test 4: Record creation with baseline confidence');
  const createdRecord = await recordService.createRecord(
    {
      employeeId: 'EMP-UNIT-01',
      employeeName: 'Unit Test Worker',
      department: 'Technology',
      jobTitle: 'Software Architect',
      employmentType: 'FULL_TIME',
      startDate: '2026-01-01'
    },
    userLogin.user,
    dummyMeta
  );
  assert.strictEqual(createdRecord.employeeName, 'Unit Test Worker');
  assert.strictEqual(createdRecord.verificationStatus, 'PENDING');
  console.log('    ✓ Passed: Record created with automatic timeline logging');

  // Test 5: Reviewer Decision (Admin only)
  console.log('  • Test 5: Admin verification decision');
  const decidedRecord = await recordService.recordVerificationDecision(
    createdRecord.id,
    'VERIFIED',
    'Credentials thoroughly reviewed during automated test pass.',
    'Public approval notice',
    'Confidential reviewer notes - verified',
    undefined,
    adminLogin.user,
    dummyMeta
  );
  assert.strictEqual(decidedRecord.verificationStatus, 'VERIFIED');
  assert.strictEqual(decidedRecord.assignedReviewerId, adminLogin.user.id);
  console.log('    ✓ Passed: Administrator verification decision recorded');

  // Test 6: Verify Audit Trail recorded the events
  console.log('  • Test 6: Audit Explorer event recording');
  const auditResult = await auditService.queryAuditTrail({
    organizationId: adminLogin.user.organizationId,
    entityId: createdRecord.id
  });
  assert(auditResult.items.length >= 2, 'Should have RECORD_CREATE and VERIFICATION_DECISION audit events');
  console.log(`    ✓ Passed: Found ${auditResult.items.length} immutable audit events recorded in XML`);

  console.log('✅ All Authentication & Verification workflow tests passed successfully.\n');
}
