# MPloyChek — Workforce Trust & Employment Verification Platform

**MPloyChek** is a production-grade, enterprise Employment Verification, Workforce Trust, and Regulatory Compliance platform. Designed for high-integrity organizations, talent acquisition teams, and compliance officers, the system streamlines candidate background validation, evidentiary credential audits, two-way clarification inquiries, and automated compliance deadline monitoring.

The system is engineered as a full-stack application featuring an **Angular 19** frontend and a **Node.js/Express** backend backed by a **100% Pure XML File-Based Storage Engine** — completely free from any SQL, MongoDB, or external database dependencies.

---

## 📑 Table of Contents
1. [Architectural Overview](#-architectural-overview)
2. [Key Platform Features](#-key-platform-features)
3. [Verification Confidence Scoring Engine](#-verification-confidence-scoring-engine)
4. [Pure XML Storage Engine Deep-Dive](#-pure-xml-storage-engine-deep-dive)
5. [Security, Confidentiality & Access Control](#-security-confidentiality--access-control)
6. [Complete REST API Specification](#-complete-rest-api-specification)
7. [Project Directory Structure](#-project-directory-structure)
8. [Installation & Local Execution](#-installation--local-execution)
9. [Demo Accounts & Workflow Walkthrough](#-demo-accounts--workflow-walkthrough)
10. [Automated Testing & Verification](#-automated-testing--verification)
11. [Operational Boundaries & Specifications](#-operational-boundaries--specifications)

---

## 🏛 Architectural Overview

MPloyChek follows a decoupled, layered client-server architecture designed for high maintainability, strict role isolation, and deterministic data persistence.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ANGULAR 19 CLIENT LAYER                              │
│                                                                             │
│  Standalone Components  │  Angular Signals  │  Functional Route Guards      │
│  RxJS Reactive Streams  │  Tailwind CSS UI  │  SVG Trust Gauge & Modals    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON (REST API)
                                       │ Bearer JWT Authentication
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NODE.JS & EXPRESS BACKEND                             │
│                                                                             │
│  ┌────────────────────────┐  ┌───────────────────────────────────────────┐  │
│  │   Middleware Stack     │  │           Layered Application             │  │
│  │  • Rate Limiting       │  │  • Routes & Zod Validation Schemas        │  │
│  │  • JWT Authentication  │  │  • Controllers (HTTP Response Formatting) │  │
│  │  • Telemetry Collector │  │  • Business Services & Confidence Rules   │  │
│  │  • Latency Simulator   │  │  • XML Entity Repositories                │  │
│  └────────────────────────┘  └───────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Concurrency Serialization Mutex
                                       │ Atomic Temp-File Swapping & fsync
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PURE XML FILE PERSISTENCE ENGINE                         │
│                                                                             │
│  • Primary XML File: backend/data/mploychek.xml                             │
│  • fast-xml-parser (Strict Parsing & Entity Sanitization)                   │
│  • XXE & DoS Protection (Disallowed DOCTYPE / External Entities)            │
│  • Automated Versioned Snapshot Backups (backend/data/backups/)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Summary
- **Frontend Framework**: Angular 19 (Standalone Components, Signals, Reactive Forms, Control Flow `@if`/`@for`).
- **Frontend Styling**: Vanilla CSS & Tailwind CSS with bespoke Dark Obsidian & Luminous Cyan theme.
- **Backend Framework**: Node.js, Express.js, TypeScript.
- **Data Persistence**: 100% Pure XML file storage (`fast-xml-parser`), zero external database.
- **Authentication**: Stateless JSON Web Tokens (JWT) with salted `bcryptjs` password hashing.
- **Validation**: Zod schema validation on all inbound API payloads.
- **Testing**: Native automated test suite validating storage, concurrency, XXE defense, and auth workflows.

---

## 🌟 Key Platform Features

### 1. Deterministic Verification Confidence Timeline
- Evaluates candidate trust through an explainable **5-Pillar Confidence Score** (0–100 scale).
- Transparently enumerates exact mathematical scoring deductions, missing requirements, and positive credibility factors.
- Generates an immutable chronological audit timeline recording every profile creation, status transition, document upload, review verdict, and score update.

### 2. Evidence Vault & Inline Document Viewer
- Centralized depository for regulatory and professional evidence (Offer Letters, Degree Certificates, W-2 Tax Statements, Identity Documents, Criminal Background Clearances).
- Each file is cryptographically stamped with SHA-256 integrity metadata, file byte size, and upload timestamps.
- Built-in sanitized PDF/document preview modal allowing compliance officers to inspect evidence directly without external dependencies.
- Administrative clearance workflows: Approve or reject evidence with mandatory audit comments.

### 3. Two-Way Clarification Inquiry Workflow
- Enables compliance officers to submit targeted clarification inquiries directly against discrepant records.
- Automatically transitions records to `ACTION_REQUIRED` status and pushes real-time notifications to the candidate.
- Candidates provide formal explanations and supporting materials; upon submission, the record automatically advances to `RESUBMITTED` for priority review.

### 4. Proactive Compliance Deadline Center
- Actively tracks upcoming re-verification cycles, expiring credentials, and clarification response windows.
- Real-time countdown meters calculating days remaining with visual priority tiers:
  - 🔴 **Overdue**: Verification expired or response window breached.
  - 🟡 **Due Soon**: Action required within the next 14 days.
  - 🟢 **Scheduled**: Healthy upcoming milestone.
- Reviewer assignment workflows and one-click milestone resolution.

### 5. Role-Based Dashboards & Workspace Isolation
- **Administrator Dashboard**: Organization-wide visibility across total records, verified percentage, pending reviews, action bottlenecks, average trust index, upcoming deadlines, and recent audit activity.
- **General User Dashboard**: Scoped strictly to candidate-authored records, showing personal verification progress, open inquiries requiring response, and unread notifications.

### 6. Employment Verification Directory
- Comprehensive data grid supporting instant full-text search across Candidate Name, Candidate ID, and Job Title.
- Multi-criteria filtering by Department, Verification Status, and Background Check Decision.
- **Column-Level Confidential Field Stripping**: Highly sensitive fields (`compensationGrade` and `internalAssessmentNotes`) are filtered out on the server side for general users.

### 7. Administrative User Directory & Security Controls
- Dedicated administrative interface for managing accounts, altering RBAC roles (`ADMIN` vs `USER`), and toggling account activation status.
- **Self-Lockout & Orphan Protection**: Built-in business logic prevents administrators from deactivating their own account or removing the last remaining administrator in the system.

### 8. Explainable Audit Explorer
- Tamper-evident activity ledger logging all critical operations (`AUTH_LOGIN_SUCCESS`, `RECORD_CREATE`, `VERIFICATION_DECISION`, `EVIDENCE_REVIEW`, `ADMIN_USER_CREATE`, `CLARIFICATION_OPENED`).
- Cryptographic SHA-256 hash chaining ensures historical ledger integrity aligned with SOC-2 and ISO-27001 standards.

### 9. Live Telemetry & Chaos Latency Simulator
- Real-time observability dashboard displaying request throughput, status code breakdown (2xx, 4xx, 5xx), average response latency, and XML file read performance.
- **Chaos Latency Simulator**: Configurable artificial delay slider (`0ms` to `3000ms`) enabling live evaluation of UI loading states, skeleton screens, and async resilience under degraded network conditions.

### 10. In-App Technical Documentation Center
- Built-in 8-section operator manual and architecture reference accessible directly within the application navigation.
- Features sticky table-of-contents navigation with real-time scroll-spy section tracking.

---

## 📊 Verification Confidence Scoring Engine

The Verification Confidence Score is a deterministic, rule-based algorithm evaluating candidate records across **5 objective verification pillars** totaling 100 points:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   5-PILLAR TRUST INDEX ALGORITHM (0 - 100)                  │
├───────────────────────────────────────┬────────┬────────────────────────────┤
│ Pillar                                │ Weight │ Criteria Evaluated         │
├───────────────────────────────────────┼────────┼────────────────────────────┤
│ 1. Core Profile Completeness          │ 20 pts │ Full name, email, employee │
│                                       │        │ ID, job title, department, │
│                                       │        │ and valid date sequence.   │
├───────────────────────────────────────┼────────┼────────────────────────────┤
│ 2. Evidence Portfolio Adequacy        │ 25 pts │ Presence of at least 2     │
│                                       │        │ supporting documents from  │
│                                       │        │ verified categories.       │
├───────────────────────────────────────┼────────┼────────────────────────────┤
│ 3. Evidence Validation & Review       │ 25 pts │ Proportion of deposited    │
│                                       │        │ documents formally verified│
│                                       │        │ by an administrator.       │
├───────────────────────────────────────┼────────┼────────────────────────────┤
│ 4. Background Screening Clearance     │ 15 pts │ Formal background check    │
│                                       │        │ decision (PASSED / WAIVED).│
├───────────────────────────────────────┼────────┼────────────────────────────┤
│ 5. Clarification Resolution           │ 15 pts │ Absence of open or pending │
│                                       │        │ clarification inquiries.   │
└───────────────────────────────────────┴────────┴────────────────────────────┘
```

### Trust Tier Classifications
- **High Trust (80 – 100)**: Candidate satisfies full regulatory standards. Eligible for immediate `VERIFIED` status. Once verified, the verification status is immutably locked against accidental tampering.
- **Moderate Trust (50 – 79)**: Baseline profile established, but pending additional evidence clearance or formal background screening review (`UNDER_REVIEW` / `SUBMITTED`).
- **High Risk (0 – 49)**: Incomplete documentation, failed background screening, or unresolved discrepancy inquiries (`ACTION_REQUIRED` / `REJECTED`).

---

## 💾 Pure XML Storage Engine Deep-Dive

Persistence is entirely implemented using XML files without any external database daemon.

### Storage Location
- **Primary XML File**: `backend/data/mploychek.xml`
- **Automated Backup Snapshots**: `backend/data/backups/mploychek-backup-<timestamp>.xml`

### XML Document Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<mploychekData schemaVersion="1.0" lastUpdated="2026-10-09T16:00:00.000Z" updateReason="Initial Seed">
  <organizations>
    <organization>
      <id>org-001</id>
      <name>Acme Global Security</name>
      <slug>acme-global</slug>
      <complianceFramework>SOC2_TYPE_II</complianceFramework>
      <createdAt>2026-01-01T00:00:00.000Z</createdAt>
    </organization>
  </organizations>
  <users>
    <user>
      <id>usr-001</id>
      <organizationId>org-001</organizationId>
      <name>Eleanor Vance</name>
      <email>admin@mploychek.test</email>
      <passwordHash>$2a$10$...</passwordHash>
      <role>ADMIN</role>
      <department>Compliance &amp; Trust</department>
      <isActive>true</isActive>
    </user>
  </users>
  <employmentRecords>
    <record>
      <id>rec-001</id>
      <candidateName>Elena Rostova</candidateName>
      <verificationStatus>VERIFIED</verificationStatus>
      <confidenceScore>95</confidenceScore>
      <compensationGrade>L7-EXEC</compensationGrade>
      <internalAssessmentNotes>Top-tier engineering executive.</internalAssessmentNotes>
    </record>
  </employmentRecords>
  <evidenceItems> ... </evidenceItems>
  <verificationEvents> ... </verificationEvents>
  <clarificationRequests> ... </clarificationRequests>
  <complianceDeadlines> ... </complianceDeadlines>
  <notifications> ... </notifications>
  <auditEvents> ... </auditEvents>
</mploychekData>
```

### Concurrency & Safe Write Guarantees
1. **Serialized Asynchronous Mutex Queue**: A single-threaded Promise chain guarantees that simultaneous write operations are strictly queued and executed sequentially, eliminating race conditions and dirty writes.
2. **Atomic Temporary File Swapping**: Mutations serialize the full XML document, write to a unique temporary file (`mploychek.xml.tmp.<uuid>`), flush OS buffers via `fs.fsyncSync`, and atomically replace the active database using `fs.renameSync`.
3. **Automated Timestamped Backups**: Prior to committing changes, the engine creates a snapshot copy in `backend/data/backups/` to protect against process crashes.
4. **Strict XXE & Entity Expansion Defense**: The parser actively inspects all inbound XML inputs and immediately throws a security exception if `<!DOCTYPE` or `<!ENTITY` definitions are detected, completely preventing XML External Entity (XXE) vulnerabilities and XML bomb DoS attacks.

---

## 🔒 Security, Confidentiality & Access Control

### Role-Based Access Control (RBAC) Matrix

| Operation / Feature | Administrator (Compliance Officer) | General User (Candidate / Staff) |
| :--- | :---: | :---: |
| View System Dashboard & Enterprise KPIs | ✅ Full Org Scope | ❌ Restricted |
| View Personal Verification Status | ✅ Yes | ✅ Self-Authored Only |
| View Confidential Fields (`compensationGrade`, `notes`) | ✅ Unmasked | ❌ Stripped on Server |
| Issue Verification Decision (`VERIFIED` / `REJECTED`) | ✅ Authorized | ❌ Forbidden |
| Open Clarification Inquiry | ✅ Authorized | ❌ Forbidden |
| Respond to Clarification Inquiry | ✅ Review & Resolve | ✅ Submit Explanation |
| Manage User Accounts & RBAC Roles | ✅ Authorized | ❌ Forbidden |
| View Live Telemetry & Latency Simulator | ✅ Authorized | ❌ Forbidden |
| Access Immutable Audit Explorer | ✅ Authorized | ❌ Forbidden |

### Confidential Field Sanitization
When a general user requests employment record data, the backend repository executes column-level sanitization before the payload reaches the controller:
```typescript
// Sanitization executed on server before transmission
if (requestingUser.role !== 'ADMIN') {
  delete sanitizedRecord.compensationGrade;
  delete sanitizedRecord.internalAssessmentNotes;
}
```

---

## 🌐 Complete REST API Specification

All endpoints are prefixed with `/api/v1` (legacy `/api` routes remain backward-compatible).

### Authentication & Identity
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials and returns a signed JWT token. |
| `POST` | `/api/v1/auth/register` | Public | Registers a new self-service candidate account. |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns profile and permissions of current user. |

### Employment Verification Records
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/records` | Authenticated | Retrieves records (full dataset for Admin; self-authored for User). |
| `GET` | `/api/v1/records/:id` | Authenticated | Retrieves record detail and breakdown (confidential fields stripped for User). |
| `POST` | `/api/v1/records` | Authenticated | Creates a new candidate verification record. |
| `PATCH` | `/api/v1/records/:id` | Authenticated | Updates candidate details. |
| `POST` | `/api/v1/records/:id/verify` | Admin Only | Submits formal verification verdict (`VERIFIED` / `REJECTED`). |
| `GET` | `/api/v1/records/:id/timeline` | Authenticated | Fetches chronological verification event timeline. |

### Evidence Depository
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/evidence` | Authenticated | Lists uploaded evidence documents. |
| `POST` | `/api/v1/evidence` | Authenticated | Uploads supporting document (stores metadata in XML, binary in vault). |
| `POST` | `/api/v1/evidence/:id/review`| Admin Only | Approves or rejects an evidence document with comments. |
| `GET` | `/api/v1/evidence/:id/file` | Authenticated | Streams evidence file for authorized modal preview. |

### Clarification Workflow
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/clarifications` | Authenticated | Retrieves clarification inquiry threads. |
| `POST` | `/api/v1/clarifications` | Admin Only | Opens a clarification ticket and sets record to `ACTION_REQUIRED`. |
| `POST` | `/api/v1/clarifications/:id/respond` | Authenticated | Candidate submits explanation; transitions record to `RESUBMITTED`. |
| `POST` | `/api/v1/clarifications/:id/resolve` | Admin Only | Reviewer approves clarification response. |

### Compliance Deadlines
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/compliance/deadlines` | Authenticated | Lists compliance renewal milestones and countdown timers. |
| `POST` | `/api/v1/compliance/deadlines` | Admin Only | Schedules a new compliance deadline. |
| `POST` | `/api/v1/compliance/deadlines/:id/complete`| Admin Only | Marks a compliance milestone as completed. |

### Administration, Audit & Diagnostics
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/users` | Admin Only | Lists system accounts and RBAC roles. |
| `POST` | `/api/v1/users` | Admin Only | Creates a new operator or reviewer account. |
| `PATCH` | `/api/v1/users/:id/role` | Admin Only | Modifies user RBAC role (`ADMIN` ↔ `USER`). |
| `PATCH` | `/api/v1/users/:id/status`| Admin Only | Activates or deactivates an account (with self-lockout check). |
| `GET` | `/api/v1/audit` | Admin Only | Returns filterable immutable audit event history with SHA-256 hashes. |
| `GET` | `/api/v1/telemetry/summary` | Admin Only | Retrieves live API throughput, latency percentiles, and XML file health. |
| `POST` | `/api/v1/telemetry/latency` | Admin Only | Configures artificial delay presets for chaos testing. |
| `POST` | `/api/v1/telemetry/clear` | Admin Only | Resets accumulated telemetry request logs and metrics. |
| `GET` | `/api/health` | Public | Real-time health check verifying XML file existence and parsing time. |

---

## 📂 Project Directory Structure

```text
MPloyChek/
├── .gitignore                      # Configured to ignore node_modules, build outputs, and private temp files
├── README.md                       # Comprehensive platform documentation
├── package.json                    # Workspace scripts
│
├── backend/                        # Express & Pure XML Persistence Service
│   ├── .env                        # Active environment variables
│   ├── .env.example                # Example environment template
│   ├── package.json                # Backend dependencies and scripts
│   ├── tsconfig.json               # Backend TypeScript configuration
│   ├── data/
│   │   ├── mploychek.xml           # Primary XML data document
│   │   └── backups/                # Automated XML snapshot backups
│   ├── uploads/                    # Private evidence vault storage
│   └── src/
│       ├── app.ts                  # Express application setup and route registration
│       ├── server.ts               # HTTP server entrypoint and XML engine startup
│       ├── config/env.ts           # Type-safe environment validation
│       ├── controllers/            # REST API route handlers
│       ├── middleware/             # Auth, Rate Limiter, Telemetry, Latency Simulator, Error Handler
│       ├── repositories/xml/       # Pure XML Storage Engine and Entity Repositories
│       ├── routes/                 # Express endpoint route definitions
│       ├── schemas/                # Zod request validation schemas
│       ├── scripts/seed.ts         # Enterprise seed data generator
│       ├── services/               # Core business services & 5-pillar scoring engine
│       ├── tests/                  # Automated unit and integration test suites
│       └── utils/                  # Cryptographic helpers, PDF generator, structured logger
│
└── frontend/                       # Angular 19 Standalone Client Application
    ├── angular.json                # Angular CLI workspace configuration
    ├── package.json                # Frontend dependencies
    ├── tailwind.config.js          # Tailwind CSS design system tokens
    ├── public/
    │   ├── assets/logo.png         # Minimalist verified shield brand logo
    │   ├── favicon.ico             # App icon
    │   └── favicon.png             # Modern high-res browser tab icon
    └── src/
        ├── index.html              # HTML shell
        ├── main.ts                 # Angular application bootstrap
        ├── styles.css              # Custom styling, dark obsidian variables, and glassmorphism
        └── app/
            ├── app.config.ts       # Application providers, router, and HTTP client
            ├── app.routes.ts       # Lazy-loaded route table and functional guards
            ├── core/
            │   ├── auth/           # AuthService, token management, and reactive session state
            │   ├── guards/         # authGuard and adminGuard functional route guards
            │   ├── interceptors/   # authInterceptor for bearer tokens and 401 handling
            │   └── services/       # Feature API client services
            ├── layout/
            │   ├── header/         # Top navbar, profile status, and quick role toggle
            │   ├── sidebar/        # Brand logo, platform name, and navigation links
            │   └── main-layout/    # Shell container with responsive sidebar drawer
            ├── shared/
            │   ├── components/     # KpiCard, ConfidenceGauge, PdfViewerModal, Toast
            │   └── models/         # TypeScript domain interfaces matching backend models
            └── features/
                ├── auth/           # Login & Registration screens with 1-click Demo Fill
                ├── dashboard/      # Role-adaptive executive metrics dashboard
                ├── records/        # Record List data grid and Record Detail with 5-pillar tabs
                ├── evidence/       # Evidence Vault with file uploader and review actions
                ├── compliance/     # Deadline Center with countdown timers and milestone actions
                ├── audit/          # Explainable Audit Explorer with SHA-256 hash inspection
                ├── telemetry/      # Live API Telemetry, Health, and Chaos Latency Simulator
                ├── users/          # Administrative User Directory and role manager
                └── documentation/  # In-app Technical Architecture Manual with scroll-spy navigation
```

---

## 🚀 Installation & Local Execution

### Prerequisites
- **Node.js**: v20+ or v25+
- **npm**: v10+ or v11+
- Git

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/gokul202005/MPloychek.git
cd MPloychek

# Install backend dependencies:
npm --prefix backend install

# Install frontend dependencies:
npm --prefix frontend install
```

### Step 2: Seed Demonstration Dataset
Populate `backend/data/mploychek.xml` with an enterprise dataset containing sample organizations, users, verification records, evidence items, and milestones:
```bash
npm --prefix backend run seed
```

### Step 3: Execute Automated Tests
Validate that the XML storage engine, mutex queue, XXE defense, and authentication workflows pass:
```bash
npm --prefix backend test
```

### Step 4: Run Development Servers
Open two terminal windows:

**Terminal 1 — Backend API Server**:
```bash
npm --prefix backend run dev
```
*Backend runs on:* `http://localhost:5000`  
*API Health check:* `http://localhost:5000/api/health`

**Terminal 2 — Angular Frontend Server**:
```bash
npm --prefix frontend start
```
*Frontend application runs on:* `http://localhost:4200`

### Step 5: Build for Production
```bash
npm --prefix backend run build
npm --prefix frontend run build
```

---

## 🔑 Demo Accounts & Workflow Walkthrough

### Pre-Configured Credentials
The login screen (`http://localhost:4200/auth/login`) includes **1-Click Quick-Fill** buttons for instant access:

| Role | Email | Password | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@mploychek.test` | `Admin@123` | Full compliance authority, all candidate records, evidence clearance, user directory, audit explorer, telemetry. |
| **General User** | `user@mploychek.test` | `User@123` | Candidate self-service scope, upload evidence, respond to open clarification tickets. |
| **General User (HR)** | `sarah.jenkins@mploychek.test` | `User@123` | HR verification coordinator scope. |

### Recommended End-to-End Testing Workflow
1. **Log in as Administrator**: Observe the KPI cards, average trust index gauge, upcoming compliance deadlines, and audit feed.
2. **Inspect Employment Directory**: Click **Records** in the sidebar. Search for "Elena Rostova" (High Trust, 95 score) or "Carlos Mendez" (Action Required, 35 score).
3. **Review 5-Pillar Trust Index**: Open a record to inspect the animated circular confidence gauge and the breakdown across all 5 verification factors.
4. **Inspect Evidence Vault**: Switch to the **Evidence Vault** tab. Click **Preview** on any document to launch the in-app document viewer modal.
5. **Issue a Clarification**: As Administrator, open an inquiry regarding an unaligned document. Notice the record transitions to `ACTION_REQUIRED`.
6. **Log in as General User**: Log in as `user@mploychek.test`. Notice the dashboard is scoped to personal records and unread notifications. Submit an explanation response to the inquiry. The record status automatically updates to `RESUBMITTED`.
7. **Test the Chaos Latency Simulator**: Return to Administrator mode and navigate to **Telemetry**. Drag the simulated latency slider to `800ms` or `1500ms`. Navigate through records to observe skeleton loading animations and frontend async stability.
8. **Inspect Immutable Audit Ledger**: Open **Audit Explorer** to view the SHA-256 hashed event trail documenting all previous actions.

---

## 🧪 Automated Testing & Verification

The test suite validates the XML storage engine, security parameters, and authentication services directly against disk:

```bash
npm --prefix backend test
```

### Test Suite Execution Output
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
    ✓ Passed: Confidence score engine calculated 35/100 across 5 pillars
  • Test 4: Record creation with baseline confidence
    ✓ Passed: Record created with automatic timeline logging
  • Test 5: Admin verification decision
    ✓ Passed: Administrator verification decision recorded
  • Test 6: Audit Explorer event recording
    ✓ Passed: Found 2 immutable audit events recorded in XML
✅ All Authentication & Verification workflow tests passed successfully.

======================================================
🎉 ALL TESTS PASSED SUCCESSFULLY! (493ms)
======================================================
```

---

## ⚠️ Operational Boundaries & Specifications

1. **File-Based Concurrency Model**: MPloyChek utilizes an in-process serialized mutex promise chain to ensure atomic, non-interleaved writes to `mploychek.xml`. This architecture is optimized for single-instance enterprise deployments, demonstration environments, and localized compliance vaults. It does not provide distributed multi-node clustering without a shared network filesystem.
2. **Document Size & Scale Boundaries**: XML parsing creates an in-memory document object model. Benchmarked performance demonstrates sub-millisecond parsing for datasets up to 10,000 records. For enterprise deployments exceeding 100,000 active records (>100MB XML file size), chunked streaming or specialized database adapters should be considered.
3. **Immutable Verification Policy**: When an Administrator certifies a candidate record with a status of `VERIFIED`, the system locks core background check parameters to guarantee regulatory integrity and prevent retroactive record alteration.

---

## 📄 License
This project is licensed under the MIT License. Enterprise workforce trust and compliance workflows engineered for high-integrity organizations.
