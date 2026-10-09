"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xmlStorageEngine_1 = require("../repositories/xml/xmlStorageEngine");
const confidenceScoreService_1 = require("../services/confidenceScoreService");
const env_1 = require("../config/env");
async function seed() {
    console.log('--- Starting MPloyChek Seed Process ---');
    console.log(`Target XML Storage: ${env_1.config.xmlDataFile}`);
    // Ensure directories exist
    if (!fs_1.default.existsSync(env_1.config.dataDir))
        fs_1.default.mkdirSync(env_1.config.dataDir, { recursive: true });
    if (!fs_1.default.existsSync(env_1.config.uploadsDir))
        fs_1.default.mkdirSync(env_1.config.uploadsDir, { recursive: true });
    const salt = await bcryptjs_1.default.genSalt(10);
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin@123', salt);
    const userPasswordHash = await bcryptjs_1.default.hash('User@123', salt);
    const org = {
        id: 'org-001',
        name: 'Apex Global Solutions Inc.',
        domain: 'apexglobal.io',
        tier: 'ENTERPRISE',
        verificationPolicy: 'STRICT_DUAL_REVIEW',
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-01-15T08:00:00.000Z'
    };
    const users = [
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
    // Helper to create sample file on disk
    const createSampleFile = (filename, content) => {
        const fullPath = path_1.default.join(env_1.config.uploadsDir, filename);
        fs_1.default.writeFileSync(fullPath, content, 'utf8');
        return fullPath;
    };
    const sampleFile1 = 'vault_sample_alex_morgan_offer.txt';
    const sampleFile2 = 'vault_sample_alex_morgan_degree.txt';
    const sampleFile3 = 'vault_sample_brian_thorne_w2.txt';
    const sampleFile4 = 'vault_sample_priya_patel_portfolio.txt';
    createSampleFile(sampleFile1, 'OFFER LETTER - Apex Global Solutions Inc. - Employee Alex Morgan - Position: Principal Systems Architect - Date: 2024-03-01');
    createSampleFile(sampleFile2, 'DEGREE VERIFICATION - Stanford University - Bachelor of Science in Computer Science - Alex Morgan - Conferred: 2018-06-15');
    createSampleFile(sampleFile3, 'FORM W-2 Wage and Tax Statement 2024 - Employer: Apex Global Solutions - Employee: Brian Thorne');
    createSampleFile(sampleFile4, 'WORK VERIFICATION CONTRACT - Priya Patel - UX Design Consultancy - Valid 2025-01-01 to 2026-12-31');
    const evidenceItems = [
        {
            id: 'evi-101',
            recordId: 'rec-001',
            organizationId: 'org-001',
            documentType: 'OFFER_LETTER',
            title: 'Signed Executive Offer Letter',
            filename: sampleFile1,
            originalFilename: 'Alex_Morgan_Signed_Offer_Letter.pdf',
            fileSize: 142800,
            mimeType: 'application/pdf',
            storagePath: path_1.default.join(env_1.config.uploadsDir, sampleFile1),
            reviewStatus: 'VERIFIED',
            reviewerId: 'usr-admin-01',
            reviewerName: 'Eleanor Vance',
            reviewerComments: 'Countersigned by VP of Engineering. Dates and compensation grade match payroll master.',
            submittedBy: 'usr-user-01',
            submittedByName: 'Marcus Chen',
            submittedAt: '2026-02-10T11:00:00.000Z',
            reviewedAt: '2026-02-11T14:20:00.000Z'
        },
        {
            id: 'evi-102',
            recordId: 'rec-001',
            organizationId: 'org-001',
            documentType: 'DEGREE_CERTIFICATE',
            title: 'Stanford University Official Transcripts & Degree',
            filename: sampleFile2,
            originalFilename: 'Stanford_CS_Degree_Verified.pdf',
            fileSize: 489200,
            mimeType: 'application/pdf',
            storagePath: path_1.default.join(env_1.config.uploadsDir, sampleFile2),
            reviewStatus: 'VERIFIED',
            reviewerId: 'usr-admin-01',
            reviewerName: 'Eleanor Vance',
            reviewerComments: 'National Student Clearinghouse electronic seal verified.',
            submittedBy: 'usr-user-01',
            submittedByName: 'Marcus Chen',
            submittedAt: '2026-02-10T11:05:00.000Z',
            reviewedAt: '2026-02-11T14:30:00.000Z'
        },
        {
            id: 'evi-103',
            recordId: 'rec-002',
            organizationId: 'org-001',
            documentType: 'TAX_FORM_W2',
            title: 'IRS Form W-2 Wage Summary 2024',
            filename: sampleFile3,
            originalFilename: 'Brian_Thorne_Tax_W2_2024.pdf',
            fileSize: 95400,
            mimeType: 'application/pdf',
            storagePath: path_1.default.join(env_1.config.uploadsDir, sampleFile3),
            reviewStatus: 'FLAGGED',
            reviewerId: 'usr-admin-01',
            reviewerName: 'Eleanor Vance',
            reviewerComments: 'EIN reported on box B differs from parent holding entity. Clarification requested.',
            submittedBy: 'usr-user-01',
            submittedByName: 'Marcus Chen',
            submittedAt: '2026-03-01T09:15:00.000Z',
            reviewedAt: '2026-03-02T16:00:00.000Z'
        },
        {
            id: 'evi-104',
            recordId: 'rec-003',
            organizationId: 'org-001',
            documentType: 'REFERENCE_LETTER',
            title: 'Professional Service Contract & References',
            filename: sampleFile4,
            originalFilename: 'Priya_Patel_Consulting_Agreement.pdf',
            fileSize: 215000,
            mimeType: 'application/pdf',
            storagePath: path_1.default.join(env_1.config.uploadsDir, sampleFile4),
            reviewStatus: 'PENDING',
            submittedBy: 'usr-user-02',
            submittedByName: 'Sarah Jenkins',
            submittedAt: '2026-03-10T14:00:00.000Z'
        }
    ];
    const clarificationRequests = [
        {
            id: 'clar-201',
            recordId: 'rec-002',
            organizationId: 'org-001',
            subject: 'Discrepancy in Employer Identification Number on 2024 W-2',
            question: 'The submitted W-2 form lists an EIN belonging to Thorne Financial Consulting LLC rather than Apex Global. Please upload an amended form or an official letter explaining the subsidiary relationship.',
            requestedBy: 'usr-admin-01',
            requestedByName: 'Eleanor Vance',
            requestedAt: '2026-03-02T16:05:00.000Z',
            dueDate: '2026-03-25T17:00:00.000Z',
            status: 'OPEN'
        },
        {
            id: 'clar-202',
            recordId: 'rec-008',
            organizationId: 'org-001',
            subject: 'Clarify gap between previous employer and start date',
            question: 'Resume indicates continuous employment until Dec 2025, but certified background check noted an employment conclusion in Sept 2025. Please provide written clarification.',
            requestedBy: 'usr-admin-01',
            requestedByName: 'Eleanor Vance',
            requestedAt: '2026-02-15T10:00:00.000Z',
            dueDate: '2026-02-22T17:00:00.000Z',
            status: 'RESPONDED',
            response: 'Employee took a pre-approved sabbatic leave between October and November 2025 prior to onboarding. Documented approval from previous manager attached in addendum.',
            respondedBy: 'usr-user-01',
            respondedByName: 'Marcus Chen',
            respondedAt: '2026-02-18T13:45:00.000Z'
        }
    ];
    const confidenceScoreService = new confidenceScoreService_1.ConfidenceScoreService();
    const baseRecords = [
        {
            id: 'rec-001',
            employeeId: 'EMP-8401',
            employeeName: 'Alex Morgan',
            organizationId: 'org-001',
            department: 'Engineering',
            jobTitle: 'Principal Systems Architect',
            employmentType: 'FULL_TIME',
            startDate: '2024-03-01',
            verificationStatus: 'VERIFIED',
            backgroundCheckStatus: 'PASSED',
            backgroundCheckDate: '2024-03-10',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            compensationGrade: 'L7 - Executive Fellow',
            internalAssessmentNotes: 'Top-tier credentials. Verified via Stanford alumni portal and automated clearinghouse.',
            publicReviewerNotes: 'All credential documentation verified without discrepancy.',
            followUpDeadline: '2027-03-01',
            createdBy: 'usr-user-01',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-02-11T14:35:00.000Z'
        },
        {
            id: 'rec-002',
            employeeId: 'EMP-8402',
            employeeName: 'Brian Thorne',
            organizationId: 'org-001',
            department: 'Finance',
            jobTitle: 'Financial Controller',
            employmentType: 'FULL_TIME',
            startDate: '2025-01-15',
            verificationStatus: 'ACTION_REQUIRED',
            backgroundCheckStatus: 'IN_PROGRESS',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            compensationGrade: 'L6 - Principal Management',
            internalAssessmentNotes: 'Holding review pending clarification regarding W-2 entity mismatch.',
            publicReviewerNotes: 'Clarification inquiry issued regarding Tax Form EIN discrepancy.',
            followUpDeadline: '2026-03-25',
            createdBy: 'usr-user-01',
            createdAt: '2026-02-28T09:00:00.000Z',
            updatedAt: '2026-03-02T16:05:00.000Z'
        },
        {
            id: 'rec-003',
            employeeId: 'EMP-8403',
            employeeName: 'Priya Patel',
            organizationId: 'org-001',
            department: 'Product Design',
            jobTitle: 'Lead UX Strategist',
            employmentType: 'CONTRACTOR',
            startDate: '2025-06-01',
            verificationStatus: 'IN_REVIEW',
            backgroundCheckStatus: 'IN_PROGRESS',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            compensationGrade: 'C3 - Senior Contractor',
            internalAssessmentNotes: 'Evidence submitted, reviewer queue priority high.',
            publicReviewerNotes: 'Documentation currently under verification audit.',
            createdBy: 'usr-user-02',
            createdAt: '2026-03-05T11:20:00.000Z',
            updatedAt: '2026-03-10T14:05:00.000Z'
        },
        {
            id: 'rec-004',
            employeeId: 'EMP-8404',
            employeeName: 'David Kim',
            organizationId: 'org-001',
            department: 'Legal & Risk',
            jobTitle: 'Compliance Operations Officer',
            employmentType: 'FULL_TIME',
            startDate: '2026-02-01',
            verificationStatus: 'PENDING',
            backgroundCheckStatus: 'NOT_STARTED',
            compensationGrade: 'L5 - Senior Specialist',
            internalAssessmentNotes: 'Awaiting initial evidence vault document uploads.',
            publicReviewerNotes: 'Please upload identity credentials and degree transcripts.',
            followUpDeadline: '2026-04-15',
            createdBy: 'usr-user-01',
            createdAt: '2026-03-12T15:00:00.000Z',
            updatedAt: '2026-03-12T15:00:00.000Z'
        },
        {
            id: 'rec-005',
            employeeId: 'EMP-8405',
            employeeName: 'Elena Rostova',
            organizationId: 'org-001',
            department: 'AI Research',
            jobTitle: 'Senior Machine Learning Scientist',
            employmentType: 'FULL_TIME',
            startDate: '2024-08-15',
            verificationStatus: 'VERIFIED',
            backgroundCheckStatus: 'PASSED',
            backgroundCheckDate: '2024-08-20',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            compensationGrade: 'L6 - Staff Researcher',
            internalAssessmentNotes: 'Ph.D. credentials and past employment verified at MIT and Google DeepMind alumni network.',
            publicReviewerNotes: 'Verified with comprehensive background check pass.',
            followUpDeadline: '2027-08-15',
            createdBy: 'usr-user-02',
            createdAt: '2026-01-10T14:00:00.000Z',
            updatedAt: '2026-01-18T16:30:00.000Z'
        },
        {
            id: 'rec-006',
            employeeId: 'EMP-8406',
            employeeName: 'Jordan Taylor',
            organizationId: 'org-001',
            department: 'Growth Marketing',
            jobTitle: 'Demand Generation Lead',
            employmentType: 'FULL_TIME',
            startDate: '2025-03-01',
            verificationStatus: 'REJECTED',
            backgroundCheckStatus: 'FLAGGED',
            backgroundCheckDate: '2025-03-15',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            compensationGrade: 'L5 - Team Lead',
            internalAssessmentNotes: 'Document forgery identified in university degree verification check.',
            publicReviewerNotes: 'Verification declined due to irreconcilable academic discrepancy.',
            createdBy: 'usr-user-01',
            createdAt: '2026-01-05T09:00:00.000Z',
            updatedAt: '2026-01-25T11:00:00.000Z'
        },
        {
            id: 'rec-007',
            employeeId: 'EMP-8407',
            employeeName: 'Michael Scott',
            organizationId: 'org-001',
            department: 'Commercial Sales',
            jobTitle: 'Regional Sales Director',
            employmentType: 'FULL_TIME',
            startDate: '2023-01-10',
            verificationStatus: 'EXPIRED',
            backgroundCheckStatus: 'PASSED',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            compensationGrade: 'L6 - Director',
            internalAssessmentNotes: 'Annual workforce trust audit cycle lapsed; renewal required.',
            publicReviewerNotes: 'Annual credential cycle expired. Re-verification required.',
            followUpDeadline: '2026-02-15',
            createdBy: 'usr-user-02',
            createdAt: '2025-12-01T10:00:00.000Z',
            updatedAt: '2026-02-20T10:00:00.000Z'
        },
        {
            id: 'rec-008',
            employeeId: 'EMP-8408',
            employeeName: 'Anya Sharma',
            organizationId: 'org-001',
            department: 'Cloud Infrastructure',
            jobTitle: 'DevOps & SRE Specialist',
            employmentType: 'FULL_TIME',
            startDate: '2025-11-01',
            verificationStatus: 'RESUBMITTED',
            backgroundCheckStatus: 'IN_PROGRESS',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            compensationGrade: 'L5 - Senior Engineer',
            internalAssessmentNotes: 'Employee responded to sabbatic clarification. Ready for secondary sign-off.',
            publicReviewerNotes: 'Clarification response submitted and in queue for approval.',
            followUpDeadline: '2026-03-30',
            createdBy: 'usr-user-01',
            createdAt: '2026-02-12T13:00:00.000Z',
            updatedAt: '2026-02-18T14:00:00.000Z'
        }
    ];
    const employmentRecords = baseRecords.map(r => {
        const fullRec = r;
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
    const verificationEvents = [
        {
            id: 'ev-001',
            recordId: 'rec-001',
            organizationId: 'org-001',
            eventType: 'RECORD_CREATED',
            title: 'Record Onboarded',
            description: 'Record initiated for Alex Morgan (EMP-8401).',
            actorId: 'usr-user-01',
            actorName: 'Marcus Chen',
            actorRole: 'USER',
            scoreDelta: 20,
            timestamp: '2026-01-20T10:00:00.000Z'
        },
        {
            id: 'ev-002',
            recordId: 'rec-001',
            organizationId: 'org-001',
            eventType: 'EVIDENCE_UPLOADED',
            title: 'Offer Letter Deposited',
            description: 'Marcus Chen uploaded Signed Executive Offer Letter.',
            actorId: 'usr-user-01',
            actorName: 'Marcus Chen',
            actorRole: 'USER',
            scoreDelta: 25,
            timestamp: '2026-02-10T11:00:00.000Z'
        },
        {
            id: 'ev-003',
            recordId: 'rec-001',
            organizationId: 'org-001',
            eventType: 'EVIDENCE_UPLOADED',
            title: 'Degree Certificate Deposited',
            description: 'Marcus Chen uploaded Stanford CS Degree Certificate.',
            actorId: 'usr-user-01',
            actorName: 'Marcus Chen',
            actorRole: 'USER',
            scoreDelta: 15,
            timestamp: '2026-02-10T11:05:00.000Z'
        },
        {
            id: 'ev-004',
            recordId: 'rec-001',
            organizationId: 'org-001',
            eventType: 'EVIDENCE_REVIEWED',
            title: 'Credentials Verified',
            description: 'Reviewer Eleanor Vance marked offer letter and degree transcripts as VERIFIED.',
            actorId: 'usr-admin-01',
            actorName: 'Eleanor Vance',
            actorRole: 'ADMIN',
            scoreDelta: 25,
            timestamp: '2026-02-11T14:30:00.000Z'
        },
        {
            id: 'ev-005',
            recordId: 'rec-001',
            organizationId: 'org-001',
            eventType: 'DECISION_RECORDED',
            title: 'Verification Approved',
            description: 'Status updated to VERIFIED with 96/100 Workforce Trust confidence score.',
            actorId: 'usr-admin-01',
            actorName: 'Eleanor Vance',
            actorRole: 'ADMIN',
            previousStatus: 'PENDING',
            newStatus: 'VERIFIED',
            scoreDelta: 11,
            timestamp: '2026-02-11T14:35:00.000Z'
        },
        {
            id: 'ev-006',
            recordId: 'rec-002',
            organizationId: 'org-001',
            eventType: 'RECORD_CREATED',
            title: 'Record Onboarded',
            description: 'Record initiated for Brian Thorne (EMP-8402).',
            actorId: 'usr-user-01',
            actorName: 'Marcus Chen',
            actorRole: 'USER',
            scoreDelta: 20,
            timestamp: '2026-02-28T09:00:00.000Z'
        },
        {
            id: 'ev-007',
            recordId: 'rec-002',
            organizationId: 'org-001',
            eventType: 'CLARIFICATION_REQUESTED',
            title: 'Clarification Inquired',
            description: 'Reviewer flagged W-2 EIN discrepancy and requested employer clarification.',
            actorId: 'usr-admin-01',
            actorName: 'Eleanor Vance',
            actorRole: 'ADMIN',
            previousStatus: 'IN_REVIEW',
            newStatus: 'ACTION_REQUIRED',
            scoreDelta: -10,
            timestamp: '2026-03-02T16:05:00.000Z'
        }
    ];
    const complianceDeadlines = [
        {
            id: 'dl-301',
            recordId: 'rec-002',
            organizationId: 'org-001',
            title: 'Clarification Deadline: Brian Thorne W-2 EIN Reconciliation',
            category: 'CLARIFICATION_RESPONSE',
            dueDate: '2026-03-25T17:00:00.000Z',
            status: 'ACTIVE',
            priority: 'HIGH',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            reminderDaysBefore: 3,
            createdAt: '2026-03-02T16:05:00.000Z',
            updatedAt: '2026-03-02T16:05:00.000Z'
        },
        {
            id: 'dl-302',
            recordId: 'rec-007',
            organizationId: 'org-001',
            title: 'Annual Re-Verification Renewal: Michael Scott',
            category: 'VERIFICATION_RENEWAL',
            dueDate: '2026-02-15T17:00:00.000Z',
            status: 'OVERDUE',
            priority: 'CRITICAL',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            reminderDaysBefore: 14,
            createdAt: '2026-01-15T09:00:00.000Z',
            updatedAt: '2026-02-16T08:00:00.000Z'
        },
        {
            id: 'dl-303',
            recordId: 'rec-004',
            organizationId: 'org-001',
            title: 'Onboarding Credential Submission: David Kim',
            category: 'EVIDENCE_EXPIRY',
            dueDate: '2026-04-15T17:00:00.000Z',
            status: 'ACTIVE',
            priority: 'MEDIUM',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            reminderDaysBefore: 7,
            createdAt: '2026-03-12T15:00:00.000Z',
            updatedAt: '2026-03-12T15:00:00.000Z'
        },
        {
            id: 'dl-304',
            recordId: 'rec-008',
            organizationId: 'org-001',
            title: 'Secondary Audit Review: Anya Sharma',
            category: 'ANNUAL_AUDIT',
            dueDate: '2026-03-30T17:00:00.000Z',
            status: 'ACTIVE',
            priority: 'HIGH',
            assignedReviewerId: 'usr-admin-01',
            assignedReviewerName: 'Eleanor Vance',
            reminderDaysBefore: 5,
            createdAt: '2026-02-18T14:00:00.000Z',
            updatedAt: '2026-02-18T14:00:00.000Z'
        }
    ];
    const notifications = [
        {
            id: 'notif-401',
            recipientId: 'usr-user-01',
            organizationId: 'org-001',
            title: 'Action Required: W-2 Discrepancy Inquiry',
            message: 'Reviewer Eleanor Vance submitted a clarification inquiry for Brian Thorne regarding EIN alignment.',
            category: 'CLARIFICATION',
            targetType: 'RECORD',
            targetId: 'rec-002',
            isRead: false,
            createdAt: '2026-03-02T16:05:00.000Z'
        },
        {
            id: 'notif-402',
            recipientId: 'ALL_ADMINS',
            organizationId: 'org-001',
            title: 'Verification Complete: Alex Morgan',
            message: 'Alex Morgan has been fully verified with a Confidence Score of 96/100.',
            category: 'STATUS_CHANGE',
            targetType: 'RECORD',
            targetId: 'rec-001',
            isRead: true,
            createdAt: '2026-02-11T14:35:00.000Z'
        },
        {
            id: 'notif-403',
            recipientId: 'usr-user-02',
            organizationId: 'org-001',
            title: 'Compliance Overdue Alert: Michael Scott',
            message: 'Annual credential cycle is overdue for Michael Scott. Please upload updated credentials.',
            category: 'COMPLIANCE_DEADLINE',
            targetType: 'DEADLINE',
            targetId: 'dl-302',
            isRead: false,
            createdAt: '2026-02-16T08:00:00.000Z'
        },
        {
            id: 'notif-404',
            recipientId: 'ALL_ADMINS',
            organizationId: 'org-001',
            title: 'Clarification Response Resubmitted: Anya Sharma',
            message: 'Marcus Chen responded to the background inquiry for Anya Sharma.',
            category: 'CLARIFICATION',
            targetType: 'RECORD',
            targetId: 'rec-008',
            isRead: false,
            createdAt: '2026-02-18T13:45:00.000Z'
        }
    ];
    const auditEvents = [
        {
            id: 'audit-501',
            timestamp: '2026-01-15T08:30:00.000Z',
            actorId: 'usr-admin-01',
            actorName: 'Eleanor Vance',
            actorRole: 'ADMIN',
            organizationId: 'org-001',
            actionType: 'SYSTEM_BOOTSTRAP',
            entityType: 'AUTH',
            entityId: 'usr-admin-01',
            outcome: 'SUCCESS',
            requestId: 'req-init-001',
            ip: '10.0.4.12',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            reason: 'Initial system deployment and administrative setup'
        },
        {
            id: 'audit-502',
            timestamp: '2026-02-11T14:35:00.000Z',
            actorId: 'usr-admin-01',
            actorName: 'Eleanor Vance',
            actorRole: 'ADMIN',
            organizationId: 'org-001',
            actionType: 'VERIFICATION_DECISION',
            entityType: 'RECORD',
            entityId: 'rec-001',
            outcome: 'SUCCESS',
            requestId: 'req-dec-109',
            ip: '10.0.4.12',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            reason: 'All credentials cleared dual-audit requirements'
        },
        {
            id: 'audit-503',
            timestamp: '2026-03-02T16:05:00.000Z',
            actorId: 'usr-admin-01',
            actorName: 'Eleanor Vance',
            actorRole: 'ADMIN',
            organizationId: 'org-001',
            actionType: 'CLARIFICATION_REQUEST',
            entityType: 'CLARIFICATION',
            entityId: 'clar-201',
            outcome: 'SUCCESS',
            requestId: 'req-clar-302',
            ip: '10.0.4.12',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            reason: 'W-2 EIN discrepancy with parent entity'
        },
        {
            id: 'audit-504',
            timestamp: '2026-03-12T15:00:00.000Z',
            actorId: 'usr-user-01',
            actorName: 'Marcus Chen',
            actorRole: 'USER',
            organizationId: 'org-001',
            actionType: 'RECORD_CREATE',
            entityType: 'RECORD',
            entityId: 'rec-004',
            outcome: 'SUCCESS',
            requestId: 'req-create-881',
            ip: '10.0.5.88',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            reason: 'New hire onboarding workflow initiated'
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
    const storageEngine = xmlStorageEngine_1.XmlStorageEngine.getInstance();
    await storageEngine.saveData(fullData, 'Database Seeded with Fictional Demonstration Dataset');
    console.log('✅ MPloyChek XML storage successfully seeded!');
    console.log(`   Organizations: ${fullData.organizations.length}`);
    console.log(`   Users: ${fullData.users.length}`);
    console.log(`   Employment Records: ${fullData.employmentRecords.length}`);
    console.log(`   Evidence Items: ${fullData.evidenceItems.length}`);
    console.log(`   Timeline Events: ${fullData.verificationEvents.length}`);
    console.log(`   Clarifications: ${fullData.clarificationRequests.length}`);
    console.log(`   Compliance Deadlines: ${fullData.complianceDeadlines.length}`);
    console.log(`   Notifications: ${fullData.notifications.length}`);
    console.log(`   Audit Events: ${fullData.auditEvents.length}`);
    console.log('----------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('Administrator: admin@mploychek.test / Admin@123');
    console.log('General User:  user@mploychek.test  / User@123');
    console.log('----------------------------------------------------');
}
seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
