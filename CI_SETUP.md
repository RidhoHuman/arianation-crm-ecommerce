# GitHub Actions CI Setup Guide

## Overview
This project uses GitHub Actions to automatically run tests on push and pull requests. To enable the workflow, you need to configure repository secrets. For production upload and signed-URL behavior, see [RUNBOOK.md](RUNBOOK.md).

## Prerequisites
- GitHub repository access with admin permissions
- Node.js 20+ (for local development)
- PostgreSQL connection string for CI (`DATABASE_URL`)
- JWT secret for authenticated smoke tests (`JWT_SECRET`)
- Supabase project access if you want the E2E upload job to run

## Step 1: Add Repository Secrets

Navigate to your GitHub repository:
- Settings → Secrets and variables → Actions
- Click "New repository secret" button

### Required Secrets for `upload-tests.yml`

The workflow in [.github/workflows/upload-tests.yml](.github/workflows/upload-tests.yml) uses these repository secrets:

- `DATABASE_URL` for the DB-heavy test job
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` for the Supabase E2E job
- Optional: any other deployment secrets you already use in production

Add the secrets below in the same repository, under Settings → Secrets and variables → Actions.

#### 1. DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: a valid PostgreSQL connection string, for example `postgresql://user:password@host:5432/arianation_db?sslmode=require`
  - Use the same database host and credentials as your production/test database
- Click "Add secret"

#### 2. SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Value**: your Supabase project URL, for example `https://your-project-ref.supabase.co`
- Click "Add secret"

#### 3. SUPABASE_SERVICE_ROLE_KEY
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: your Supabase service role key
  - Keep this server-side only
- Click "Add secret"

#### 4. SUPABASE_STORAGE_BUCKET
- **Name**: `SUPABASE_STORAGE_BUCKET`
- **Value**: your bucket name, for example `uploads`
- Click "Add secret"

If you also use the legacy MySQL workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml), keep `MYSQL_ROOT_PASSWORD` and `MYSQL_DATABASE` there as separate secrets. They are not required for `upload-tests.yml`.

### Required Secrets for `admin-smoke.yml`

The workflow in [.github/workflows/admin-smoke.yml](.github/workflows/admin-smoke.yml) runs the backend, logs in with the OWNER smoke user, and checks the main admin endpoints.

- `DATABASE_URL` for Prisma migrations and the backend connection
- `JWT_SECRET` for backend authentication

The workflow seeds or upserts only the OWNER smoke user it needs; it does not require the full product seed.

## Step 2: Verify CI Workflow

1. Push a commit or create a pull request
2. Go to Actions tab in your repo
3. You should see the "Upload Middleware Tests" workflow running
4. Monitor the steps:
   - Checkout
   - Cache setup
   - Node.js installation
  - Secret checks for `DATABASE_URL` and Supabase
   - Dependencies installation
  - Main unit test suite
  - DB-heavy tests when `DATABASE_URL` is valid
  - Supabase E2E tests when all Supabase secrets are present

For the admin smoke workflow, you should see:
- Secret check for `DATABASE_URL` and `JWT_SECRET`
- Prisma generate and migrate steps
- OWNER smoke user setup
- Backend startup and health polling
- Structured admin smoke test output

If you add or update secrets later, re-run the workflow from the Actions tab or push a new commit to trigger fresh jobs.

## Workflow Features

✅ **Node Caching** - npm cache and node_modules cached using `package-lock.json` hash
✅ **PostgreSQL-ready CI** - DB-heavy tests only run when `DATABASE_URL` is a valid PostgreSQL URL
✅ **Separated test jobs** - unit tests, DB-heavy tests, and Supabase E2E tests run as independent jobs
✅ **Supabase E2E gating** - real storage tests only run when all Supabase secrets are configured
✅ **Jest Tests** - full unit suite runs with coverage
✅ **Secrets Management** - All sensitive data stored securely in repository secrets

## Local Development

### Run Tests Locally
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm test
npm run smoke:admin -- --json
```

### Watch Mode
```bash
npm run test:watch
```

## Troubleshooting

### Database Secret Missing or Invalid
- Verify `DATABASE_URL` secret is a valid PostgreSQL connection string
- If `db-heavy-tests` is skipped, confirm the secret starts with `postgres://` or `postgresql://`
- If `e2e-supabase` is skipped, confirm all three Supabase secrets are present
- The setup job names are `check-database-url` and `check-supabase-secrets`, so a skipped job usually means one of those checks returned `false`

### Supabase E2E Job Skipped
- Verify `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` are all added as repository secrets
- Confirm the Supabase bucket exists and the service role key has storage permissions
- Check the workflow run summary to see whether `check-supabase-secrets` returned `run_e2e=true`
- If the E2E job fails on Node 20 realtime initialization, ensure the `ws` dependency is installed and committed

### Prisma Migration Fails
- Ensure migrations folder exists: `prisma/migrations/`
- Run `npx prisma migrate dev` locally first to test
- Check `.env` or CI environment has correct DATABASE_URL

### Tests Fail in CI but Pass Locally
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

**Last updated**: May 23, 2026
