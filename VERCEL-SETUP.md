# Vercel Deployment Setup Guide

## Overview

Panduan lengkap untuk setup dan deploy aplikasi Arianation CRM ke Vercel dengan GitHub Actions automation.

## 📋 Prerequisites

1. ✅ Project sudah push ke GitHub (main branch)
2. ✅ Akun Vercel (Sign up: https://vercel.com)
3. ✅ GitHub Account dengan repository access
4. ✅ CI/CD pipeline sudah setup (lihat `CI-CD-SETUP.md`)

---

## 🚀 Setup Steps

### Step 1: Create Vercel Project

#### Option A: Via Vercel Web (Recommended)
1. Buka https://vercel.com/new
2. Click "Import Git Repository"
3. Pilih GitHub repository `arianation-crm-ecommerce`
4. Configure project:
   - **Project Name:** `arianation-crm-ecommerce`
   - **Framework:** Other (Node.js)
   - **Root Directory:** `.` (default)
   - **Build Command:** Leave empty (atau `npm run build`)
5. Click "Deploy"

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy project
vercel --prod
```

### Step 2: Configure Environment Variables

1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Tambahkan variables:

```
DATABASE_URL     = postgresql://user:password@host:5432/arianation_db
JWT_SECRET       = your-secret-key-here (min 32 chars)
NODE_ENV         = production
PORT             = 3000
```

**Cara generate JWT_SECRET:**
```bash
# Terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Setup GitHub Integration

1. Buka project di Vercel → Settings → Git
2. Pastikan GitHub connected
3. Configure deployment branches:
   - **Production Branch:** `main`
   - **Preview Deployments:** `develop` (optional)

### Step 4: Generate GitHub Secrets

1. Buka Vercel → Account Settings → Tokens
2. Click "Create Token"
3. Beri nama: `github-ci-deployment`
4. Copy token

#### Add to GitHub Secrets
1. Buka GitHub Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Tambahkan:

**Secret 1: VERCEL_TOKEN**
```
Name:  VERCEL_TOKEN
Value: <paste token dari Vercel>
```

**Secret 2: VERCEL_ORG_ID**
```
Name:  VERCEL_ORG_ID
Value: <lihat di Vercel Dashboard URL atau Settings>
```

**Secret 3: VERCEL_PROJECT_ID**
```
Name:  VERCEL_PROJECT_ID
Value: <lihat di Vercel Dashboard URL atau Settings>
```

**Cara cari ORG_ID dan PROJECT_ID:**
1. Buka Vercel Dashboard
2. Perhatikan URL: `https://vercel.com/<ORG_ID>/arianation-crm-ecommerce`
3. PROJECT_ID ada di Settings atau Project Overview

### Step 5: Test Deployment

```bash
# Push ke main branch untuk trigger CI/CD
git add .
git commit -m "Setup CI/CD and Vercel deployment"
git push origin main

# Check GitHub Actions
# Buka repo → Actions tab
# Tunggu pipeline selesai dan app ter-deploy
```

---

## 📊 Deployment Configuration

### File: `vercel.json`

```json
{
  "buildCommand": "npm run build || true",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "other",
  "env": [
    {"key": "DATABASE_URL", "type": "plain"},
    {"key": "JWT_SECRET", "type": "secret"}
  ]
}
```

**Penjelasan:**
- `buildCommand`: Build script (opsional untuk Node.js)
- `devCommand`: Local dev command
- `installCommand`: Install dependencies
- `framework`: Framework type (other untuk Express)
- `env`: Environment variables yang diperlukan

### GitHub Actions Integration

Workflow file: `.github/workflows/ci-cd.yml`

Deployment step:
```yaml
- name: Deploy to Vercel
  uses: vercel/action@master
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🎯 Deployment Workflow

### Automatic Deployment (via GitHub Actions)

```
Push to main branch
     ↓
GitHub Actions triggered
     ↓
Run tests
     ↓
Run linting
     ↓
Run security scan
     ↓
All PASS ✅
     ↓
Deploy to Vercel
     ↓
App live at: https://arianation-crm-ecommerce.vercel.app
```

### Manual Deployment

**Via GitHub Actions (Recommended):**
1. Buka repository → Actions tab
2. Click "Manual Deploy" workflow
3. Click "Run workflow"
4. Choose environment (staging/production)
5. Click "Run workflow"

**Via Vercel Dashboard:**
1. Buka Vercel Dashboard
2. Click project
3. Click "Deployments" tab
4. Click "⋯" → "Redeploy"

**Via Vercel CLI:**
```bash
vercel --prod    # Deploy to production
vercel           # Deploy to preview
```

---

## 📱 Access Deployed App

After successful deployment:

```
Production URL:  https://arianation-crm-ecommerce.vercel.app
Preview URL:     https://[branch-name]-arianation.vercel.app
```

**Test API:**
```bash
# Health check
curl https://arianation-crm-ecommerce.vercel.app/health

# Or with API client (Postman, Insomnia)
GET https://arianation-crm-ecommerce.vercel.app/health
```

---

## 🔒 Security & Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` file
- ✅ Use GitHub Secrets untuk production
- ✅ Use Vercel Environment Variables
- ✅ Rotate JWT_SECRET regularly

### 2. Branch Protection
1. Buka GitHub → Settings → Branches
2. Add rule untuk `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

### 3. Monitoring
- Set up error logging (Sentry, DataDog, etc.)
- Monitor performance metrics
- Set up alerts untuk errors

### 4. Database Security
- ✅ Use strong passwords
- ✅ Restrict database access by IP
- ✅ Use SSL/TLS for connections
- ✅ Regular backups

---

## 🐛 Troubleshooting

### Issue 1: Build Fails on Vercel
```
Error: Build command failed
```
**Solution:**
- Check vercel.json buildCommand
- Ensure all dependencies installed: `npm ci`
- Check environment variables set in Vercel

### Issue 2: Environment Variables Not Found
```
Error: DATABASE_URL is undefined
```
**Solution:**
1. Vercel Dashboard → Settings → Environment Variables
2. Add missing variables
3. Redeploy: Click "⋯" → "Redeploy"

### Issue 3: GitHub Actions Deploy Fails
```
Error: Unauthorized: Invalid Vercel token
```
**Solution:**
1. Check VERCEL_TOKEN in GitHub Secrets
2. Regenerate token dari Vercel
3. Update GitHub Secret
4. Retry workflow

### Issue 4: Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:**
- Verify DATABASE_URL is correct
- Check database server is running
- Verify network access (firewall, security groups)
- Test locally: `psql $DATABASE_URL`

### Issue 5: Cold Start Timeout
```
Error: Lambda timeout (60s)
```
**Solution:**
- Optimize code (remove heavy operations)
- Increase timeout in vercel.json (max 900s)
- Consider database connection pooling

---

## 📈 Monitoring & Logs

### View Deployment Logs

**Via Vercel Dashboard:**
1. Project → Deployments tab
2. Click deployment
3. View "Deployment" and "Runtime Logs"

**Via Vercel CLI:**
```bash
vercel logs --follow    # Real-time logs
vercel env list         # View environment variables
```

**Via GitHub Actions:**
1. Repository → Actions tab
2. Click workflow run
3. Click "Deploy to Vercel" job
4. View logs

---

## 🔄 Update & Redeployment

### Update Application

```bash
# Make code changes
git add .
git commit -m "feat: new feature"
git push origin main

# Auto-deployed via GitHub Actions
```

### Rollback Deployment

1. Vercel Dashboard → Deployments
2. Find previous deployment
3. Click "⋯" → "Promote to Production"

---

## 📚 Resources

- Vercel Docs: https://vercel.com/docs
- Vercel GitHub Integration: https://vercel.com/docs/deployments/git
- Express.js Deployment: https://expressjs.com/en/advanced/health-check-graceful-shutdown.html
- Environment Variables: https://vercel.com/docs/projects/environment-variables

---

## ✅ Checklist

- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] GitHub secrets added (VERCEL_TOKEN, ORG_ID, PROJECT_ID)
- [ ] vercel.json configured
- [ ] First deployment successful
- [ ] API endpoints accessible
- [ ] Database connected
- [ ] CI/CD pipeline working
- [ ] Monitoring setup
- [ ] Team members have access

---

**Last Updated:** May 2, 2026
**Status:** ✅ Production Ready
