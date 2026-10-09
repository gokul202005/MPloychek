"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const recordRepository_1 = require("../repositories/xml/recordRepository");
const evidenceRepository_1 = require("../repositories/xml/evidenceRepository");
const clarificationRepository_1 = require("../repositories/xml/clarificationRepository");
const deadlineRepository_1 = require("../repositories/xml/deadlineRepository");
const auditRepository_1 = require("../repositories/xml/auditRepository");
const notificationRepository_1 = require("../repositories/xml/notificationRepository");
class AnalyticsService {
    recordRepo;
    evidenceRepo;
    clarRepo;
    deadlineRepo;
    auditRepo;
    notifRepo;
    constructor() {
        this.recordRepo = new recordRepository_1.RecordRepository();
        this.evidenceRepo = new evidenceRepository_1.EvidenceRepository();
        this.clarRepo = new clarificationRepository_1.ClarificationRepository();
        this.deadlineRepo = new deadlineRepository_1.DeadlineRepository();
        this.auditRepo = new auditRepository_1.AuditRepository();
        this.notifRepo = new notificationRepository_1.NotificationRepository();
    }
    async getDashboardMetrics(currentUser) {
        const allRecords = await this.recordRepo.getAll();
        const orgRecords = allRecords.filter(r => r.organizationId === currentUser.organizationId);
        // If USER, restrict records
        const accessibleRecords = currentUser.role === 'ADMIN'
            ? orgRecords
            : orgRecords.filter(r => r.createdBy === currentUser.id || r.assignedReviewerId === currentUser.id);
        const totalRecords = accessibleRecords.length;
        const verifiedRecords = accessibleRecords.filter(r => r.verificationStatus === 'VERIFIED').length;
        const pendingRecords = accessibleRecords.filter(r => r.verificationStatus === 'PENDING').length;
        const actionRequiredRecords = accessibleRecords.filter(r => r.verificationStatus === 'ACTION_REQUIRED').length;
        const inReviewRecords = accessibleRecords.filter(r => r.verificationStatus === 'IN_REVIEW' || r.verificationStatus === 'RESUBMITTED').length;
        const completionRate = totalRecords > 0 ? Math.round((verifiedRecords / totalRecords) * 100) : 0;
        // Average confidence score
        const avgScore = totalRecords > 0
            ? Math.round(accessibleRecords.reduce((acc, r) => acc + (r.confidenceScore || 0), 0) / totalRecords)
            : 0;
        // Status breakdown
        const statusCounts = {
            VERIFIED: verifiedRecords,
            PENDING: pendingRecords,
            IN_REVIEW: inReviewRecords,
            ACTION_REQUIRED: actionRequiredRecords,
            REJECTED: accessibleRecords.filter(r => r.verificationStatus === 'REJECTED').length,
            EXPIRED: accessibleRecords.filter(r => r.verificationStatus === 'EXPIRED').length,
            DRAFT: accessibleRecords.filter(r => r.verificationStatus === 'DRAFT').length
        };
        // Department breakdown
        const departmentCounts = {};
        accessibleRecords.forEach(r => {
            departmentCounts[r.department] = (departmentCounts[r.department] || 0) + 1;
        });
        // Deadlines
        const allDeadlines = await this.deadlineRepo.getByOrganizationId(currentUser.organizationId);
        const activeDeadlines = allDeadlines
            .filter(d => d.status === 'ACTIVE' || d.status === 'OVERDUE')
            .slice(0, 5);
        // Recent records
        const recentRecords = [...accessibleRecords]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map(r => (currentUser.role === 'USER' ? this.recordRepo.toSafeRecord(r) : r));
        // Audit events (only for ADMIN)
        let recentAudits = [];
        if (currentUser.role === 'ADMIN') {
            const audits = await this.auditRepo.getAll();
            recentAudits = audits
                .filter(a => a.organizationId === currentUser.organizationId)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 6);
        }
        // Notifications
        const notifications = await this.notifRepo.getForUser(currentUser.id, currentUser.role, currentUser.organizationId);
        const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
        return {
            totalRecords,
            verifiedRecords,
            pendingRecords,
            actionRequiredRecords,
            inReviewRecords,
            completionRate,
            averageConfidenceScore: avgScore,
            statusCounts,
            departmentCounts,
            upcomingDeadlines: activeDeadlines,
            recentRecords,
            recentAudits,
            unreadNotificationsCount,
            role: currentUser.role
        };
    }
    async getAnalyticsOverview(currentUser) {
        const allRecords = await this.recordRepo.getAll();
        const orgRecords = allRecords.filter(r => r.organizationId === currentUser.organizationId);
        const total = orgRecords.length;
        const verified = orgRecords.filter(r => r.verificationStatus === 'VERIFIED');
        const inReview = orgRecords.filter(r => r.verificationStatus === 'IN_REVIEW' || r.verificationStatus === 'RESUBMITTED');
        const actionRequired = orgRecords.filter(r => r.verificationStatus === 'ACTION_REQUIRED');
        // Turnaround time calculation from record creation to verified
        let totalTurnaroundHours = 0;
        let verifiedWithDates = 0;
        verified.forEach(r => {
            const created = new Date(r.createdAt).getTime();
            const updated = new Date(r.updatedAt).getTime();
            const diffHours = (updated - created) / (1000 * 60 * 60);
            if (diffHours >= 0) {
                totalTurnaroundHours += diffHours;
                verifiedWithDates++;
            }
        });
        const avgTurnaroundDays = verifiedWithDates > 0 ? Math.round((totalTurnaroundHours / verifiedWithDates / 24) * 10) / 10 : 2.5;
        // Confidence tiers
        const highConfidence = orgRecords.filter(r => r.confidenceScore >= 80).length;
        const mediumConfidence = orgRecords.filter(r => r.confidenceScore >= 50 && r.confidenceScore < 80).length;
        const lowConfidence = orgRecords.filter(r => r.confidenceScore < 50).length;
        // Deadlines
        const deadlines = await this.deadlineRepo.getByOrganizationId(currentUser.organizationId);
        const overdueDeadlines = deadlines.filter(d => d.status === 'OVERDUE' || (d.status === 'ACTIVE' && new Date(d.dueDate).getTime() < Date.now())).length;
        // Clarifications
        const clarifications = await this.clarRepo.getAll();
        const orgClarifications = clarifications.filter(c => c.organizationId === currentUser.organizationId);
        const openClarifications = orgClarifications.filter(c => c.status === 'OPEN' || c.status === 'OVERDUE').length;
        return {
            totalRecords: total,
            verificationRate: total > 0 ? Math.round((verified.length / total) * 100) : 0,
            averageTurnaroundDays: avgTurnaroundDays,
            openInquiriesCount: openClarifications,
            overdueComplianceCount: overdueDeadlines,
            inReviewCount: inReview.length,
            confidenceDistribution: {
                high: highConfidence,
                medium: mediumConfidence,
                low: lowConfidence
            },
            statusDistribution: {
                VERIFIED: verified.length,
                IN_REVIEW: inReview.length,
                ACTION_REQUIRED: actionRequired.length,
                PENDING: orgRecords.filter(r => r.verificationStatus === 'PENDING').length,
                REJECTED: orgRecords.filter(r => r.verificationStatus === 'REJECTED').length,
                EXPIRED: orgRecords.filter(r => r.verificationStatus === 'EXPIRED').length,
                DRAFT: orgRecords.filter(r => r.verificationStatus === 'DRAFT').length
            }
        };
    }
}
exports.AnalyticsService = AnalyticsService;
