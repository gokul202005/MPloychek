import { Router } from 'express';
import authRoutes from './authRoutes';
import recordRoutes from './recordRoutes';
import evidenceRoutes from './evidenceRoutes';
import clarificationRoutes from './clarificationRoutes';
import userRoutes from './userRoutes';
import complianceRoutes from './complianceRoutes';
import auditRoutes from './auditRoutes';
import telemetryRoutes from './telemetryRoutes';
import notificationRoutes from './notificationRoutes';
import analyticsRoutes from './analyticsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/records', recordRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/clarifications', clarificationRoutes);
router.use('/users', userRoutes);
router.use('/compliance', complianceRoutes);
router.use('/audit-events', auditRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
