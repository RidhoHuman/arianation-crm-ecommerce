# Migration Preparation Backup

**Date**: 2026-05-26  
**Branch**: `migration/vite-mysql-knex`  
**Status**: Phase 0 - Safety Prep in progress

---

## Current System Versions

- Node.js: v24.15.0
- npm: 11.4.0
- PostgreSQL: Via Neon (cloud)
- Git commit: a6e1c65 (docs: expand migration plan with detailed phase-by-phase execution checklists)

---

## Environment Variables (Current .env)

| Variable | Value | Purpose |
|----------|-------|---------|
| DATABASE_URL | postgresql://neondb_owner:*** | Primary DB connection (Neon PostgreSQL, pooler) |
| DIRECT_DATABASE_URL | postgresql://neondb_owner:*** | Direct DB connection (bypasses pooler) |
| JWT_SECRET | your_jwt_secret_key_arianation_123_change_this_in_production | Auth token signing |
| JWT_EXPIRE | 7d | Token expiration period |
| PORT | 3001 | Backend API port |
| NODE_ENV | development | Environment (development/production) |
| BASE_URL | http://localhost:3001 | Backend base URL |
| FRONTEND_URL | http://localhost:3000 | Frontend base URL |
| XENDIT_API_KEY | your_xendit_api_key_here | Payment provider API key |
| XENDIT_WEBHOOK_VERIFY_TOKEN | your_webhook_token_here | Payment webhook verification |

**Note**: Sensitive values redacted. Full values are only in local `.env` file and should never be committed.

---

## Database Information

- **Provider**: PostgreSQL
- **Hosting**: Neon (cloud-based)
- **Connection**: Via pooler at ep-square-thunder-apu4zxs4-pooler.c-7.us-east-1.aws.neon.tech
- **Database name**: neondb
- **Tables expected**: users, products, orders, design_requests, payments, cart_items, order_items, notifications, etc.

---

## Backup Location

- **PostgreSQL backup location**: `backups/` folder
- **Data export location**: `backups/data-export/` folder
- **Latest Backup**: `backup_arianation_db_20260526_175259.sql` (209 KB)
  - **Date**: 2026-05-26 17:52:59
  - **Size**: 209,766 bytes
  - **Status**: ✅ Successfully created
  - **Restores to**: Full PostgreSQL schema + data snapshot
  - **Restore command**:
    ```bash
    psql -U neondb_owner -d neondb < backups/backup_arianation_db_20260526_175259.sql
    ```

---

## Verification Checklist (Pre-Migration)

- [x] Current `npm test` passes (all 38 tests, 9 suites passing)
- [x] Database connectivity confirmed (PostgreSQL via Neon is reachable)
- [ ] Current `npm run dev` passes (frontend + backend start) - ready to verify
- [ ] All key flows work: login, product creation, order placement, file upload - ready to test
- [x] No uncommitted changes (clean git status before migration branch)
- [x] Feature freeze confirmed (migration branch created)

### Test Results (npm test)
- **Status**: ✅ ALL PASSED
- **Test Suites**: 9 passed
- **Tests**: 38 passed
- **Duration**: 21.178 s
- **Key Tests Passing**:
  - Integration tests (orderFulfillment)
  - Batch and Analytics operations
  - Health checks
  - Sentry monitoring
  - Upload middleware
  - Order fulfillment workflows

---

## Rollback Strategy

### Per-Phase Rollback

1. **If Phase 0 fails**: Delete branch, no changes applied.
   ```bash
   git checkout main
   git branch -D migration/vite-mysql-knex
   ```

2. **If Phase 1 (Vite) fails**: Revert commits, restore frontend to Next.js.
   ```bash
   git revert <commit_hash>
   # Or checkout main and retry
   git checkout main
   ```

3. **If Phase 3 (MySQL) fails**: Drop MySQL database, restore PostgreSQL backup.
   ```bash
   mysql -u root -p -e "DROP DATABASE arianation_db;"
   psql -U neondb_owner -d neondb < backup_arianation_db_YYYYMMDD_HHMMSS.sql
   ```

4. **If Phase 4 (Knex) fails**: Restore Prisma folder, revert commits, reinstall Prisma.
   ```bash
   git checkout COMMIT_BEFORE_PHASE_4 -- prisma/
   npm install
   ```

5. **Complete rollback**: Go back to `main` branch.
   ```bash
   git checkout main
   git reset --hard origin/main
   npm install
   # Restore database from backup
   ```

---

## Pre-Migration Verification Results

**To be filled in once verification is complete.**

- Frontend dev server: ✅ / ❌
- Backend dev server: ✅ / ❌
- Jest tests: ✅ / ❌
- Database connection: ✅ / ❌
- Key flows: ✅ / ❌
- Git status: ✅ / ❌

---

## Notes

- This file is created during Phase 0 as a safety reference.
- Keep this file throughout the migration for documentation purposes.
- Update this file after each phase completes.
