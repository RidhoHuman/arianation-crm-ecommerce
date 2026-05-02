# CI/CD Pipeline Setup Guide

## Overview

This project uses **GitHub Actions** untuk automated CI/CD pipeline dengan testing, linting, dan deployment ke Vercel.

## 📁 Workflow Files

```
.github/workflows/
├── ci-cd.yml              # Main CI/CD pipeline (test → lint → deploy)
├── code-analysis.yml      # Code coverage analysis
└── manual-deploy.yml      # Manual deployment trigger
```

## 🔧 Setup Instructions

### 1. GitHub Secrets Configuration

Untuk deploy ke Vercel, kamu perlu setup GitHub Secrets. Ikuti langkah ini:

**Step 1: Generate Vercel Tokens**
1. Buka https://vercel.com/account/tokens
2. Click "Create Token"
3. Copy token dan simpan di tempat aman

**Step 2: Setup GitHub Secrets**
1. Buka repository kamu → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Tambahkan secrets berikut:

```
VERCEL_TOKEN       = <paste Vercel token>
VERCEL_ORG_ID      = <your Vercel org ID>
VERCEL_PROJECT_ID  = <your Vercel project ID>
SNYK_TOKEN         = <optional: Snyk security scan token>
```

**Cara mendapatkan VERCEL_ORG_ID dan VERCEL_PROJECT_ID:**
- Pergi ke https://vercel.com/dashboard
- Buka project kamu
- Di bagian kanan, copy `orgId` dan `projectId` dari URL atau settings

### 2. Local Setup

Sebelum push ke GitHub, pastikan semua tests dan linting lolos:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### 3. First Push to GitHub

```bash
# Setup git remote (jika belum)
git remote add origin https://github.com/USERNAME/arianation-crm-ecommerce.git

# Push ke main branch
git push origin main
```

Setelah push, GitHub Actions akan otomatis trigger dan menjalankan pipeline.

## 🎯 Pipeline Workflow

### Trigger Events

Pipeline berjalan otomatis saat:
- ✅ Push ke `main` atau `develop` branch
- ✅ Pull Request dibuat ke `main` atau `develop`
- ✅ Manual trigger via GitHub Actions tab

### Pipeline Jobs

#### 1. **Testing** (Job 1: `test`)
- Runs on: Ubuntu latest dengan Node 18.x dan 20.x
- Steps:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Run Jest tests dengan coverage
  - Upload coverage ke Codecov

**Success Criteria:** Semua tests harus PASS

#### 2. **Linting** (Job 2: `lint`)
- Runs on: Ubuntu latest dengan Node 20.x
- Steps:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Run ESLint
  - Check code formatting

**Success Criteria:** Tidak ada linting errors

#### 3. **Security Scan** (Job 3: `security`)
- Runs on: Ubuntu latest
- Steps:
  - Checkout code
  - Run npm audit
  - Run Snyk security scan

**Success Criteria:** No critical/high vulnerabilities

#### 4. **Deploy to Vercel** (Job 4: `deploy`)
- Runs on: Ubuntu latest
- **Triggers only when:**
  - All tests, lint, and security checks PASS
  - Push ke `main` branch (tidak trigger di PR atau develop)
- Steps:
  - Checkout code
  - Setup Node.js
  - Deploy ke Vercel production

#### 5. **Notify Failure** (Job 5: `notify`)
- Runs if test atau lint fails
- Sends notification dengan details

### Dependency Graph

```
┌─────────────┐
│   Testing   │
└──────┬──────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌─────────────┐        ┌─────────────┐
│  Linting    │        │  Security   │
└──────┬──────┘        └─────────────┘
       │
       │ (All Passed?)
       ▼
   ┌──────────────────┐
   │ Deploy to Vercel │ (main branch only)
   └──────────────────┘
```

## 📊 Viewing Pipeline Results

### Option 1: GitHub Web UI
1. Buka repository → Actions tab
2. Lihat workflow runs
3. Click run untuk lihat details

### Option 2: Local Terminal
```bash
# View last workflow run
gh run list

# View workflow run details
gh run view <run_id>

# Watch workflow real-time
gh run watch <run_id>
```

Catatan: Butuh GitHub CLI installed (`gh`). Download dari: https://cli.github.com

## 🚨 Troubleshooting

### Issue 1: Tests Failing
```bash
# Local check
npm test

# Fix issues atau check error messages
npm test -- --verbose
```

### Issue 2: Linting Errors
```bash
# Auto-fix most issues
npm run lint:fix

# Check remaining issues
npm run lint
```

### Issue 3: Deploy Fails
- Check VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID di GitHub Secrets
- Pastikan Vercel project sudah exists
- Check Vercel dashboard untuk error details

### Issue 4: Coverage Threshold Not Met
- File: `jest.config.js` → `coverageThreshold`
- Current: 50% minimum
- Increase test coverage atau adjust threshold

## 📝 Common Commands

```bash
# Run specific workflow manually
gh workflow run ci-cd.yml

# View logs
gh run view <run_id> --log

# Cancel running workflow
gh run cancel <run_id>

# Retry failed workflow
gh run rerun <run_id>
```

## 🔐 Security Best Practices

1. **Never commit secrets** - Always use GitHub Secrets
2. **Token rotation** - Regenerate Vercel token periodically
3. **Branch protection** - Require PR reviews before merge
4. **Status checks** - Require passing CI/CD before merge

## 📚 Resources

- GitHub Actions Docs: https://docs.github.com/en/actions
- Vercel Deployment: https://vercel.com/docs/deployments/overview
- Jest Testing: https://jestjs.io/docs/getting-started
- ESLint: https://eslint.org/docs/rules/
- Snyk Security: https://docs.snyk.io/

## ✅ Checklist

- [ ] GitHub Secrets configured (VERCEL_TOKEN, etc.)
- [ ] Local tests passing (`npm test`)
- [ ] Local linting passing (`npm run lint`)
- [ ] Push to GitHub
- [ ] GitHub Actions workflow running
- [ ] All checks passing on GitHub Actions
- [ ] Auto-deployment to Vercel working

---

**Last Updated:** May 2, 2026
**Status:** ✅ Production Ready
