"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSimulatedDelaySchema = exports.updateUserStatusSchema = exports.updateUserSchema = exports.createUserSchema = exports.updateDeadlineSchema = exports.createDeadlineSchema = exports.respondClarificationSchema = exports.createClarificationSchema = exports.reviewEvidenceSchema = exports.createEvidenceSchema = exports.reviewRecordSchema = exports.updateRecordSchema = exports.createRecordSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long')
});
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    organizationId: zod_1.z.string().optional(),
    department: zod_1.z.string().min(2, 'Department is required'),
    title: zod_1.z.string().min(2, 'Title is required'),
    phone: zod_1.z.string().optional()
    // Public registration role is strictly enforced on server as 'USER'
});
exports.createRecordSchema = zod_1.z.object({
    employeeId: zod_1.z.string().min(2, 'Employee ID is required (e.g. EMP-1042)'),
    employeeName: zod_1.z.string().min(2, 'Employee name is required'),
    organizationId: zod_1.z.string().optional(),
    department: zod_1.z.string().min(2, 'Department is required'),
    jobTitle: zod_1.z.string().min(2, 'Job title is required'),
    employmentType: zod_1.z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional(),
    assignedReviewerId: zod_1.z.string().optional(),
    compensationGrade: zod_1.z.string().optional(),
    internalAssessmentNotes: zod_1.z.string().optional(),
    publicReviewerNotes: zod_1.z.string().optional(),
    followUpDeadline: zod_1.z.string().optional()
});
exports.updateRecordSchema = zod_1.z.object({
    employeeName: zod_1.z.string().min(2).optional(),
    department: zod_1.z.string().min(2).optional(),
    jobTitle: zod_1.z.string().min(2).optional(),
    employmentType: zod_1.z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']).optional(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    verificationStatus: zod_1.z
        .enum(['DRAFT', 'PENDING', 'IN_REVIEW', 'ACTION_REQUIRED', 'RESUBMITTED', 'VERIFIED', 'REJECTED', 'EXPIRED'])
        .optional(),
    backgroundCheckStatus: zod_1.z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FLAGGED']).optional(),
    backgroundCheckDate: zod_1.z.string().optional(),
    assignedReviewerId: zod_1.z.string().optional(),
    compensationGrade: zod_1.z.string().optional(),
    internalAssessmentNotes: zod_1.z.string().optional(),
    publicReviewerNotes: zod_1.z.string().optional(),
    followUpDeadline: zod_1.z.string().optional()
});
exports.reviewRecordSchema = zod_1.z.object({
    decision: zod_1.z.enum(['VERIFIED', 'ACTION_REQUIRED', 'REJECTED', 'IN_REVIEW']),
    reason: zod_1.z.string().min(3, 'A clear justification or reviewer comment is required'),
    publicNotes: zod_1.z.string().optional(),
    internalNotes: zod_1.z.string().optional(),
    followUpDeadline: zod_1.z.string().optional()
});
exports.createEvidenceSchema = zod_1.z.object({
    documentType: zod_1.z.enum([
        'OFFER_LETTER',
        'PAYSTUB',
        'DEGREE_CERTIFICATE',
        'TAX_FORM_W2',
        'GOVT_ID',
        'REFERENCE_LETTER',
        'OTHER'
    ]),
    title: zod_1.z.string().min(2, 'Document title is required'),
    expirationDate: zod_1.z.string().optional()
});
exports.reviewEvidenceSchema = zod_1.z.object({
    reviewStatus: zod_1.z.enum(['VERIFIED', 'FLAGGED', 'REJECTED']),
    reviewerComments: zod_1.z.string().min(2, 'Reviewer comments are required')
});
exports.createClarificationSchema = zod_1.z.object({
    subject: zod_1.z.string().min(3, 'Subject is required'),
    question: zod_1.z.string().min(5, 'Question/inquiry text is required'),
    dueDate: zod_1.z.string().min(1, 'Due date is required')
});
exports.respondClarificationSchema = zod_1.z.object({
    response: zod_1.z.string().min(3, 'Clarification response text is required')
});
exports.createDeadlineSchema = zod_1.z.object({
    recordId: zod_1.z.string().min(1, 'Record ID is required'),
    title: zod_1.z.string().min(3, 'Title is required'),
    category: zod_1.z.enum(['VERIFICATION_RENEWAL', 'CLARIFICATION_RESPONSE', 'EVIDENCE_EXPIRY', 'ANNUAL_AUDIT']),
    dueDate: zod_1.z.string().min(1, 'Due date is required'),
    priority: zod_1.z.enum(['HIGH', 'MEDIUM', 'CRITICAL']),
    assignedReviewerId: zod_1.z.string().optional(),
    reminderDaysBefore: zod_1.z.number().int().min(1).max(90).default(7)
});
exports.updateDeadlineSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'COMPLETED', 'OVERDUE', 'DISMISSED']).optional(),
    priority: zod_1.z.enum(['HIGH', 'MEDIUM', 'CRITICAL']).optional(),
    assignedReviewerId: zod_1.z.string().optional()
});
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name is required'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['ADMIN', 'USER']),
    organizationId: zod_1.z.string().optional(),
    department: zod_1.z.string().min(2, 'Department is required'),
    title: zod_1.z.string().min(2, 'Job title is required'),
    phone: zod_1.z.string().optional()
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.enum(['ADMIN', 'USER']).optional(),
    department: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional()
});
exports.updateUserStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']),
    reason: zod_1.z.string().min(3, 'Reason for status change is required')
});
exports.setSimulatedDelaySchema = zod_1.z.object({
    delayMs: zod_1.z.number().int().min(0).max(1500)
});
