# GitHub Actions CI Setup Guide

## Overview
This project uses GitHub Actions to automatically run tests on push and pull requests. To enable the workflow, you need to configure repository secrets.

## Prerequisites
- GitHub repository access with admin permissions
- Node.js 20+ (for local development)
- MySQL 8.0+ (for local testing)

## Step 1: Add Repository Secrets

Navigate to your GitHub repository:
- Settings → Secrets and variables → Actions
- Click "New repository secret" button

### Required Secrets

Add the following three secrets:

#### 1. MYSQL_ROOT_PASSWORD
- **Name**: `MYSQL_ROOT_PASSWORD`
- **Value**: `password` (or any secure password for test environment)
- Click "Add secret"

#### 2. MYSQL_DATABASE
- **Name**: `MYSQL_DATABASE`
- **Value**: `arianation_db`
- Click "Add secret"

#### 3. DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: `mysql://root:password@127.0.0.1:3306/arianation_db`
  - Replace `password` with the value from MYSQL_ROOT_PASSWORD
  - Replace `arianation_db` with the value from MYSQL_DATABASE
- Click "Add secret"

## Step 2: Verify CI Workflow

1. Push a commit or create a pull request
2. Go to Actions tab in your repo
3. You should see the "CI" workflow running
4. Monitor the steps:
   - Checkout
   - Cache setup
   - Node.js installation
   - MySQL readiness check
   - Dependencies installation
   - Prisma client generation
   - Database migrations
   - Tests execution

## Workflow Features

✅ **Node Caching** - npm cache and node_modules cached using `package-lock.json` hash
✅ **MySQL Service** - Automated MySQL 8.0 container with health checks
✅ **Prisma Migrations** - Database schema applied automatically
✅ **Jest Tests** - Full test suite runs with coverage
✅ **Secrets Management** - All sensitive data stored securely in repository secrets

## Local Development

### Run Tests Locally
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm test
```

### Watch Mode
```bash
npm run test:watch
```

## Troubleshooting

### MySQL Connection Timeout
- Verify `DATABASE_URL` secret is correctly formatted
- Check MYSQL_ROOT_PASSWORD matches in DATABASE_URL
- Workflow waits up to 60 seconds for MySQL startup

### Prisma Migration Fails
- Ensure migrations folder exists: `prisma/migrations/`
- Run `npx prisma migrate dev` locally first to test
- Check `.env` or CI environment has correct DATABASE_URL

### Tests Fail in CI but Pass Locally
- Ensure MySQL versions match (8.0)
- Check node version: workflow uses Node 20, verify your local is compatible
- Rebuild Prisma client: `npx prisma generate`

## Next Steps

Optional enhancements to CI:
- Add ESLint/Prettier checks
- Add security scanning (SAST)
- Add performance benchmarks
- Matrix testing (multiple Node versions)
- Automated deployment on successful tests

---

**Last updated**: May 16, 2026
