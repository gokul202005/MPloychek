import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { telemetryMiddleware } from './middleware/telemetryMiddleware';
import { latencySimulator } from './middleware/latencySimulator';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { TelemetryController } from './controllers/telemetryController';

const app = express();

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and configured client origin
      if (!origin || origin === config.clientOrigin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Not allowed origin'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
  })
);

// Payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Telemetry & Latency simulator
app.use(telemetryMiddleware);
app.use(latencySimulator);

// Global health endpoint
const telemetryController = new TelemetryController();
app.get('/api/health', telemetryController.getHealth);

// General rate limiter on API
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
