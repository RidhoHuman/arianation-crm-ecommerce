# Architecture Migration Plan

**Status**: Draft
**Goal**: Move the stack to a lighter setup for low-RAM machines while keeping the project usable during the transition.

---

## 1. Target Stack

- Frontend: Vite + React
- Backend: `npm run start` for production/runtime simplicity
- Database: MySQL 8 via Laragon for local development and MySQL-compatible production target
- Query layer: `mysql2` + Knex query builder

### Why this stack

- Vite reduces frontend startup and build overhead.
- `npm run start` keeps the backend runtime path simple and predictable.
- MySQL with Laragon is lighter to run locally than PostgreSQL in this context.
- Knex gives explicit SQL control and avoids ORM overhead.

---

## 2. Migration Principles

- Do one layer at a time.
- Keep the app runnable after every phase.
- Freeze large refactors until the current phase is verified.
- Back up data before any database switch.
- Prefer incremental adapters over a big-bang rewrite.

---

## 3. Phased Plan

### Phase 0: Safety Prep

**Goal**: Establish a safe baseline for migration.

Checklist:
- [ ] Create a branch `migration/vite-mysql-knex` off `main`.
- [ ] Document all current `.env` values (DATABASE_URL, API keys, etc.) in a safe private note.
- [ ] Take a full backup of PostgreSQL database:
  ```bash
  pg_dump -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Export current user/product/order data as a CSV or JSON file for manual verification later.
- [ ] Write down exact versions of Node, npm, PostgreSQL currently used.
- [ ] Verify current `npm run dev` and `npm test` both pass before starting migration.
- [ ] Disable auto-deploy CI for the migration branch.
- [ ] Document expected rollback command per phase (e.g., `git revert`, `git checkout main`, database restore).
- [ ] Notify team that migration is starting and feature freeze is in effect.

### Phase 1: Frontend Move to Vite

**Goal**: Migrate frontend to Vite for faster builds and lighter runtime.

Checklist:
- [ ] Audit `frontend/` folder structure:
  - List all entry points (e.g., `src/app.js`, `src/index.js`).
  - Identify build and dev scripts in `frontend/package.json`.
  - Note any environment variable injection patterns.
- [ ] Install Vite and required plugins:
  ```bash
  cd frontend && npm install -D vite @vitejs/plugin-react
  ```
- [ ] Create `frontend/vite.config.js` with React plugin.
- [ ] Update `frontend/index.html` as Vite entry point.
- [ ] Move static assets to `frontend/public/`.
- [ ] Update all import statements if they reference build-specific paths.
- [ ] Update `frontend/package.json` scripts:
  - `"dev": "vite"`
  - `"build": "vite build"`
  - `"preview": "vite preview"`
- [ ] Test `npm run dev` in the frontend folder; confirm startup time and HMR work.
- [ ] Test `npm run build` and check bundle size (should be noticeably smaller).
- [ ] Keep backend API endpoints unchanged—no API contract changes yet.
- [ ] Verify smoke test: login, navigate to main pages, no console errors.
- [ ] Commit: `git commit -m "feat(frontend): migrate to vite"`.

### Phase 2: Backend Runtime Simplification

**Goal**: Ensure backend runs cleanly via `npm run start` without dev-only code.

Checklist:
- [ ] Review `src/index.js` and `src/app.js` for dev-only code:
  - Check for `process.env.NODE_ENV !== 'production'` guards that should be tightened.
  - Remove or conditionally load `nodemon`, debug middlewares, or verbose logging.
- [ ] Ensure `src/index.js` has a minimal startup path.
- [ ] Verify `package.json` has a clean `"start": "node src/index.js"` script.
- [ ] Test backend in production mode locally:
  ```bash
  NODE_ENV=production npm run start
  ```
- [ ] Verify health check endpoint:
  ```bash
  curl http://localhost:3001/api/health
  ```
- [ ] Verify auth flow (login, token validation, protected routes).
- [ ] Check memory usage on start and during a few requests—should be stable and low.
- [ ] Test graceful shutdown (SIGINT/SIGTERM handling).
- [ ] Update `DATABASE_URL` env var usage to be production-ready.
- [ ] Commit: `git commit -m "feat(backend): optimize runtime for production start"`.

### Phase 3: Database Switch to MySQL + Laragon

**Goal**: Migrate database to MySQL 8 for lighter footprint.

Checklist:
- [ ] Set up Laragon:
  - Download and install Laragon from laragon.org.
  - Start MySQL 8 service via Laragon control panel.
  - Verify MySQL is running on `localhost:3306`.
- [ ] Create MySQL database and user:
  ```sql
  CREATE DATABASE arianation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'arianation_user'@'localhost' IDENTIFIED BY 'your_password';
  GRANT ALL PRIVILEGES ON arianation_db.* TO 'arianation_user'@'localhost';
  FLUSH PRIVILEGES;
  ```
- [ ] Update `prisma/schema.prisma`:
  - Change `provider = "postgresql"` to `provider = "mysql"`.
  - Review field types for MySQL compatibility (e.g., `BigInt`, `Decimal` precision).
- [ ] Update `.env`:
  ```
  DATABASE_URL="mysql://arianation_user:password@localhost:3306/arianation_db"
  ```
- [ ] Generate fresh Prisma client:
  ```bash
  npx prisma generate
  ```
- [ ] Push schema to MySQL:
  ```bash
  npx prisma db push
  ```
- [ ] Verify tables exist:
  ```sql
  USE arianation_db;
  SHOW TABLES;
  ```
- [ ] Import data (if applicable):
  - Export from PostgreSQL: `pg_dump -t table_name > table.sql`.
  - Adapt SQL dialect and import into MySQL.
- [ ] Test key flows:
  - User login.
  - Create and fetch product.
  - Create order and check status.
  - File upload.
- [ ] Confirm backups are restorable:
  ```bash
  mysqldump -u arianation_user -p arianation_db > backup_mysql_$(date +%Y%m%d).sql
  ```
- [ ] Commit: `git commit -m "feat(database): migrate from postgresql to mysql"`.

### Phase 4: Replace Prisma With Knex + mysql2

**Goal**: Replace Prisma ORM with Knex + mysql2 for explicit SQL control and lower overhead.

Checklist:
- [ ] Install dependencies:
  ```bash
  npm install mysql2 knex
  ```
- [ ] Create `src/config/knex.js` for Knex instance:
  ```javascript
  const knex = require('knex')({
    client: 'mysql2',
    connection: process.env.DATABASE_URL,
  });
  module.exports = knex;
  ```
- [ ] Create a compatibility layer in `src/db/migrate.js`:
  - Wrapper functions that mimic Prisma API (e.g., `user.findUnique()`, `product.create()`).
  - Use Knex under the hood.
  - Helps reduce churn while replacing ORM.
- [ ] Identify critical tables (User, Product, Order, Payment) that need migration first.
- [ ] For each critical table, create a service (e.g., `src/services/userService.js`):
  - Replace `prisma.user.*` calls with Knex queries.
  - Test after each service migration.
- [ ] Update `src/controllers/` to use the new services instead of Prisma.
- [ ] Remove `prisma/migrations/` and `prisma/` folder once all queries are migrated.
- [ ] Remove Prisma from `package.json` dependencies.
- [ ] Verify:
  - No `prisma.` calls remain in `src/`.
  - All critical endpoints return correct data.
  - No regression in auth, order, or upload flows.
- [ ] Commit incrementally (one service at a time) for easy review and rollback.
- [ ] Final commit: `git commit -m "feat(database): replace prisma with knex + mysql2"`.

### Phase 5: CI, Tests, and Cleanup

**Goal**: Update all testing and CI pipelines to work with the new stack.

Checklist:
- [ ] Update `.github/workflows/ci.yml`:
  - Change DB service from PostgreSQL to MySQL 8.
  - Remove Prisma migration steps; replace with database creation steps.
  - Example:
    ```yaml
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: arianation_db
        options: >-
          --health-cmd="mysqladmin ping"
    ```
- [ ] Update test setup:
  - Replace Prisma seed with raw SQL or Knex fixtures.
  - Example: Create a `__tests__/setup.js` that initializes MySQL test data.
- [ ] Rework integration tests to use Knex directly:
  - Remove Prisma imports.
  - Use `knex.raw()` or Knex query builder for setup/teardown.
- [ ] Update any fixture or factory files to use MySQL syntax.
- [ ] Run full test suite locally:
  ```bash
  npm test
  ```
  - All tests should pass against MySQL.
- [ ] Push migration branch and verify CI runs:
  - CI should provision MySQL service.
  - All tests should pass in CI.
- [ ] Remove or archive PostgreSQL-specific docs:
  - `DATABASE_SETUP.md` (if PostgreSQL-specific; update or replace).
  - Any Prisma migration guides that are now obsolete.
- [ ] Update `RUNBOOK.md` or main setup docs:
  - Replace PostgreSQL instructions with MySQL + Laragon.
  - Update connection string examples.
- [ ] Merge migration branch to `main`:
  ```bash
  git checkout main
  git pull origin main
  git merge migration/vite-mysql-knex
  git push origin main
  ```
- [ ] Tag the migration completion:
  ```bash
  git tag -a v2.0.0-migrated -m "Vite, MySQL, Knex migration complete"
  git push origin v2.0.0-migrated
  ```
- [ ] Commit: `git commit -m "chore: complete ci and test migration to mysql + knex"`.

---

## 4. Risks

- Data migration mistakes during the PostgreSQL to MySQL switch.
- Feature regressions while replacing ORM calls with Knex.
- Frontend routing/build issues when moving to Vite.
- CI breakage if scripts are not updated in the right order.

---

## 5. Rollback Strategy

- Keep the current stack working until the new one is proven.
- Preserve backups before database changes.
- Revert one phase at a time if a phase fails.
- Do not remove the old runtime path until the new path is stable.

---

## 6. Success Criteria

- Frontend builds and runs on Vite.
- Backend starts cleanly with the intended production command.
- MySQL + Laragon works for local development.
- Knex + `mysql2` covers the main data paths.
- CI remains green after the migration.
