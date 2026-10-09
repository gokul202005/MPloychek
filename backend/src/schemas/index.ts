import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationId: z.string().optional(),
  department: z.string().min(2, 'Department is required'),
  title: z.string().min(2, 'Title is required'),
  phone: z.string().optional()
  // Public registration role is strictly enforced on server as 'USER'
});

export const createRecordSchema = z.object({
  employeeId: z.string().min(2, 'Employee ID is required (e.g. EMP-1042)'),
  employeeName: z.string().min(2, 'Employee name is required'),
  organizationId: z.string().optional(),
  department: z.string().min(2, 'Department is required'),
  jobTitle: z.string().min(2, 'Job title is required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional(),
  assignedReviewerId: z.string().optional(),
  compensationGrade: z.string().optional(),
  internalAssessmentNotes: z.string().optional(),
  publicReviewerNotes: z.string().optional(),
  followUpDeadline: z.string().optional()
});

export const updateRecordSchema = z.object({
  employeeName: z.string().min(2).optional(),
  department: z.string().min(2).optional(),
  jobTitle: z.string().min(2).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  verificationStatus: z
    .enum(['DRAFT', 'PENDING', 'IN_REVIEW', 'ACTION_REQUIRED', 'RESUBMITTED', 'VERIFIED', 'REJECTED', 'EXPIRED'])
    .optional(),
  backgroundCheckStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FLAGGED']).optional(),
  backgroundCheckDate: z.string().optional(),
  assignedReviewerId: z.string().optional(),
  compensationGrade: z.string().optional(),
  internalAssessmentNotes: z.string().optional(),
  publicReviewerNotes: z.string().optional(),
  followUpDeadline: z.string().optional()
});

export const reviewRecordSchema = z.object({
  decision: z.enum(['VERIFIED', 'ACTION_REQUIRED', 'REJECTED', 'IN_REVIEW']),
  reason: z.string().min(3, 'A clear justification or reviewer comment is required'),
  publicNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  followUpDeadline: z.string().optional(),
  backgroundCheckStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FLAGGED']).optional()
});

export const createEvidenceSchema = z.object({
  documentType: z.enum([
    'OFFER_LETTER',
    'PAYSTUB',
    'DEGREE_CERTIFICATE',
    'TAX_FORM_W2',
    'GOVT_ID',
    'REFERENCE_LETTER',
    'OTHER'
  ]),
  title: z.string().min(2, 'Document title is required'),
  expirationDate: z.string().optional()
});

export const reviewEvidenceSchema = z.object({
  reviewStatus: z.enum(['VERIFIED', 'FLAGGED', 'REJECTED']),
  reviewerComments: z.string().min(2, 'Reviewer comments are required')
});

export const createClarificationSchema = z.object({
  subject: z.string().min(3, 'Subject is required'),
  question: z.string().min(5, 'Question/inquiry text is required'),
  dueDate: z.string().min(1, 'Due date is required')
});

export const respondClarificationSchema = z.object({
  response: z.string().min(3, 'Clarification response text is required')
});

export const createDeadlineSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  title: z.string().min(3, 'Title is required'),
  category: z.enum(['VERIFICATION_RENEWAL', 'CLARIFICATION_RESPONSE', 'EVIDENCE_EXPIRY', 'ANNUAL_AUDIT']),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['HIGH', 'MEDIUM', 'CRITICAL']),
  assignedReviewerId: z.string().optional(),
  reminderDaysBefore: z.number().int().min(1).max(90).default(7)
});

export const updateDeadlineSchema = z.object({
  title: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'OVERDUE', 'DISMISSED']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'CRITICAL']).optional(),
  assignedReviewerId: z.string().optional()
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'USER']),
  organizationId: z.string().optional(),
  department: z.string().min(2, 'Department is required'),
  title: z.string().min(2, 'Job title is required'),
  phone: z.string().optional()
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional()
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
  reason: z.string().min(3, 'Reason for status change is required')
});

export const setSimulatedDelaySchema = z.object({
  delayMs: z.number().int().min(0).max(1500)
});
