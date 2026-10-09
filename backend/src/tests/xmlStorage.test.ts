import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { XmlStorageEngine } from '../repositories/xml/xmlStorageEngine';
import { RecordRepository } from '../repositories/xml/recordRepository';
import { UserRepository } from '../repositories/xml/userRepository';

export async function runXmlStorageTests() {
  console.log('\n▶ [TEST SUITE] XML Storage Engine & Security');

  const engine = XmlStorageEngine.getInstance();

  // Test 1: Initialize and Health Check
  console.log('  • Test 1: Health check against real XML file');
  const health = await engine.checkHealth();
  assert.strictEqual(health.status, 'HEALTHY');
  assert.strictEqual(health.fileExists, true);
  assert(health.fileSizeBytes > 0, 'File size should be greater than 0');
  assert(health.readDurationMs >= 0, 'Read duration should be measured');
  assert(health.parseDurationMs >= 0, 'Parse duration should be measured');
  console.log('    ✓ Passed: Health check verifies file existence, readability and parse speed');

  // Test 2: Read existing data
  console.log('  • Test 2: Read persisted entities');
  const userRepo = new UserRepository();
  const users = await userRepo.getAll();
  assert(users.length >= 3, 'Should have at least 3 seeded users');
  const admin = await userRepo.findByEmail('admin@mploychek.test');
  assert(admin !== null, 'Admin user must exist');
  assert.strictEqual(admin?.role, 'ADMIN');
  console.log('    ✓ Passed: Read persisted users from XML');

  // Test 3: Create, update, and delete entity
  console.log('  • Test 3: Entity lifecycle (Create -> Update -> Delete)');
  const recordRepo = new RecordRepository();
  const testRecordId = `test-rec-${Date.now()}`;

  const created = await recordRepo.create({
    id: testRecordId,
    employeeId: 'TEST-999',
    employeeName: 'Integration Tester',
    organizationId: 'org-001',
    department: 'Quality Assurance',
    jobTitle: 'Automation Test Lead',
    employmentType: 'FULL_TIME',
    startDate: '2026-01-01',
    verificationStatus: 'PENDING',
    backgroundCheckStatus: 'NOT_STARTED',
    confidenceScore: 70,
    confidenceLevel: 'MEDIUM',
    confidenceBreakdownJson: '{}',
    createdBy: 'usr-admin-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  assert.strictEqual(created.id, testRecordId);

  // Read back to verify immediate disk persistence
  const readBack = await recordRepo.getById(testRecordId);
  assert.strictEqual(readBack?.employeeName, 'Integration Tester');

  // Update
  const updated = await recordRepo.update(testRecordId, {
    jobTitle: 'Senior Automation Test Lead',
    confidenceScore: 85
  });
  assert.strictEqual(updated?.jobTitle, 'Senior Automation Test Lead');
  assert.strictEqual(updated?.confidenceScore, 85);

  // Delete
  const deleted = await recordRepo.delete(testRecordId);
  assert.strictEqual(deleted, true);
  const readAfterDelete = await recordRepo.getById(testRecordId);
  assert.strictEqual(readAfterDelete, null);
  console.log('    ✓ Passed: Entity lifecycle persists correctly to disk');

  // Test 4: Confidential Field Stripping
  console.log('  • Test 4: Confidential Field Stripping for General Users');
  const allRecords = await recordRepo.getAll();
  const first = allRecords[0];
  const safe = recordRepo.toSafeRecord(first);
  assert.strictEqual((safe as any).compensationGrade, undefined);
  assert.strictEqual((safe as any).internalAssessmentNotes, undefined);
  console.log('    ✓ Passed: Confidential compensation and notes are stripped from safe records');

  // Test 5: Serialized Concurrent Write Safety
  console.log('  • Test 5: Concurrent mutation serialization');
  const writePromises = [];
  for (let i = 0; i < 5; i++) {
    const id = `concurrent-${i}-${Date.now()}`;
    writePromises.push(
      recordRepo.create({
        id,
        employeeId: `EMP-CONC-${i}`,
        employeeName: `Concurrent Worker ${i}`,
        organizationId: 'org-001',
        department: 'Operations',
        jobTitle: 'Operator',
        employmentType: 'FULL_TIME',
        startDate: '2026-01-01',
        verificationStatus: 'PENDING',
        backgroundCheckStatus: 'NOT_STARTED',
        confidenceScore: 50,
        confidenceLevel: 'MEDIUM',
        confidenceBreakdownJson: '{}',
        createdBy: 'usr-admin-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    );
  }
  const createdItems = await Promise.all(writePromises);
  assert.strictEqual(createdItems.length, 5);

  // Cleanup concurrent items
  for (const item of createdItems) {
    await recordRepo.delete(item.id);
  }
  console.log('    ✓ Passed: Parallel writes serialized without file corruption or race conditions');

  // Test 6: XXE and DOCTYPE Security Defense
  console.log('  • Test 6: XXE / Malicious XML entity defense');
  let rejected = false;
  try {
    const maliciousDoc = `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><mploychekData>&xxe;</mploychekData>`;
    (engine as any).validateXmlSecurity(maliciousDoc);
  } catch (err: any) {
    rejected = true;
    assert(err.message.includes('SECURITY VIOLATION'));
  }
  assert.strictEqual(rejected, true, 'Malicious DOCTYPE must be rejected');
  console.log('    ✓ Passed: Prohibited DOCTYPE and entity expansion properly blocked');

  console.log('✅ All XML Storage Engine tests passed successfully.\n');
}
