import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-docs-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight">MPloyChek Architecture & Operator Manual</h1>
        <p class="text-sm text-slate-400 mt-1 font-medium">
          Comprehensive enterprise technical reference, regulatory workflows, and XML storage mechanics
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Table of Contents Sticky Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-24 glass-panel p-4 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3 px-2">
              Documentation Sections
            </span>

            <button
              type="button"
              (click)="scrollToSection('overview', $event)"
              class="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between"
              [ngClass]="activeSection === 'overview' ? 'bg-brand-500/15 text-brand-300 font-bold border border-brand-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            >
              <span>1. Product Overview</span>
              <span *ngIf="activeSection === 'overview'" class="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('roles', $event)"
              class="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between"
              [ngClass]="activeSection === 'roles' ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            >
              <span>2. Roles & Authorization</span>
              <span *ngIf="activeSection === 'roles'" class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('xml-storage', $event)"
              class="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between"
              [ngClass]="activeSection === 'xml-storage' ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            >
              <span>3. XML Storage Engine</span>
              <span *ngIf="activeSection === 'xml-storage'" class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('confidence-score', $event)"
              class="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between"
              [ngClass]="activeSection === 'confidence-score' ? 'bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            >
              <span>4. Confidence Score Rules</span>
              <span *ngIf="activeSection === 'confidence-score'" class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('evidence-vault', $event)"
              class="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between"
              [ngClass]="activeSection === 'evidence-vault' ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            >
              <span>5. Evidence Vault & Review</span>
              <span *ngIf="activeSection === 'evidence-vault'" class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('clarifications', $event)"
              class="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between"
              [ngClass]="activeSection === 'clarifications' ? 'bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            >
              <span>6. Clarification Inquiries</span>
              <span *ngIf="activeSection === 'clarifications'" class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('api', $event)"
              class="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between"
              [ngClass]="activeSection === 'api' ? 'bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            >
              <span>7. REST API Endpoints</span>
              <span *ngIf="activeSection === 'api'" class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            </button>

            <button
              type="button"
              (click)="scrollToSection('security', $event)"
              class="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between"
              [ngClass]="activeSection === 'security' ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            >
              <span>8. Security & XXE Protection</span>
              <span *ngIf="activeSection === 'security'" class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            </button>
          </div>
        </div>

        <!-- Documentation Content Body -->
        <div class="lg:col-span-3 space-y-8 text-xs leading-relaxed text-slate-300">
          <!-- Section 1: Overview -->
          <section id="overview" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 scroll-mt-24">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4 pb-3 border-b border-slate-800">
              <div class="w-16 h-16 rounded-2xl overflow-hidden border border-brand-500/30 shadow-lg shadow-brand-500/20 bg-slate-900 p-0.5 flex-shrink-0">
                <img src="/assets/logo.png" alt="MPloyChek Logo" class="w-full h-full object-cover rounded-[14px]" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                  <span>MPloyChek Platform Architecture</span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">v1.0 ENTERPRISE</span>
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">Workforce Trust, Credential Audit & Regulatory Compliance Suite</p>
              </div>
            </div>

            <p>
              <strong>MPloyChek</strong> is a dedicated Employment Verification, Workforce Trust & Compliance Platform engineered for high-integrity organizations. It enables talent operations teams and compliance officers to manage employee verification records, review supporting credentials, track compliance renewal windows, and inspect an auditable security history of all administrative actions.
            </p>
            <p>
              The platform incorporates an auditable verification timeline, deterministic confidence scoring, secure document depository, and strict confidentiality protections ensuring sensitive internal notes and compensation tiers are safeguarded.
            </p>
          </section>

          <!-- Section 2: Roles -->
          <section id="roles" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 scroll-mt-24">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              2. Roles & Access Control
            </h2>
            <p>
              MPloyChek implements Role-Based Access Control (RBAC) separating administrative audit authorities from general user contributors.
            </p>
            <div class="space-y-3">
              <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-bold text-amber-400">Administrator (Compliance Officer)</h3>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">FULL ACCESS</span>
                </div>
                <p class="text-slate-300 leading-relaxed">
                  Holds organization-wide authority. Permitted to review submitted evidence, approve or reject records, issue clarification inquiries, manage user accounts and roles, view the explainable audit explorer, monitor system telemetry, and inspect confidential fields (such as compensation grade and internal assessment notes).
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-bold text-sky-400">General User (Worker / HR Coordinator)</h3>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-400/10 text-sky-300 border border-sky-400/20">REDACTED SCOPE</span>
                </div>
                <p class="text-slate-300 leading-relaxed">
                  Permitted to submit verification records, upload evidence documents, track personal or authored verifications, respond to reviewer clarification inquiries, and receive notifications. All confidential fields are strictly redacted on the server side prior to JSON serialization.
                </p>
              </div>
            </div>
          </section>

          <!-- Section 3: XML Storage -->
          <section id="xml-storage" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 scroll-mt-24">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              3. Mandatory XML File Persistence Architecture
            </h2>
            <p>
              MPloyChek operates with <strong>zero external database dependency</strong> (No MongoDB, No SQL, No SQLite, No Firebase). All application state is permanently persisted directly in an XML document:
            </p>
            <div class="p-3.5 rounded-xl bg-slate-950 font-mono text-emerald-400 border border-slate-800 text-[11px]">
              backend/data/mploychek.xml
            </div>
            <p>
              <strong>Safe Concurrent Writes:</strong> All writes go through a serialized promise queue. Modifications are written to a temporary file (<code>.tmp.&lt;uuid&gt;</code>) in the same directory, flushed to physical disk with <code>fs.fsyncSync</code>, and atomically renamed over the main data file. Automated timestamped snapshots are maintained in <code>backend/data/backups/</code> with a maximum threshold of 20 rolling backups.
            </p>
          </section>

          <!-- Section 4: Confidence Score -->
          <section id="confidence-score" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 scroll-mt-24">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              4. Verification Confidence Score Rules Engine
            </h2>
            <p>
              The trust score is a transparent, deterministic rules-based index (0-100) calculated across five core pillars:
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-purple-300 font-bold block mb-1">Core Profile Completeness (20%)</span>
                <p class="text-slate-400">Validates employee identity, start date, department, job title, and employment category.</p>
              </div>
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-purple-300 font-bold block mb-1">Evidence Portfolio Coverage (25%)</span>
                <p class="text-slate-400">Evaluates uploaded credentials across tax forms (W-2), degrees, government IDs, and offer letters.</p>
              </div>
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-purple-300 font-bold block mb-1">Evidence Validation & Audit (25%)</span>
                <p class="text-slate-400">Ratio of reviewer-verified documents versus flagged or rejected credentials.</p>
              </div>
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span class="text-purple-300 font-bold block mb-1">Workforce Background Screening (15%)</span>
                <p class="text-slate-400">Evaluates passed, in-progress, or flagged criminal and background screening checks.</p>
              </div>
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 md:col-span-2">
                <span class="text-purple-300 font-bold block mb-1">Clarification Clearance & Due Diligence (15%)</span>
                <p class="text-slate-400">Deducts score points for open discrepancies or overdue inquiries until resolved with written addenda.</p>
              </div>
            </div>
          </section>

          <!-- Section 5: Evidence Vault & Review -->
          <section id="evidence-vault" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 scroll-mt-24">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              5. Evidence Vault & Document Verification Mechanics
            </h2>
            <p>
              The Evidence Vault provides cryptographically segregated storage for all submitted credentials.
            </p>
            <ul class="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Authentic PDF Generation:</strong> Documents are persisted and served as standards-compliant PDF-1.4 binary files rendering in Chrome, Edge, and Adobe Reader.</li>
              <li><strong>In-App PDF Document Preview:</strong> Reviewers and employees can view evidence directly inside an embedded modal viewer with print and new-tab controls.</li>
              <li><strong>Reviewer Workflow:</strong> Authorized Compliance Officers can mark documents as <code>VERIFIED</code>, <code>FLAGGED</code>, or <code>REJECTED</code> with mandatory audit justification notes.</li>
              <li><strong>File Integrity:</strong> Permitted formats include PDF, PNG, JPG, and DOCX with strict MIME verification and 10MB individual size boundaries.</li>
            </ul>
          </section>

          <!-- Section 6: Clarifications -->
          <section id="clarifications" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 scroll-mt-24">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              6. Clarification Inquiries & Discrepancy Resolution
            </h2>
            <p>
              When a reviewer identifies a discrepancy (such as an employer EIN mismatch on a tax form or unverified employment dates):
            </p>
            <ol class="list-decimal pl-5 space-y-1.5 text-slate-300">
              <li>The reviewer submits a formal clarification inquiry specifying the question, target record, and regulatory due date.</li>
              <li>The record verification status automatically transitions to <code>ACTION_REQUIRED</code>.</li>
              <li>The employee or HR specialist receives an immediate notification and can submit a written response addendum or amended document.</li>
              <li>Upon response, the status updates to <code>RESUBMITTED</code> and is queued for secondary administrative approval.</li>
            </ol>
          </section>

          <!-- Section 7: API Endpoints -->
          <section id="api" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 scroll-mt-24">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              7. REST API Endpoints Reference
            </h2>
            <div class="overflow-x-auto font-mono text-[11px]">
              <table class="w-full text-left">
                <thead class="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3">Method</th>
                    <th class="py-2.5 px-3">Endpoint</th>
                    <th class="py-2.5 px-3">Description</th>
                    <th class="py-2.5 px-3">Scope</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr>
                    <td class="py-2 px-3 text-emerald-400 font-bold">POST</td>
                    <td class="py-2 px-3 text-white">/api/auth/login</td>
                    <td class="py-2 px-3 text-slate-400">JWT login token generation</td>
                    <td class="py-2 px-3 text-slate-400">Public</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-sky-400 font-bold">GET</td>
                    <td class="py-2 px-3 text-white">/api/records</td>
                    <td class="py-2 px-3 text-slate-400">Query, filter, and paginate employment records</td>
                    <td class="py-2 px-3 text-slate-400">Authenticated</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-emerald-400 font-bold">POST</td>
                    <td class="py-2 px-3 text-white">/api/records</td>
                    <td class="py-2 px-3 text-slate-400">Onboard new employee record</td>
                    <td class="py-2 px-3 text-slate-400">Authenticated</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-sky-400 font-bold">GET</td>
                    <td class="py-2 px-3 text-white">/api/evidence/:id/download</td>
                    <td class="py-2 px-3 text-slate-400">Secure binary PDF credential download</td>
                    <td class="py-2 px-3 text-slate-400">Authenticated</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-emerald-400 font-bold">POST</td>
                    <td class="py-2 px-3 text-white">/api/records/:id/decision</td>
                    <td class="py-2 px-3 text-slate-400">Record formal verification decision</td>
                    <td class="py-2 px-3 text-amber-400">Admin Only</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-rose-400 font-bold">POST</td>
                    <td class="py-2 px-3 text-white">/api/telemetry/clear</td>
                    <td class="py-2 px-3 text-slate-400">Clear observed inbound request stream</td>
                    <td class="py-2 px-3 text-amber-400">Admin Only</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-sky-400 font-bold">GET</td>
                    <td class="py-2 px-3 text-white">/api/health</td>
                    <td class="py-2 px-3 text-slate-400">XML storage health diagnostics</td>
                    <td class="py-2 px-3 text-slate-400">Public</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Section 8: Security -->
          <section id="security" class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 scroll-mt-24 pb-12">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
              8. XML Security, XXE Defense & Zero-Trust Persistence
            </h2>
            <p>
              MPloyChek operates on a hardened, pure XML persistence engine engineered to withstand adversarial injection, XML entity expansion (Billion Laughs attack), and unauthorized file tampering:
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span class="text-teal-400 font-bold block mb-1">XXE & Entity Expansion Defense</span>
                <p class="text-slate-400 leading-relaxed text-[11px]">
                  All inbound and stored XML payloads are pre-scanned. Any presence of <code>&lt;!DOCTYPE&gt;</code>, <code>&lt;!ENTITY&gt;</code>, or external system identifiers triggers an immediate security violation. Fast-XML-Parser processes all tags in strict non-expansion mode.
                </p>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span class="text-teal-400 font-bold block mb-1">Atomic Double-Buffer Persistence</span>
                <p class="text-slate-400 leading-relaxed text-[11px]">
                  Database mutations are staged in isolated <code>.tmp.[uuid]</code> scratch files, flushed to disk via <code>fs.fsyncSync</code>, and committed via atomic OS renames. Windows file-locking race conditions are eliminated with exponential backoff and safe copy fallbacks.
                </p>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span class="text-teal-400 font-bold block mb-1">Automated 20-Snapshot Rolling Backups</span>
                <p class="text-slate-400 leading-relaxed text-[11px]">
                  Before every mutation, a timestamped XML snapshot is stored in <code>/data/backups/</code>. An automated pruning algorithm maintains the last 20 rolling points-in-time for zero data-loss disaster recovery.
                </p>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span class="text-teal-400 font-bold block mb-1">Cryptographic Audit Trail & RBAC</span>
                <p class="text-slate-400 leading-relaxed text-[11px]">
                  Every login, verification decision, and document upload records actor ID, client IP, request UUID, and outcome into an immutable XML audit ledger. General Users never receive sensitive compensation grades or reviewer notes over the wire.
                </p>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300">
              <div class="text-slate-500 mb-1">// Enterprise XML Security Validation Rule</div>
              <span class="text-emerald-400">fastXmlParser.parse</span>(xmlContent, &#123;<br>
              &nbsp;&nbsp;ignoreAttributes: <span class="text-teal-300">false</span>,<br>
              &nbsp;&nbsp;allowBooleanAttributes: <span class="text-teal-300">true</span>,<br>
              &nbsp;&nbsp;processEntities: <span class="text-rose-400">false</span>, <span class="text-slate-500">// Prohibits external expansion</span><br>
              &nbsp;&nbsp;stopNodes: [<span class="text-amber-300">'*.confidenceBreakdownJson'</span>]<br>
              &#125;);
            </div>
          </section>
        </div>
      </div>
    </div>
  `
})
export class DocsViewComponent implements OnInit, OnDestroy {
  activeSection = 'overview';
  private scrollListener?: () => void;

  private readonly sectionIds = [
    'overview',
    'roles',
    'xml-storage',
    'confidence-score',
    'evidence-vault',
    'clarifications',
    'api',
    'security'
  ];

  ngOnInit(): void {
    this.scrollListener = () => this.detectActiveSection();
    window.addEventListener('scroll', this.scrollListener, { passive: true });
    // Run initial detection
    setTimeout(() => this.detectActiveSection(), 100);
  }

  ngOnDestroy(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private detectActiveSection(): void {
    // If at or near top of the page, always activate section 1 (overview)
    if (window.scrollY < 200) {
      this.activeSection = 'overview';
      return;
    }

    // If scrolled near bottom of document and scrolled down significantly, activate section 8
    const scrollBottom = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    if (window.scrollY > 800 && scrollBottom >= documentHeight - 120) {
      this.activeSection = 'security';
      return;
    }

    const scrollPosition = window.scrollY + 180;

    for (let i = this.sectionIds.length - 1; i >= 0; i--) {
      const id = this.sectionIds[i];
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop;
        if (scrollPosition >= top) {
          this.activeSection = id;
          return;
        }
      }
    }

    this.activeSection = 'overview';
  }

  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.activeSection = sectionId;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
