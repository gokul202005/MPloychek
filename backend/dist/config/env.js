"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'mploychek_secure_super_secret_jwt_key_2026_enterprise_9981',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    dataDir: path_1.default.resolve(process.env.DATA_DIR || './data'),
    xmlDataFile: path_1.default.resolve(process.env.XML_DATA_FILE || './data/mploychek.xml'),
    backupDir: path_1.default.resolve(process.env.BACKUP_DIR || './data/backups'),
    uploadsDir: path_1.default.resolve(process.env.UPLOADS_DIR || './uploads'),
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
    maxXmlSizeBytes: parseInt(process.env.MAX_XML_SIZE_BYTES || '10485760', 10), // 10MB
    defaultSimulatedDelayMs: parseInt(process.env.DEFAULT_SIMULATED_DELAY_MS || '0', 10),
    enableDevLatencySimulation: process.env.ENABLE_DEV_LATENCY_SIMULATION === 'true'
};
