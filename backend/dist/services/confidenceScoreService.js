"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfidenceScoreService = void 0;
class ConfidenceScoreService {
    /**
     * Deterministic, rules-based Workforce Trust Confidence Calculation.
     * Evaluates 5 core pillars of verification integrity:
     * 1. Profile & Core Record Completeness (Weight: 20%)
     * 2. Evidence Portfolio Adequacy (Weight: 25%)
     * 3. Evidence Review & Verification Status (Weight: 25%)
     * 4. Background Check & Compliance Status (Weight: 15%)
     * 5. Clarification & Inconsistency Clearance (Weight: 15%)
     */
    calculateScore(record, evidenceItems, clarifications) {
        const factors = [];
        // Pillar 1: Record Completeness (20 points max)
        let completenessScore = 0;
        const completenessIssues = [];
        if (record.employeeName && record.employeeId)
            completenessScore += 6;
        else
            completenessIssues.push('Missing basic employee identifiers');
        if (record.department && record.jobTitle)
            completenessScore += 6;
        else
            completenessIssues.push('Missing department or job title designation');
        if (record.startDate)
            completenessScore += 5;
        else
            completenessIssues.push('Missing employment start date');
        if (record.employmentType)
            completenessScore += 3;
        factors.push({
            factor: 'Core Profile Completeness',
            score: completenessScore,
            weight: 20,
            status: completenessScore === 20
                ? 'OPTIMAL'
                : completenessScore >= 12
                    ? 'ACCEPTABLE'
                    : 'NEEDS_ATTENTION',
            explanation: completenessIssues.length === 0
                ? 'All mandatory identity and organizational attributes are provided.'
                : `Gaps identified: ${completenessIssues.join(', ')}.`
        });
        // Pillar 2: Evidence Portfolio Adequacy (25 points max)
        let portfolioScore = 0;
        const docTypesPresent = new Set(evidenceItems.map(e => e.documentType));
        const totalDocs = evidenceItems.length;
        if (totalDocs >= 1)
            portfolioScore += 10;
        if (totalDocs >= 2)
            portfolioScore += 5;
        if (docTypesPresent.has('OFFER_LETTER') || docTypesPresent.has('TAX_FORM_W2') || docTypesPresent.has('PAYSTUB')) {
            portfolioScore += 5;
        }
        if (docTypesPresent.has('GOVT_ID') || docTypesPresent.has('DEGREE_CERTIFICATE')) {
            portfolioScore += 5;
        }
        factors.push({
            factor: 'Evidence Portfolio Coverage',
            score: portfolioScore,
            weight: 25,
            status: portfolioScore >= 20
                ? 'OPTIMAL'
                : portfolioScore >= 10
                    ? 'ACCEPTABLE'
                    : 'CRITICAL_MISSING',
            explanation: totalDocs === 0
                ? 'No supporting evidence documents have been uploaded to the Evidence Vault.'
                : `${totalDocs} document(s) uploaded covering [${Array.from(docTypesPresent).join(', ')}].`
        });
        // Pillar 3: Evidence Review Status (25 points max)
        let reviewScore = 0;
        const verifiedDocs = evidenceItems.filter(e => e.reviewStatus === 'VERIFIED');
        const flaggedDocs = evidenceItems.filter(e => e.reviewStatus === 'FLAGGED');
        const rejectedDocs = evidenceItems.filter(e => e.reviewStatus === 'REJECTED');
        if (totalDocs > 0) {
            const verifiedRatio = verifiedDocs.length / totalDocs;
            reviewScore = Math.round(verifiedRatio * 25);
            if (rejectedDocs.length > 0) {
                reviewScore = Math.max(0, reviewScore - 10);
            }
            if (flaggedDocs.length > 0) {
                reviewScore = Math.max(0, reviewScore - 5);
            }
        }
        factors.push({
            factor: 'Evidence Validation & Audit',
            score: reviewScore,
            weight: 25,
            status: reviewScore >= 20
                ? 'OPTIMAL'
                : reviewScore >= 10
                    ? 'ACCEPTABLE'
                    : 'NEEDS_ATTENTION',
            explanation: totalDocs === 0
                ? 'Awaiting document submissions for verification review.'
                : `${verifiedDocs.length}/${totalDocs} documents verified. ${flaggedDocs.length} flagged, ${rejectedDocs.length} rejected.`
        });
        // Pillar 4: Background Check Alignment (15 points max)
        let bgScore = 0;
        let bgExplanation = 'Background check has not commenced.';
        let bgStatus = 'NEEDS_ATTENTION';
        if (record.backgroundCheckStatus === 'PASSED') {
            bgScore = 15;
            bgStatus = 'OPTIMAL';
            bgExplanation = `Background check passed successfully${record.backgroundCheckDate ? ` on ${record.backgroundCheckDate}` : ''}.`;
        }
        else if (record.backgroundCheckStatus === 'IN_PROGRESS') {
            bgScore = 8;
            bgStatus = 'ACCEPTABLE';
            bgExplanation = 'Background verification is currently in active processing with screening partner.';
        }
        else if (record.backgroundCheckStatus === 'FLAGGED') {
            bgScore = 3;
            bgStatus = 'CRITICAL_MISSING';
            bgExplanation = 'Discrepancy or anomaly flagged in background screening report.';
        }
        factors.push({
            factor: 'Workforce Background Screening',
            score: bgScore,
            weight: 15,
            status: bgStatus,
            explanation: bgExplanation
        });
        // Pillar 5: Clarifications & Conflict Clearance (15 points max)
        let clarScore = 15;
        const openClarifications = clarifications.filter(c => c.status === 'OPEN' || c.status === 'OVERDUE');
        const overdueClarifications = clarifications.filter(c => c.status === 'OVERDUE');
        if (overdueClarifications.length > 0) {
            clarScore -= 10;
        }
        else if (openClarifications.length > 0) {
            clarScore -= 5 * Math.min(openClarifications.length, 2);
        }
        clarScore = Math.max(0, clarScore);
        factors.push({
            factor: 'Clarification Resolution & Due Diligence',
            score: clarScore,
            weight: 15,
            status: clarScore === 15
                ? 'OPTIMAL'
                : clarScore >= 8
                    ? 'ACCEPTABLE'
                    : 'NEEDS_ATTENTION',
            explanation: openClarifications.length === 0
                ? 'No outstanding inquiry or clarification bottlenecks on this record.'
                : `${openClarifications.length} open inquiry ticket(s) awaiting worker/employer clarification (${overdueClarifications.length} overdue).`
        });
        // Sum total score
        const totalScore = factors.reduce((acc, f) => acc + f.score, 0);
        const clampedScore = Math.max(0, Math.min(100, totalScore));
        const level = clampedScore >= 80 ? 'HIGH' : clampedScore >= 50 ? 'MEDIUM' : 'LOW';
        const summary = level === 'HIGH'
            ? 'High confidence: Documentation is well-attested, verified by reviewers, and background checks are clear.'
            : level === 'MEDIUM'
                ? 'Moderate confidence: Key elements present but pending full document review or background check completion.'
                : 'Low confidence: Significant documentation gaps, unresolved queries, or unverified credentials present.';
        return {
            score: clampedScore,
            level,
            summary,
            factors,
            calculatedAt: new Date().toISOString()
        };
    }
}
exports.ConfidenceScoreService = ConfidenceScoreService;
