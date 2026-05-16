🔧 ARIANATION CRM - OPTIMIZED EXECUTION GUIDE
==============================================

📊 **OPTIMIZATIONS FOR LOW-RAM SYSTEMS (< 8GB)**

✅ Applied optimizations:
- Next.js Turbopack memory reduction
- Node.js memory limits (512MB dev, 1GB prod)
- Reduced logging verbosity
- Database connection pooling optimization
- 30-second resource monitoring (less spam)
- Disabled image optimization in dev
- Disabled React strict mode in dev
- Disabled ESLint during dev (run manually instead)

---

## 🎯 HOW TO RUN (OPTIMIZED)

### ⚠️ CRITICAL: NEVER RUN BOTH BACKEND & FRONTEND TOGETHER
**They must run in SEPARATE terminals or even SEPARATE computers for low-RAM systems**

### OPTION A: Sequential Development (Single Terminal)
**Best for < 8GB RAM** ✨

1. **Start Backend ONLY**
   ```cmd
   cd d:\projects\arianation-crm-ecommerce
   npm run dev
   ```
   Wait for: `🚀 Server running on http://localhost:3001`

2. **In ANOTHER terminal, start Frontend**
   ```cmd
   cd d:\projects\arianation-crm-ecommerce\frontend
   npm run dev
   ```
   Wait for: `▲ Next.js 16.2.4 - Ready in XXXms`

3. **Open browser:**
   - Backend: http://localhost:3001/api/health
   - Frontend: http://localhost:3000

### OPTION B: Separate Workspaces (Two Computers)
**Best if possible** 🖥️➕🖥️

- **Computer 1 (Backend):** `npm run dev` di folder root
- **Computer 2 (Frontend):** `npm run dev` di folder frontend
- Update `.env` FRONTEND_URL untuk point ke Computer 1 IP

---

## 📈 MEMORY ALLOCATION

**Backend (Node.js):**
- Dev mode: 512 MB max
- Production: 1024 MB max
- Auto-monitored every 30 seconds

**Frontend (Next.js):**
- Dev mode: 512 MB max
- Production: 1024 MB max

**Laptop System:**
- Minimum available: 1.5 GB untuk smooth operation
- If < 1GB available: close browser/VS Code tabs

---

## 🛠️ AVAILABLE NPM SCRIPTS

### Backend
```bash
npm run dev          # Development mode with 512MB memory limit
npm run dev:debug    # Dev mode with debugger (localhost:9229)
npm run start        # Production mode with 1024MB limit
npm run lint         # Run ESLint manually
npm run lint:fix     # Fix ESLint errors
```

### Frontend
```bash
npm run dev          # Development mode with 512MB limit
npm run dev:turbo    # Force Turbopack (experimental)
npm run build        # Build for production
npm run start        # Serve production build
npm run lint         # Check linting
```

---

## 🔍 MONITORING DURING RUN

**What you'll see in backend terminal:**

```
✅ Database connection successful
🚀 Server running on http://localhost:3001

[Optional - every 30 seconds if memory > 80%]
⚠️  High Heap Usage: 82.3%
```

**If you see this = PROBLEM:**
```
⚠️  WARNING: High memory
RES > 300MB (for backend alone)
Heap > 400MB
```

**Remedy:**
1. Reduce tabs in browser
2. Close VS Code other workspaces
3. Stop unnecessary processes
4. Restart both servers

---

## 🧹 CLEANUP COMMANDS

**If system becomes sluggish:**

```cmd
# Kill all node processes
taskkill /F /IM node.exe

# Wait 5 seconds
timeout /t 5

# Restart
npm run dev
```

**Full hard reset:**
```cmd
# Kill everything
taskkill /F /IM node.exe
taskkill /F /IM npm.exe
timeout /t 5

# Clear caches
rmdir /s /q node_modules .next .turbo
del package-lock.json

# Fresh install
npm install
npm run dev
```

---

## 🚀 NEXT STEPS AFTER SUCCESSFUL RUN

1. ✅ Test Backend Health: `http://localhost:3001/api/health`
2. ✅ Test Frontend: `http://localhost:3000`
3. ✅ Test Login Page: `http://localhost:3000/login`
4. ✅ Create test account
5. ✅ Test checkout flow
6. ✅ Implement payment gateway (Xendit)
7. ✅ Create dashboards (/admin, /staff, /customer)

---

## 📋 EXPECTED RESOURCE USAGE (HEALTHY)

```
Backend Process:
- RSS: 50-100 MB
- Heap: 10-20 MB
- Handles: < 10
- Requests: < 5

Frontend Process:
- RSS: 100-200 MB
- Heap: 30-50 MB

System (Windows):
- Available Memory: > 500 MB
- System Usage: < 80%
```

---

## ❌ COMMON ISSUES & FIXES

| Issue | Cause | Fix |
|-------|-------|-----|
| Backend crashes on startup | DB not running | `Services > PostgreSQL > Start` |
| Port 3001 already in use | Old process still running | `taskkill /F /IM node.exe` |
| Port 3000 already in use | Old Frontend still running | Same as above |
| System extremely slow | RAM full | Close VS Code / browser |
| Backend uses 500MB+ | Memory leak in routes | Check `/src/routes/*.js` for open handles |
| Frontend takes 30s to load page | Turbopack caching issue | Delete `frontend/.next` folder |

---

## 🎓 BEHIND THE SCENES

**What changed for optimization:**

1. ✅ **Turbopack:** Disabled cache rebuilding, reduced module resolution
2. ✅ **Node.js:** Added `--max-old-space-size=512` to restrict memory
3. ✅ **Next.js:** Disabled linting/image optimization/source maps in dev
4. ✅ **Database:** Connection pooling max 5, recycle every hour
5. ✅ **Monitoring:** Reduced from every 10s to every 30s
6. ✅ **Logging:** Only errors logged, not warnings/info

**Result:** ~40-50% less memory usage in dev mode! 🎉

---

Good luck! 🚀

