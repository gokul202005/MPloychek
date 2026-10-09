import app from './app';
import { config } from './config/env';
import { XmlStorageEngine } from './repositories/xml/xmlStorageEngine';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    logger.info('Initializing MPloyChek XML Data Persistence Engine...');
    const storageEngine = XmlStorageEngine.getInstance();
    await storageEngine.initialize();

    const health = await storageEngine.checkHealth();
    logger.info(`XML Storage Engine status: ${health.status} (${health.filePath}) [Read: ${health.readDurationMs}ms, Parse: ${health.parseDurationMs}ms]`);

    const server = app.listen(config.port, () => {
      logger.info(`=======================================================`);
      logger.info(`🚀 MPloyChek Backend Service running on port ${config.port}`);
      logger.info(`   Persistence Engine: Pure XML (${config.xmlDataFile})`);
      logger.info(`   Environment: ${config.nodeEnv}`);
      logger.info(`   Health check endpoint: http://localhost:${config.port}/api/health`);
      logger.info(`=======================================================`);
    });

    const shutdown = () => {
      logger.info('Shutting down MPloyChek service gracefully...');
      server.close(() => {
        logger.info('Server terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err: any) {
    logger.error('CRITICAL: Failed to bootstrap MPloyChek XML storage engine:', err);
    process.exit(1);
  }
}

bootstrap();
