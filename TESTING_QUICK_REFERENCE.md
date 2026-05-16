🧪 QUICK REFERENCE - TESTING API TANPA POSTMAN
===============================================

Kamu punya 4 pilihan untuk test API tanpa Postman:

---

## ⚡ PILIHAN TERCEPAT (Recommended)

### Option 1: VS Code REST Client (BEST)
**Keuntungan:** Terorganisir, reusable, terintegrasi VS Code

```
1. Install extension: "REST Client" oleh Huachao Mao
2. Buka file: test-api.rest
3. Klik "Send Request" di atas setiap endpoint
4. Response muncul di tab baru
```

**File:** `test-api.rest` (sudah ready di project)

---

### Option 2: cURL di Terminal (RINGAN)
**Keuntungan:** Paling ringan, bisa debug network, built-in Windows

**Command dasar:**
```bash
# Health check
curl http://localhost:3001/api/health

# Register
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"User\",\"email\":\"user@test.com\",\"password\":\"123\"}"

# Login + save cookies
curl -X POST http://localhost:3001/api/auth/login ^
  -c cookies.txt ^
  -d "{\"email\":\"user@test.com\",\"password\":\"123\"}"

# Use cookies for authenticated requests
curl http://localhost:3001/api/users/me -b cookies.txt
```

**Files:** `test-api.bat` (CMD), `test-api.ps1` (PowerShell)

---

### Option 3: Browser Console (TERCEPAT)
**Keuntungan:** Tidak perlu setup, instant testing

**Di browser F12 → Console:**
```javascript
// Health
fetch('http://localhost:3001/api/health').then(r => r.json()).then(d => console.log(d))

// Register
fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name:'User',email:'test@test.com',password:'123'})
}).then(r => r.json()).then(d => console.log(d))

// Checkout
fetch('http://localhost:3001/api/checkout', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  credentials: 'include',
  body: JSON.stringify({firstName:'Budi',lastName:'Santoso',city:'Jakarta',postalCode:'12210',phone:'081234567890',country:'INDONESIA'})
}).then(r => r.json()).then(d => console.log(d))
```

---

### Option 4: Custom PowerShell Script (FULL CONTROL)
**Keuntungan:** Automasi, save session, pretty print

**Run:**
```powershell
.\test-api.ps1
```

**File:** `test-api.ps1`

---

## 📋 QUICK TEST CHECKLIST

```
□ Health Check:       curl http://localhost:3001/api/health
□ Register:           POST /api/auth/register
□ Login:              POST /api/auth/login (save cookies.txt)
□ Get Products:       curl http://localhost:3001/api/products
□ Guest Checkout:     POST /api/checkout (no auth)
□ Authenticated Req:  curl http://localhost:3001/api/users/me -b cookies.txt
□ Logout:             POST /api/auth/logout
```

---

## 🎯 MY RECOMMENDATION

**Untuk Development:**
1. **Utama:** VS Code REST Client (`test-api.rest`)
   - Organize requests
   - Easy to share
   - Built-in to VS Code

2. **Quick test:** Browser Console
   - Fastest
   - No setup needed

3. **Deep debugging:** cURL dengan `-v` flag
   - Full network inspection
   - Headers, timing, etc

4. **Automation:** PowerShell script
   - Run full test suite
   - Save results

---

## 🚀 GET STARTED NOW

### Step 1: Pastikan backend running
```bash
cd d:\projects\arianation-crm-ecommerce
npm run dev
```

Wait for: `🚀 Server running on http://localhost:3001`

### Step 2: Pilih metode testing

**Method A (VS Code REST Client):**
- Install extension "REST Client"
- Open `test-api.rest`
- Click "Send Request"

**Method B (Terminal cURL):**
```bash
curl http://localhost:3001/api/health
```

**Method C (Browser Console):**
- F12 → Console
- Paste fetch() command

### Step 3: Test workflow
```
1. Health check
2. Register user
3. Login (save cookies)
4. Guest checkout
5. Authenticated checkout (use cookies)
```

---

## 📖 FULL DOCUMENTATION

- `API_TESTING_GUIDE.md` - Detailed guide dengan examples
- `test-api.rest` - VS Code REST Client format
- `test-api.bat` - Windows CMD commands
- `test-api.ps1` - PowerShell script
- `test-api.rest` - Original format (sudah outdated, gunakan yang baru)

---

Good luck testing! 🚀

Kalau ada error, check:
1. Backend running? `npm run dev` di terminal 1
2. Port 3001 open? Check `.env` file
3. Database connected? Check backend log
4. Cookies saved? Use `-c cookies.txt` and `-b cookies.txt`
