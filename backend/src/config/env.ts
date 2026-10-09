import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'mploychek_secure_super_secret_jwt_key_2026_enterprise_9981',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  dataDir: path.resolve(process.env.DATA_DIR || './data'),
  xmlDataFile: path.resolve(process.env.XML_DATA_FILE || './data/mploychek.xml'),
  backupDir: path.resolve(process.env.BACKUP_DIR || './data/backups'),
  uploadsDir: path.resolve(process.env.UPLOADS_DIR || './uploads'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  maxXmlSizeBytes: parseInt(process.env.MAX_XML_SIZE_BYTES || '10485760', 10), // 10MB
  defaultSimulatedDelayMs: parseInt(process.env.DEFAULT_SIMULATED_DELAY_MS || '0', 10),
  enableDevLatencySimulation: process.env.ENABLE_DEV_LATENCY_SIMULATION === 'true'
};
