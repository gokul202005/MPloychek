# MPloyChek Backend Service

Employment Verification, Workforce Trust & Compliance Platform API.

## Technical Specifications
- **Runtime**: Node.js (v20+ or v25), TypeScript, Express.js
- **Persistence Engine**: Pure XML file storage (`backend/data/mploychek.xml`)
- **No Database Dependency**: Completely eliminates MongoDB, Mongoose, SQL, SQLite, and Firebase.
- **Security**: JWT tokens, bcryptjs password hashing, Zod schema validation, XXE / DOCTYPE attack rejection.
- **Concurrency**: Serialized write queue with atomic temporary-file replacement and automated snapshots.

## Directory Structure
```
backend/
├── data/
│   ├── mploychek.xml         # Primary XML data document
│   └── backups/              # Automated timestamped XML backups
├── uploads/                  # Private evidence vault storage
├── src/
│   ├── app.ts                # Express application configuration
│   ├── server.ts             # Server entrypoint and XML engine startup
│   ├── config/               # Environment configuration
│   ├── repositories/xml/     # Dedicated XML storage engine and entity repositories
│   ├── services/             # Business logic, confidence scoring, telemetry
│   ├── controllers/          # API route handlers
│   ├── routes/               # Express endpoint definitions
│   ├── middleware/           # Auth, rate limiting, telemetry, error handling
│   ├── schemas/              # Zod input validation schemas
│   ├── scripts/seed.ts       # Repeatable demonstration data seed script
│   └── tests/                # Automated backend and XML persistence test suite
```

## Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```

3. **Seed Demonstration Data**:
   ```bash
   npm run seed
   ```

4. **Execute Automated Tests**:
   ```bash
   npm test
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Server will start at `http://localhost:5000`.

## Demo Credentials
- **Administrator**: `admin@mploychek.test` / `Admin@123`
- **General User**: `user@mploychek.test` / `User@123`
