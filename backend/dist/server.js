"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const xmlStorageEngine_1 = require("./repositories/xml/xmlStorageEngine");
const logger_1 = require("./utils/logger");
async function bootstrap() {
    try {
        logger_1.logger.info('Initializing MPloyChek XML Data Persistence Engine...');
        const storageEngine = xmlStorageEngine_1.XmlStorageEngine.getInstance();
        await storageEngine.initialize();
        const health = await storageEngine.checkHealth();
        logger_1.logger.info(`XML Storage Engine status: ${health.status} (${health.filePath}) [Read: ${health.readDurationMs}ms, Parse: ${health.parseDurationMs}ms]`);
        const server = app_1.default.listen(env_1.config.port, () => {
            logger_1.logger.info(`=======================================================`);
            logger_1.logger.info(`🚀 MPloyChek Backend Service running on port ${env_1.config.port}`);
            logger_1.logger.info(`   Persistence Engine: Pure XML (${env_1.config.xmlDataFile})`);
            logger_1.logger.info(`   Environment: ${env_1.config.nodeEnv}`);
            logger_1.logger.info(`   Health check endpoint: http://localhost:${env_1.config.port}/api/health`);
            logger_1.logger.info(`=======================================================`);
        });
        const shutdown = () => {
            logger_1.logger.info('Shutting down MPloyChek service gracefully...');
            server.close(() => {
                logger_1.logger.info('Server terminated cleanly.');
                process.exit(0);
            });
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
    catch (err) {
        logger_1.logger.error('CRITICAL: Failed to bootstrap MPloyChek XML storage engine:', err);
        process.exit(1);
    }
}
bootstrap();
