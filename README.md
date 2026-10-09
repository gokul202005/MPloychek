# MPloyChek — Workforce Trust & Employment Verification Platform

**MPloyChek** is a full-stack, enterprise-grade Employment Verification, Workforce Trust & Compliance platform. It empowers organizations to manage verified employee records, deposit and review supporting evidence, control confidential information with role-based access, track critical compliance deadlines, and maintain an immutable, auditable history of important actions.

Built with **Angular 19**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, and a **100% XML file-based storage engine**.

---

## 🌟 Key Product Features

### 1. Verification Confidence Timeline (Unique Feature)
- **Deterministic 5-Pillar Trust Index (0–100)**: Evaluates Core Profile Completeness (20%), Evidence Portfolio Adequacy (25%), Evidence Validation & Review (25%), Background Screening (15%), and Clarification Resolution (15%).
- **Explainable Scoring**: Transparently details why a score was awarded, displaying specific gap descriptions and factor weights rather than an opaque number.
- **Chronological Auditable Timeline**: Records every lifecycle transition, evidence deposit, review decision, clarification ticket, and trust score delta.

### 2. Evidence Vault & Two-Way Clarification Workflow (Unique Feature)
- **Evidence Vault**: Secure metadata catalog and private filesystem vault for sensitive employment documents (Offer Letters, Degree Transcripts, IRS Form W-2s, Government IDs).
- **Two-Way Clarification System**: Reviewers can issue specific clarification inquiries on discrepancies, automatically shifting verification to `ACTION_REQUIRED`. Workers submit formal explanations, automatically advancing records to `RESUBMITTED` for clearance.
- **Authorized Previews & Downloads**: Protected against path traversal and unauthorized inspection.

### 3. Role-Based Dashboards
- **Administrator Dashboard**: Organization-wide metrics (Total records, Verified count, Pending reviews, Action Required bottlenecks, Average trust index, upcoming milestones, recent audit events).
- **General User Dashboard**: Scoped strictly to records authored by or assigned to the worker, showing their verification progress, open inquiries requiring response, and in-app notifications.

### 4. Employment Verification Directory
- Comprehensive data grid with full-text search (name, ID, job title), multi-criteria filters (Status, Department), and sorting.
- Confidential field masking: `compensationGrade` and `internalAssessmentNotes` are restricted exclusively to Administrators on the server side.

### 5. Compliance Deadline Center
- Proactively tracks upcoming re-verification cycles, clarification response windows, and expiring credentials.
- Dynamic countdown timers, overdue badges, priority tiers, and reviewer assignments.

### 6. Admin User Management
- Administrator-only account directory supporting role modifications, account activation/deactivation, and creation.
- **Security Safeguard**: Protects against self-lockout or deactivation of the last active administrator account.

### 7. Explainable Audit Explorer
- Searchable and filterable history of critical actions (`AUTH_LOGIN_SUCCESS`, `RECORD_CREATE`, `VERIFICATION_DECISION`, `EVIDENCE_REVIEW`, `ADMIN_USER_CREATE`).
- Immutable: Audit entries cannot be edited or deleted through normal operations.

### 8. Live Telemetry & XML Storage Diagnostics
- Observes inbound HTTP requests, status code distribution (2xx, 4xx, 5xx), and duration latency.
- **Real XML Storage Health Check**: Measures actual file existence, file size, filesystem read latency, and XML schema parsing benchmark in milliseconds.
- **Development Latency Simulator**: Toggleable artificial delay presets (0ms, 150ms, 350ms, 800ms, 1500ms) for testing asynchronous UI states.

---

## 📁 Architecture & Technology Stack

- **Frontend**: Angular 19, TypeScript, Tailwind CSS, Angular Signals, Reactive Forms, Standalone Components.
- **Backend**: Node.js, Express.js, TypeScript, Zod Schema Validation, bcryptjs, JSON Web Tokens (JWT).
- **Persistence**: **100% XML Files Only** (`backend/data/mploychek.xml`). Absolutely no MongoDB, SQL, SQLite, or Firebase.
- **XML Engine**: `fast-xml-parser` parser and builder with XML entity escaping and strict XXE injection defense.

### XML Data Schema Architecture

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mploychekData schemaVersion="1.0" lastUpdated="..." updateReason="...">
  <organizations>
    <organization> ... </organization>
  </organizations>
  <users>
    <user> ... </user>
  </users>
  <employmentRecords>
    <record> ... </record>
  </employmentRecords>
  <evidenceItems>
    <evidence> ... </evidence>
  </evidenceItems>
  <verificationEvents>
    <event> ... </event>
  </verificationEvents>
  <clarificationRequests>
    <clarification> ... </clarification>
  </clarificationRequests>
  <complianceDeadlines>
    <deadline> ... </deadline>
  </complianceDeadlines>
  <notifications>
    <notification> ... </notification>
  </notifications>
  <auditEvents>
    <auditEvent> ... </auditEvent>
  </auditEvents>
</mploychekData>
```

### Safe File Write Guarantees
1. **Serialized Queue**: An asynchronous mutex promise chain guarantees that concurrent API requests never interleave writes.
2. **Atomic Writes**: Writes first serialize valid XML, write to a temporary file (`mploychek.xml.tmp.<uuid>`) in the same folder, flush file descriptors (`fs.fsyncSync`), and atomically rename over the main data file.
3. **Automated Snapshots**: Creates a timestamped backup snapshot in `backend/data/backups/` before replacing the active file.
4. **No Silent Reset**: If XML is corrupted or malformed, the server fails loudly with diagnostics rather than silently resetting user records.

---

## 🔐 Security & Access Control

- **XXE & DoS Defense**: XML strings containing `<!DOCTYPE` or `<!ENTITY` declarations are immediately rejected prior to parsing.
- **Private Data Directories**: Neither `backend/data/` nor `backend/uploads/` are exposed as static assets.
- **Password Protection**: Plaintext passwords are never saved to XML; password hashes use salted `bcryptjs`.
- **Role Isolation**: General Users cannot read compensation grades or internal notes even if manually constructing HTTP requests.

---

## 🚀 Quickstart & Local Execution

### Prerequisites
- Node.js (v20+ or v25+)
- npm (v10+ or v11+)

### 1. Install Dependencies
```bash
# In the repository root:
npm --prefix backend install
npm --prefix frontend install
```

### 2. Seed Demonstration Data
Populates the XML file with a comprehensive dataset (organizations, users, records, evidence, timelines, deadlines, audits):
```bash
npm --prefix backend run seed
```

### 3. Run Automated Tests
Executes the XML storage and backend API test suite:
```bash
npm --prefix backend run test
```

### 4. Build Production Bundles
```bash
npm --prefix backend run build
npm --prefix frontend run build
```

### 5. Start Application Locally

**Terminal 1 — Express Backend**:
```bash
npm --prefix backend run dev
```
*Backend runs at:* `http://localhost:5000`  
*Health endpoint:* `http://localhost:5000/api/health`

**Terminal 2 — Angular Frontend**:
```bash
npm --prefix frontend start
```
*Frontend runs at:* `http://localhost:4200`

---

## 🔑 Demo Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@mploychek.test` | `Admin@123` | Full compliance, all records, audits, user admin, telemetry |
| **General User** | `user@mploychek.test` | `User@123` | Self-authored records, evidence upload, inquiry responses |
| **General User (HR)** | `sarah.jenkins@mploychek.test` | `User@123` | HR verification coordinator scope |

*(The login screen also provides 1-click Quick-Fill buttons for both roles)*

---

## 🧪 Automated Test Results

```text
======================================================
🧪 MPloyChek Automated Backend & XML Test Suite
======================================================

▶ [TEST SUITE] XML Storage Engine & Security
  • Test 1: Health check against real XML file
    ✓ Passed: Health check verifies file existence, readability and parse speed
  • Test 2: Read persisted entities
    ✓ Passed: Read persisted users from XML
  • Test 3: Entity lifecycle (Create -> Update -> Delete)
    ✓ Passed: Entity lifecycle persists correctly to disk
  • Test 4: Confidential Field Stripping for General Users
    ✓ Passed: Confidential compensation and notes are stripped from safe records
  • Test 5: Concurrent mutation serialization
    ✓ Passed: Parallel writes serialized without file corruption or race conditions
  • Test 6: XXE / Malicious XML entity defense
    ✓ Passed: Prohibited DOCTYPE and entity expansion properly blocked
✅ All XML Storage Engine tests passed successfully.

▶ [TEST SUITE] Authentication, Verification & Security Workflows
  • Test 1: Authentication with bcrypt verification
    ✓ Passed: Successful login for both Administrator and General User
  • Test 2: Failed login handling & credential security
    ✓ Passed: Invalid credentials securely rejected
  • Test 3: Rules-based Confidence Score calculation
    ✓ Passed: Confidence score engine calculated across 5 pillars
  • Test 4: Record creation with baseline confidence
    ✓ Passed: Record created with automatic timeline logging
  • Test 5: Admin verification decision
    ✓ Passed: Administrator verification decision recorded
  • Test 6: Audit Explorer event recording
    ✓ Passed: Immutable audit events recorded in XML
✅ All Authentication & Verification workflow tests passed successfully.

======================================================
🎉 ALL TESTS PASSED SUCCESSFULLY!
======================================================
```

---

## ⚠️ Known Limitations & Deployment Boundaries

1. **File-Based Concurrency**: MPloyChek utilizes a single-process serialized mutex queue for safe XML writes. It is designed specifically for local execution, demonstrations, and single-instance deployments. It does not provide the multi-instance horizontal clustering guarantees of a distributed database.
2. **Large Datasets**: XML parsing involves in-memory DOM object construction. While well-suited for several thousand records with sub-millisecond parsing, exceptionally large document sizes (>100MB) will require database migration for high-throughput enterprise scale.
