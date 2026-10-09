import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import {
  Organization,
  User,
  EmploymentRecord,
  EvidenceItem,
  VerificationEvent,
  ClarificationRequest,
  ComplianceDeadline,
  Notification,
  AuditEvent
} from '../types';
import { ConfidenceScoreService } from '../services/confidenceScoreService';
import { XmlStorageEngine } from '../repositories/xml/xmlStorageEngine';

async function seed() {
  console.log('--- Starting MPloyChek Fresh Enterprise Seed Process ---');
  console.log(`Target XML Storage: ${config.xmlDataFile}`);

  if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true });
  if (!fs.existsSync(config.uploadsDir)) fs.mkdirSync(config.uploadsDir, { recursive: true });

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
  const userPasswordHash = await bcrypt.hash('User@123', salt);

  const org: Organization = {
    id: 'org-001',
    name: 'MPloyChek Workforce Trust Inc.',
    domain: 'workforcetrust.io',
    tier: 'ENTERPRISE',
    verificationPolicy: 'STRICT_DUAL_REVIEW',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z'
  };

  const users: User[] = [
    {
      id: 'usr-admin-01',
      name: 'Eleanor Vance',
      email: 'admin@mploychek.test',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      organizationId: 'org-001',
      status: 'ACTIVE',
      department: 'Workforce Compliance & Trust',
      title: 'Chief Compliance Officer',
      phone: '+1 (555) 234-5678',
      createdAt: '2026-01-15T08:30:00.000Z',
      updatedAt: '2026-01-15T08:30:00.000Z'
    },
    {
      id: 'usr-user-01',
      name: 'Marcus Chen',
      email: 'user@mploychek.test',
      passwordHash: userPasswordHash,
      role: 'USER',
      organizationId: 'org-001',
      status: 'ACTIVE',
      department: 'Talent Acquisition & HR Operations',
      title: 'Senior Talent Operations Specialist',
      phone: '+1 (555) 345-6789',
      createdAt: '2026-01-20T09:00:00.000Z',
      updatedAt: '2026-01-20T09:00:00.000Z'
    },
    {
      id: 'usr-user-02',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@mploychek.test',
      passwordHash: userPasswordHash,
      role: 'USER',
      organizationId: 'org-001',
      status: 'ACTIVE',
      department: 'People & Culture',
      title: 'HR Verification Coordinator',
      phone: '+1 (555) 456-7890',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z'
    }
  ];

  const { generateSimplePdf } = await import('../utils/pdfGenerator');

  const file1 = 'vault_elena_rostova_offer.pdf';
  const file2 = 'vault_elena_rostova_phd.pdf';
  const file3 = 'vault_carlos_mendez_w2.pdf';
  const file4 = 'vault_sophia_lin_agreement.pdf';

  const pdf1 = generateSimplePdf('OFFER OF EMPLOYMENT - EXECUTIVE ENGAGEMENT', [
    'Employer: MPloyChek Workforce Trust Inc.',
    'Candidate: Elena Rostova',
    'Position: Senior Machine Learning Scientist',
    'Department: AI Research & Machine Intelligence',
    'Compensation Tier: Executive Fellow Level L7',
    'Start Date: March 01, 2025',
    'Status: Fully Executed and Countersigned by People Operations'
  ]);
  fs.writeFileSync(path.join(config.uploadsDir, file1), pdf1);

  const pdf2 = generateSimplePdf('STANFORD UNIVERSITY - PH.D. DEGREE VERIFICATION', [
    'Official Educational Attestation Record',
    'Candidate: Elena Rostova',
    'Degree: Doctor of Philosophy (Ph.D.) in Computer Science',
    'Conferral Date: June 15, 2021',
    'Academic Honors: High Distinction & Doctoral Fellowship',
    'Electronic Clearinghouse Verification Stamp: # NSC-99482-VERIFIED'
  ]);
  fs.writeFileSync(path.join(config.uploadsDir, file2), pdf2);

  const pdf3 = generateSimplePdf('INTERNAL REVENUE SERVICE - FORM W-2 WAGE STATEMENT', [
    'Tax Year: 2025 Wage and Tax Statement',
    'Employee: Carlos Mendez (SSN: ***-**-4910)',
    'Employer: CyberGuard Security Labs LLC',
    'Federal Wages & Tips: $165,000.00',
    'Federal Income Tax Withheld: $32,450.00',
    'Attestation Note: Subsidiary relationship statement requested for reconciliation.'
  ]);
  fs.writeFileSync(path.join(config.uploadsDir, file3), pdf3);

  const pdf4 = generateSimplePdf('INDEPENDENT CONSULTING AGREEMENT & WORK STATEMENT', [
    'Client: MPloyChek Workforce Trust Inc.',
    'Consultant: Sophia Lin (Lead Product UX Strategist)',
    'Contract Term: June 01, 2025 to December 31, 2027',
    'Scope: Design Systems, Accessibility Audits & Product Architecture',
    'Status: Active Professional Engagement - Verified Vault Credential'
  ]);
  fs.writeFileSync(path.join(config.uploadsDir, file4), pdf4);

  const evidenceItems: EvidenceItem[] = [
    {
      id: 'evi-101',
      recordId: 'rec-001',
      organizationId: 'org-001',
      documentType: 'OFFER_LETTER',
      title: 'Executive Employment Agreement',
      filename: file1,
      originalFilename: 'Elena_Rostova_Offer_Letter.pdf',
      fileSize: 142800,
      mimeType: 'application/pdf',
      storagePath: path.join(config.uploadsDir, file1),
      reviewStatus: 'VERIFIED',
      reviewerId: 'usr-admin-01',
      reviewerName: 'Eleanor Vance',
      reviewerComments: 'Countersigned by VP of Engineering. Credentials align with payroll records.',
      submittedBy: 'usr-user-01',
      submittedByName: 'Marcus Chen',
      submittedAt: '2026-09-01T11:00:00.000Z',
      reviewedAt: '2026-09-02T14:20:00.000Z'
    },
    {
      id: 'evi-102',
      recordId: 'rec-001',
      organizationId: 'org-001',
      documentType: 'DEGREE_CERTIFICATE',
      title: 'Stanford Ph.D. Verified Transcripts',
      filename: file2,
      originalFilename: 'Elena_Rostova_Stanford_PhD.pdf',
      fileSize: 489200,
      mimeType: 'application/pdf',
      storagePath: path.join(config.uploadsDir, file2),
      reviewStatus: 'VERIFIED',
      reviewerId: 'usr-admin-01',
      reviewerName: 'Eleanor Vance',
      reviewerComments: 'National Student Clearinghouse electronic seal authenticated.',
      submittedBy: 'usr-user-01',
      submittedByName: 'Marcus Chen',
      submittedAt: '2026-09-01T11:05:00.000Z',
      reviewedAt: '2026-09-02T14:30:00.000Z'
    },
    {
      id: 'evi-103',
      recordId: 'rec-004',
      organizationId: 'org-001',
      documentType: 'TAX_FORM_W2',
      title: 'IRS Form W-2 Wage Summary 2025',
      filename: file3,
      originalFilename: 'Carlos_Mendez_W2_2025.pdf',
      fileSize: 95400,
      mimeType: 'application/pdf',
      storagePath: path.join(config.uploadsDir, file3),
      reviewStatus: 'FLAGGED',
      reviewerId: 'usr-admin-01',
      reviewerName: 'Eleanor Vance',
      reviewerComments: 'EIN listed on form relates to prior holding affiliate. Clarification issued.',
      submittedBy: 'usr-user-01',
      submittedByName: 'Marcus Chen',
      submittedAt: '2026-09-15T09:15:00.000Z',
      reviewedAt: '2026-09-16T16:00:00.000Z'
    },
    {
      id: 'evi-104',
      recordId: 'rec-003',
      organizationId: 'org-001',
      documentType: 'REFERENCE_LETTER',
      title: 'Consulting Engagement Work Statement',
      filename: file4,
      originalFilename: 'Sophia_Lin_Consulting_Contract.pdf',
      fileSize: 215000,
      mimeType: 'application/pdf',
      storagePath: path.join(config.uploadsDir, file4),
      reviewStatus: 'VERIFIED',
      reviewerId: 'usr-admin-01',
      reviewerName: 'Eleanor Vance',
      reviewerComments: 'Vendor agreement authenticated with legal operations.',
      submittedBy: 'usr-user-02',
      submittedByName: 'Sarah Jenkins',
      submittedAt: '2026-09-10T14:00:00.000Z',
      reviewedAt: '2026-09-11T10:00:00.000Z'
    }
  ];

  const clarificationRequests: ClarificationRequest[] = [
    {
      id: 'clar-201',
      recordId: 'rec-004',
      organizationId: 'org-001',
      subject: 'Discrepancy in Employer Identification Number on 2025 W-2',
      question:
        'The submitted W-2 form lists an EIN belonging to CyberGuard Security Labs LLC. Please upload an official attestation explaining the parent/subsidiary relationship.',
      requestedBy: 'usr-admin-01',
      requestedByName: 'Eleanor Vance',
      requestedAt: '2026-10-02T16:05:00.000Z',
      dueDate: '2026-10-25T17:00:00.000Z',
      status: 'OPEN'
    },
    {
      id: 'clar-202',
      recordId: 'rec-008',
      organizationId: 'org-001',
      subject: 'Clarify gap between prior employer conclusion and start date',
      question:
        'Resume indicates continuous employment until Dec 2025, but verified background check recorded end of service in October 2025. Please provide brief confirmation.',
      requestedBy: 'usr-admin-01',
      requestedByName: 'Eleanor Vance',
      requestedAt: '2026-09-28T10:00:00.000Z',
      dueDate: '2026-11-10T17:00:00.000Z',
      status: 'RESPONDED',
      response:
        'Candidate took an approved personal travel leave between October and November 2025. Prior employer release letter verified and attached.',
      respondedBy: 'usr-user-01',
      respondedByName: 'Marcus Chen',
      respondedAt: '2026-10-01T13:45:00.000Z'
    }
  ];

  const confidenceScoreService = new ConfidenceScoreService();

  const baseRecords: Partial<EmploymentRecord>[] = [
    {
      id: 'rec-001',
      employeeId: 'EMP-9001',
      employeeName: 'Elena Rostova',
      organizationId: 'org-001',
      department: 'AI Research',
      jobTitle: 'Senior Machine Learning Scientist',
      employmentType: 'FULL_TIME',
      startDate: '2025-03-01',
      verificationStatus: 'VERIFIED',
      backgroundCheckStatus: 'PASSED',
      backgroundCheckDate: '2025-03-10',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      compensationGrade: 'L7 - Executive Fellow',
      internalAssessmentNotes: 'Ph.D. credentials and past employment verified at Stanford alumni portal.',
      publicReviewerNotes: 'All credential documentation verified without discrepancy.',
      followUpDeadline: '2027-03-01',
      createdBy: 'usr-user-01',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-05T14:35:00.000Z'
    },
    {
      id: 'rec-002',
      employeeId: 'EMP-9002',
      employeeName: 'Marcus Sterling',
      organizationId: 'org-001',
      department: 'Engineering',
      jobTitle: 'Lead Cloud Architect',
      employmentType: 'FULL_TIME',
      startDate: '2025-08-15',
      verificationStatus: 'IN_REVIEW',
      backgroundCheckStatus: 'IN_PROGRESS',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      compensationGrade: 'L6 - Principal Architect',
      internalAssessmentNotes: 'Review in progress; certifications submitted for verification.',
      publicReviewerNotes: 'Credentials in active review queue.',
      followUpDeadline: '2026-11-20',
      createdBy: 'usr-user-01',
      createdAt: '2026-09-10T09:00:00.000Z',
      updatedAt: '2026-09-18T16:05:00.000Z'
    },
    {
      id: 'rec-003',
      employeeId: 'EMP-9003',
      employeeName: 'Sophia Lin',
      organizationId: 'org-001',
      department: 'Product Design',
      jobTitle: 'Senior UX Architect',
      employmentType: 'CONTRACTOR',
      startDate: '2025-06-01',
      verificationStatus: 'VERIFIED',
      backgroundCheckStatus: 'PASSED',
      backgroundCheckDate: '2025-06-12',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      compensationGrade: 'C3 - Principal Consultant',
      internalAssessmentNotes: 'Verified engagement contract and professional portfolio attestation.',
      publicReviewerNotes: 'Contract and credentials verified.',
      followUpDeadline: '2027-06-01',
      createdBy: 'usr-user-02',
      createdAt: '2026-09-08T11:20:00.000Z',
      updatedAt: '2026-09-12T14:05:00.000Z'
    },
    {
      id: 'rec-004',
      employeeId: 'EMP-9004',
      employeeName: 'Carlos Mendez',
      organizationId: 'org-001',
      department: 'Security & Risk',
      jobTitle: 'Principal Cyber Defense Analyst',
      employmentType: 'FULL_TIME',
      startDate: '2026-02-01',
      verificationStatus: 'ACTION_REQUIRED',
      backgroundCheckStatus: 'IN_PROGRESS',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      compensationGrade: 'L6 - Principal Security Lead',
      internalAssessmentNotes: 'Holding review pending subsidiary EIN confirmation on Form W-2.',
      publicReviewerNotes: 'Clarification inquiry issued regarding Tax Form EIN discrepancy.',
      followUpDeadline: '2026-11-15',
      createdBy: 'usr-user-01',
      createdAt: '2026-09-15T15:00:00.000Z',
      updatedAt: '2026-10-02T16:05:00.000Z'
    },
    {
      id: 'rec-005',
      employeeId: 'EMP-9005',
      employeeName: 'Amara Okafor',
      organizationId: 'org-001',
      department: 'Legal Compliance',
      jobTitle: 'Regulatory Compliance Counsel',
      employmentType: 'FULL_TIME',
      startDate: '2025-01-10',
      verificationStatus: 'VERIFIED',
      backgroundCheckStatus: 'PASSED',
      backgroundCheckDate: '2025-01-20',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      compensationGrade: 'L6 - Legal Counsel',
      internalAssessmentNotes: 'Bar association credentials and background check fully verified.',
      publicReviewerNotes: 'Legal credentials verified.',
      followUpDeadline: '2027-01-15',
      createdBy: 'usr-user-02',
      createdAt: '2026-09-05T14:00:00.000Z',
      updatedAt: '2026-09-10T16:30:00.000Z'
    },
    {
      id: 'rec-006',
      employeeId: 'EMP-9006',
      employeeName: 'David Thorne',
      organizationId: 'org-001',
      department: 'Finance',
      jobTitle: 'Strategic Controller',
      employmentType: 'FULL_TIME',
      startDate: '2026-01-15',
      verificationStatus: 'PENDING',
      backgroundCheckStatus: 'NOT_STARTED',
      compensationGrade: 'L5 - Controller',
      internalAssessmentNotes: 'New profile created. Awaiting evidence documents in Evidence Vault.',
      publicReviewerNotes: 'Awaiting submission of verification credentials.',
      followUpDeadline: '2026-11-30',
      createdBy: 'usr-user-01',
      createdAt: '2026-09-20T09:00:00.000Z',
      updatedAt: '2026-09-20T09:00:00.000Z'
    },
    {
      id: 'rec-007',
      employeeId: 'EMP-9007',
      employeeName: 'Rachel Chen',
      organizationId: 'org-001',
      department: 'Technology',
      jobTitle: 'Staff Systems Architect',
      employmentType: 'FULL_TIME',
      startDate: '2024-11-01',
      verificationStatus: 'VERIFIED',
      backgroundCheckStatus: 'PASSED',
      backgroundCheckDate: '2024-11-15',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      compensationGrade: 'L6 - Staff Engineer',
      internalAssessmentNotes: 'All background checks and past employment records attested.',
      publicReviewerNotes: 'Annual audit completed successfully.',
      followUpDeadline: '2027-11-01',
      createdBy: 'usr-user-02',
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-08T10:00:00.000Z'
    },
    {
      id: 'rec-008',
      employeeId: 'EMP-9008',
      employeeName: 'Liam O Connor',
      organizationId: 'org-001',
      department: 'Operations',
      jobTitle: 'Global Talent Operations Director',
      employmentType: 'FULL_TIME',
      startDate: '2025-10-15',
      verificationStatus: 'RESUBMITTED',
      backgroundCheckStatus: 'IN_PROGRESS',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      compensationGrade: 'L6 - Director',
      internalAssessmentNotes: 'Clarification received and under final review.',
      publicReviewerNotes: 'Clarification response submitted and in queue for secondary review.',
      followUpDeadline: '2026-12-10',
      createdBy: 'usr-user-01',
      createdAt: '2026-09-18T13:00:00.000Z',
      updatedAt: '2026-10-01T14:00:00.000Z'
    }
  ];

  const employmentRecords: EmploymentRecord[] = baseRecords.map(r => {
    const fullRec = r as EmploymentRecord;
    const recEv = evidenceItems.filter(e => e.recordId === fullRec.id);
    const recClar = clarificationRequests.filter(c => c.recordId === fullRec.id);
    const breakdown = confidenceScoreService.calculateScore(fullRec, recEv, recClar);

    return {
      ...fullRec,
      confidenceScore: breakdown.score,
      confidenceLevel: breakdown.level,
      confidenceBreakdownJson: JSON.stringify(breakdown)
    };
  });

  const verificationEvents: VerificationEvent[] = [
    {
      id: 'ev-001',
      recordId: 'rec-001',
      organizationId: 'org-001',
      eventType: 'RECORD_CREATED',
      title: 'Record Initialized',
      description: 'Profile initiated for Elena Rostova (EMP-9001).',
      actorId: 'usr-user-01',
      actorName: 'Marcus Chen',
      actorRole: 'USER',
      scoreDelta: 20,
      timestamp: '2026-09-01T10:00:00.000Z'
    },
    {
      id: 'ev-002',
      recordId: 'rec-001',
      organizationId: 'org-001',
      eventType: 'EVIDENCE_UPLOADED',
      title: 'Offer Letter Deposited',
      description: 'Executive Employment Agreement uploaded to vault.',
      actorId: 'usr-user-01',
      actorName: 'Marcus Chen',
      actorRole: 'USER',
      scoreDelta: 25,
      timestamp: '2026-09-01T11:00:00.000Z'
    },
    {
      id: 'ev-003',
      recordId: 'rec-001',
      organizationId: 'org-001',
      eventType: 'EVIDENCE_REVIEWED',
      title: 'Credentials Verified',
      description: 'Eleanor Vance verified offer letter and academic degree.',
      actorId: 'usr-admin-01',
      actorName: 'Eleanor Vance',
      actorRole: 'ADMIN',
      scoreDelta: 25,
      timestamp: '2026-09-02T14:30:00.000Z'
    },
    {
      id: 'ev-004',
      recordId: 'rec-001',
      organizationId: 'org-001',
      eventType: 'DECISION_RECORDED',
      title: 'Verification Approved',
      description: 'Compliance verification approved with 100% Trust Index.',
      actorId: 'usr-admin-01',
      actorName: 'Eleanor Vance',
      actorRole: 'ADMIN',
      previousStatus: 'PENDING',
      newStatus: 'VERIFIED',
      scoreDelta: 15,
      timestamp: '2026-09-05T14:35:00.000Z'
    },
    {
      id: 'ev-005',
      recordId: 'rec-004',
      organizationId: 'org-001',
      eventType: 'CLARIFICATION_REQUESTED',
      title: 'Discrepancy Inquiry Issued',
      description: 'Reviewer requested clarification regarding W-2 entity mismatch.',
      actorId: 'usr-admin-01',
      actorName: 'Eleanor Vance',
      actorRole: 'ADMIN',
      previousStatus: 'IN_REVIEW',
      newStatus: 'ACTION_REQUIRED',
      scoreDelta: -10,
      timestamp: '2026-10-02T16:05:00.000Z'
    }
  ];

  // All deadlines set to upcoming near-now dates (late October - December 2026, 2027)
  const complianceDeadlines: ComplianceDeadline[] = [
    {
      id: 'dl-301',
      recordId: 'rec-004',
      organizationId: 'org-001',
      title: 'Clarification Deadline: Carlos Mendez W-2 EIN Reconciliation',
      category: 'CLARIFICATION_RESPONSE',
      dueDate: '2026-10-25T17:00:00.000Z',
      status: 'ACTIVE',
      priority: 'HIGH',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      reminderDaysBefore: 3,
      createdAt: '2026-10-02T16:05:00.000Z',
      updatedAt: '2026-10-02T16:05:00.000Z'
    },
    {
      id: 'dl-302',
      recordId: 'rec-002',
      organizationId: 'org-001',
      title: 'Cloud Architecture Credential Review: Marcus Sterling',
      category: 'EVIDENCE_EXPIRY',
      dueDate: '2026-11-10T17:00:00.000Z',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      reminderDaysBefore: 7,
      createdAt: '2026-09-18T16:05:00.000Z',
      updatedAt: '2026-09-18T16:05:00.000Z'
    },
    {
      id: 'dl-303',
      recordId: 'rec-006',
      organizationId: 'org-001',
      title: 'Onboarding Credential Submission: David Thorne',
      category: 'EVIDENCE_EXPIRY',
      dueDate: '2026-11-22T17:00:00.000Z',
      status: 'ACTIVE',
      priority: 'HIGH',
      assignedReviewerId: 'usr-user-01',
      assignedReviewerName: 'Marcus Chen',
      reminderDaysBefore: 7,
      createdAt: '2026-09-20T09:00:00.000Z',
      updatedAt: '2026-09-20T09:00:00.000Z'
    },
    {
      id: 'dl-304',
      recordId: 'rec-008',
      organizationId: 'org-001',
      title: 'Secondary Audit Review: Liam O Connor',
      category: 'ANNUAL_AUDIT',
      dueDate: '2026-12-05T17:00:00.000Z',
      status: 'ACTIVE',
      priority: 'HIGH',
      assignedReviewerId: 'usr-user-02',
      assignedReviewerName: 'Sarah Jenkins',
      reminderDaysBefore: 5,
      createdAt: '2026-10-01T14:00:00.000Z',
      updatedAt: '2026-10-01T14:00:00.000Z'
    },
    {
      id: 'dl-305',
      recordId: 'rec-007',
      organizationId: 'org-001',
      title: 'Annual Re-Verification Cycle: Rachel Chen',
      category: 'VERIFICATION_RENEWAL',
      dueDate: '2027-11-01T17:00:00.000Z',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      assignedReviewerId: 'usr-admin-01',
      assignedReviewerName: 'Eleanor Vance',
      reminderDaysBefore: 14,
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-08T10:00:00.000Z'
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-401',
      recipientId: 'usr-user-01',
      organizationId: 'org-001',
      title: 'Verification Decision: VERIFIED',
      message: 'The verification status for Elena Rostova has been approved and cleared by Eleanor Vance.',
      category: 'STATUS_CHANGE',
      targetType: 'RECORD',
      targetId: 'rec-001',
      isRead: false,
      createdAt: '2026-10-09T08:30:00.000Z'
    },
    {
      id: 'notif-402',
      recipientId: 'usr-user-01',
      organizationId: 'org-001',
      title: 'Action Required: W-2 Discrepancy Inquiry',
      message: 'Reviewer Eleanor Vance submitted a clarification inquiry for Carlos Mendez regarding EIN alignment.',
      category: 'CLARIFICATION_REQUIRED',
      targetType: 'RECORD',
      targetId: 'rec-004',
      isRead: false,
      createdAt: '2026-10-09T09:15:00.000Z'
    },
    {
      id: 'notif-403',
      recipientId: 'usr-admin-01',
      organizationId: 'org-001',
      title: 'Compliance Milestone Scheduled',
      message: 'Milestone scheduled: Carlos Mendez W-2 EIN Reconciliation. Target Due Date: Oct 25, 2026.',
      category: 'DEADLINE_APPROACHING',
      targetType: 'DEADLINE',
      targetId: 'dl-301',
      isRead: true,
      createdAt: '2026-10-09T09:30:00.000Z'
    }
  ];

  const auditEvents: AuditEvent[] = [
    {
      id: 'audit-001',
      actorId: 'usr-admin-01',
      actorName: 'Eleanor Vance',
      actorRole: 'ADMIN',
      organizationId: 'org-001',
      actionType: 'AUTH_LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: 'usr-admin-01',
      outcome: 'SUCCESS',
      requestId: 'req-init-auth-01',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      reason: 'Administrator session initiated via multi-factor credentials.',
      timestamp: '2026-10-09T08:00:00.000Z'
    },
    {
      id: 'audit-002',
      actorId: 'usr-admin-01',
      actorName: 'Eleanor Vance',
      actorRole: 'ADMIN',
      organizationId: 'org-001',
      actionType: 'VERIFICATION_DECISION',
      entityType: 'RECORD',
      entityId: 'rec-001',
      outcome: 'SUCCESS',
      requestId: 'req-audit-rec-01',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      reason: 'Full credential review cleared; background checks passed.',
      timestamp: '2026-10-09T08:35:00.000Z'
    },
    {
      id: 'audit-003',
      actorId: 'usr-admin-01',
      actorName: 'Eleanor Vance',
      actorRole: 'ADMIN',
      organizationId: 'org-001',
      actionType: 'CLARIFICATION_REQUEST',
      entityType: 'CLARIFICATION',
      entityId: 'clar-201',
      outcome: 'SUCCESS',
      requestId: 'req-audit-clar-01',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      reason: 'W-2 EIN reconciliation discrepancy inquiry issued.',
      timestamp: '2026-10-09T09:15:00.000Z'
    }
  ];

  const fullData = {
    organizations: [org],
    users,
    employmentRecords,
    evidenceItems,
    verificationEvents,
    clarificationRequests,
    complianceDeadlines,
    notifications,
    auditEvents
  };

  const engine = new XmlStorageEngine();
  await engine.initialize();
  await engine.saveData(fullData, 'Seed fresh enterprise dataset with near-now upcoming deadlines');

  console.log('--- MPloyChek Fresh Enterprise Seed Completed Successfully ---');
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed process failed:', err);
    process.exit(1);
  });
