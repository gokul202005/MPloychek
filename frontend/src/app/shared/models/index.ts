export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  status: UserStatus;
  department: string;
  title: string;
  phone?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type VerificationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'ACTION_REQUIRED'
  | 'RESUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export type BackgroundCheckStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FLAGGED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN';

export interface ConfidenceFactor {
  factor: string;
  score: number;
  weight: number;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'NEEDS_ATTENTION' | 'CRITICAL_MISSING';
  explanation: string;
}

export interface ConfidenceBreakdown {
  score: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  factors: ConfidenceFactor[];
  calculatedAt: string;
}

export interface EmploymentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  organizationId: string;
  department: string;
  jobTitle: string;
  employmentType: EmploymentType;
  startDate: string;
  endDate?: string;
  verificationStatus: VerificationStatus;
  backgroundCheckStatus: BackgroundCheckStatus;
  backgroundCheckDate?: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  compensationGrade?: string; // Restricted to admin
  internalAssessmentNotes?: string; // Restricted to admin
  publicReviewerNotes?: string;
  confidenceScore: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceBreakdownJson: string;
  followUpDeadline?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | 'OFFER_LETTER'
  | 'PAYSTUB'
  | 'DEGREE_CERTIFICATE'
  | 'TAX_FORM_W2'
  | 'GOVT_ID'
  | 'REFERENCE_LETTER'
  | 'OTHER';

export type EvidenceReviewStatus = 'PENDING' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';

export interface EvidenceItem {
  id: string;
  recordId: string;
  organizationId: string;
  documentType: DocumentType;
  title: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  reviewStatus: EvidenceReviewStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewerComments?: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  reviewedAt?: string;
  expirationDate?: string;
}

export type TimelineEventType =
  | 'RECORD_CREATED'
  | 'EVIDENCE_UPLOADED'
  | 'EVIDENCE_REVIEWED'
  | 'CLARIFICATION_REQUESTED'
  | 'CLARIFICATION_RESPONDED'
  | 'CLARIFICATION_RESOLVED'
  | 'STATUS_CHANGED'
  | 'CONFIDENCE_UPDATED'
  | 'DECISION_RECORDED'
  | 'AMENDMENT_MADE';

export interface VerificationEvent {
  id: string;
  recordId: string;
  organizationId: string;
  eventType: TimelineEventType;
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  previousStatus?: string;
  newStatus?: string;
  scoreDelta?: number;
  timestamp: string;
}

export type ClarificationStatus = 'OPEN' | 'RESPONDED' | 'RESOLVED' | 'OVERDUE';

export interface ClarificationRequest {
  id: string;
  recordId: string;
  organizationId: string;
  subject: string;
  question: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  dueDate: string;
  status: ClarificationStatus;
  response?: string;
  respondedBy?: string;
  respondedByName?: string;
  respondedAt?: string;
}

export type DeadlineCategory =
  | 'VERIFICATION_RENEWAL'
  | 'CLARIFICATION_RESPONSE'
  | 'EVIDENCE_EXPIRY'
  | 'ANNUAL_AUDIT';

export type DeadlinePriority = 'HIGH' | 'MEDIUM' | 'CRITICAL';
export type DeadlineStatus = 'ACTIVE' | 'COMPLETED' | 'OVERDUE' | 'DISMISSED';

export interface ComplianceDeadline {
  id: string;
  recordId: string;
  organizationId: string;
  title: string;
  category: DeadlineCategory;
  dueDate: string;
  status: DeadlineStatus;
  priority: DeadlinePriority;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  reminderDaysBefore: number;
  createdAt: string;
  updatedAt: string;
}

export type NotificationCategory =
  | 'EVIDENCE_REVIEW'
  | 'CLARIFICATION'
  | 'STATUS_CHANGE'
  | 'COMPLIANCE_DEADLINE'
  | 'SYSTEM';

export interface Notification {
  id: string;
  recipientId: string;
  organizationId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  targetType: 'RECORD' | 'EVIDENCE' | 'DEADLINE' | 'USER';
  targetId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  organizationId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  requestId: string;
  ip: string;
  userAgent: string;
  reason?: string;
  metadataJson?: string;
}

export interface TelemetryRecord {
  id: string;
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  simulatedDelayMs: number;
  timestamp: string;
  ip: string;
  userAgent: string;
  userId?: string;
}

export interface StorageHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  fileExists: boolean;
  filePath: string;
  fileSizeBytes: number;
  readDurationMs: number;
  parseDurationMs: number;
  lastChecked: string;
  error?: string;
}

export interface TelemetrySummary {
  totalRequests: number;
  totalSuccess: number;
  totalClientErrors: number;
  totalServerErrors: number;
  averageResponseTimeMs: number;
  inFlightRequests: number;
  simulatedDelayMs: number;
  runtime: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
    memoryUsage: {
      rssMb: number;
      heapTotalMb: number;
      heapUsedMb: number;
    };
    systemLoad: number[];
  };
  xmlStorageHealth: StorageHealth;
}

export interface DashboardMetrics {
  totalRecords: number;
  verifiedRecords: number;
  pendingRecords: number;
  actionRequiredRecords: number;
  inReviewRecords: number;
  completionRate: number;
  averageConfidenceScore: number;
  statusCounts: Record<string, number>;
  departmentCounts: Record<string, number>;
  upcomingDeadlines: ComplianceDeadline[];
  recentRecords: EmploymentRecord[];
  recentAudits: AuditEvent[];
  unreadNotificationsCount: number;
  role: UserRole;
}

export interface AnalyticsOverview {
  totalRecords: number;
  verificationRate: number;
  averageTurnaroundDays: number;
  openInquiriesCount: number;
  overdueComplianceCount: number;
  inReviewCount: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  statusDistribution: Record<string, number>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
