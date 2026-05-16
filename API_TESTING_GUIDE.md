🧪 API TESTING GUIDE - TANPA POSTMAN
====================================

Kalau Next.js development sudah berat, jangan paksa Postman!
Ada 3 cara ringan untuk test API di terminal atau browser.

---

## 1️⃣ CURL DI TERMINAL (PALING RINGAN) ✨

### Setup
cURL sudah built-in di Windows 10+. Kalau belum ada:
```cmd
# Test apakah ada
curl --version

# Kalau tidak ada, install via Chocolatey
choco install curl
```

### Format cURL Dasar
```bash
curl [OPTIONS] URL

OPTIONS:
  -X        HTTP method (GET, POST, PUT, DELETE)
  -H        Headers (Content-Type, Authorization)
  -d        Request body (untuk POST/PUT)
  -i        Show response headers
  -v        Verbose (show request & response details)
  -s        Silent (no progress bar)
```

---

## 🔗 CONTOH API CALLS DENGAN CURL

### 1. Test Backend Health (GET)
```bash
curl http://localhost:3001/api/health
```

Expected output:
```json
{
  "success": true,
  "message": "Arianation API is running",
  "timestamp": "2026-05-09T10:30:45.123Z",
  "environment": "development"
}
```

---

### 2. Register User (POST)
```bash
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

**Windows users:** Gunakan `^` untuk line break, atau ketik semua di satu baris.

**Alternative (satu baris):**
```bash
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

Expected output:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

---

### 3. Login (POST + Save Cookie)
```bash
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -c cookies.txt ^
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

Flags:
- `-c cookies.txt` = save cookies ke file `cookies.txt`
- `-b cookies.txt` = gunakan cookies dari file untuk request berikutnya

Output:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

---

### 4. Checkout (POST + Gunakan Cookie)
```bash
curl -X POST http://localhost:3001/api/checkout ^
  -H "Content-Type: application/json" ^
  -b cookies.txt ^
  -d "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"address\":\"Jl. Merdeka 123\",\"city\":\"Jakarta\",\"postalCode\":\"12210\",\"phone\":\"081234567890\",\"items\":[{\"productId\":\"1\",\"quantity\":2}]}"
```

---

### 5. Refresh Token (POST)
```bash
curl -X POST http://localhost:3001/api/auth/refresh ^
  -H "Content-Type: application/json" ^
  -b cookies.txt
```

---

## 🛠️ CURL TIPS & TRICKS

### Save Request ke File (untuk reuse)
```bash
# Save response ke file
curl http://localhost:3001/api/health -o response.json

# Save dengan headers
curl -i http://localhost:3001/api/health > response_with_headers.txt
```

### Pretty Print JSON
**Windows PowerShell:**
```powershell
curl http://localhost:3001/api/health | ConvertFrom-Json | ConvertTo-Json
```

**Windows CMD (dengan jq):**
```bash
curl http://localhost:3001/api/health | jq .
```

### Measure Response Time
```bash
curl -w "\nTime taken: %{time_total}s\n" http://localhost:3001/api/health
```

### Send File as Body
```bash
curl -X POST http://localhost:3001/api/checkout ^
  -H "Content-Type: application/json" ^
  -d @payload.json
```

(Payload ada di file `payload.json`)

---

## 2️⃣ VS CODE REST CLIENT (LEBIH RINGAN) 🚀

### Setup
1. Install extension: **REST Client** oleh Huachao Mao
   - VS Code > Extensions > Search "REST Client" > Install

2. Buat file: `test-api.rest` atau `test-api.http`

3. Isi dengan:

```rest
### Variables
@baseUrl = http://localhost:3001
@contentType = application/json

### Health Check
GET {{baseUrl}}/api/health

### Register User
POST {{baseUrl}}/api/auth/register
Content-Type: {{contentType}}

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

### Login
POST {{baseUrl}}/api/auth/login
Content-Type: {{contentType}}

{
  "email": "john@example.com",
  "password": "password123"
}

### Checkout (Guest)
POST {{baseUrl}}/api/checkout
Content-Type: {{contentType}}

{
  "firstName": "John",
  "lastName": "Doe",
  "address": "Jl. Merdeka 123",
  "city": "Jakarta",
  "postalCode": "12210",
  "phone": "081234567890"
}

### Get Checkout Status
GET {{baseUrl}}/api/checkout/order-id-here

### Logout
POST {{baseUrl}}/api/auth/logout
Content-Type: {{contentType}}

### Refresh Token
POST {{baseUrl}}/api/auth/refresh
Content-Type: {{contentType}}
```

### Cara Pakai
1. Buka file `test-api.rest` di VS Code
2. Hover di atas request (misal `GET {{baseUrl}}/api/health`)
3. Klik "Send Request" yang muncul di atas
4. Response muncul di tab baru

**Keuntungan:**
- ✅ Semua request terorganisir di satu file
- ✅ Bisa save dan share dengan team
- ✅ Jauh lebih ringan dari Postman
- ✅ Terintegrasi dengan VS Code

---

## 3️⃣ BROWSER CONSOLE (TERCEPAT) ⚡

Buka browser > F12 > Console tab > Paste:

### Health Check
```javascript
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Register
```javascript
fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  })
})
  .then(r => r.json())
  .then(d => console.log(d))
```

### Login
```javascript
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
})
  .then(r => r.json())
  .then(d => console.log(d))
```

### Checkout
```javascript
fetch('http://localhost:3001/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    address: 'Jl. Merdeka 123',
    city: 'Jakarta',
    postalCode: '12210',
    phone: '081234567890'
  })
})
  .then(r => r.json())
  .then(d => console.log(d))
```

**Keuntungan:**
- ✅ Tidak perlu install apa-apa
- ✅ Bisa langsung di browser
- ✅ Otomatis include cookies

---

## 🎯 REKOMENDASI WORKFLOW

**Untuk Development Ringan:**

| Task | Method | Alasan |
|------|--------|--------|
| Quick test API | Browser Console | Tercepat, no setup |
| Test API flow | VS Code REST Client | Terorganisir, reusable |
| Debug network | cURL + verbose | Full control |
| Save test cases | VS Code REST Client | Dokumentasi |

---

## 📝 CHECKLIST API YANG HARUS DI-TEST

```bash
□ Health Check          → GET /api/health
□ Register              → POST /api/auth/register
□ Login                 → POST /api/auth/login
□ Refresh Token         → POST /api/auth/refresh
□ Logout                → POST /api/auth/logout
□ Checkout (Guest)      → POST /api/checkout
□ Checkout (Logged in)  → POST /api/checkout (with token)
□ Get Order Status      → GET /api/checkout/:orderId
□ Get User Profile      → GET /api/users/me
□ Get Products          → GET /api/products
□ Create Payment        → POST /api/payments
```

---

## ❌ TROUBLESHOOTING

### Error: "Could not resolve host"
**Masalah:** Backend tidak jalan
**Solusi:** Pastikan `npm run dev` running di terminal backend

### Error: "Connection refused"
**Masalah:** Port 3001 tidak terbuka
**Solusi:** Check `.env` PORT setting, atau `taskkill /F /IM node.exe` dan restart

### Error: "CORS error"
**Masalah:** Request dari frontend di-block
**Solusi:** Sudah fixed di `src/index.js` CORS config, tapi kalau masih ada:
```javascript
// Di src/index.js, check:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Response 401 (Unauthorized)
**Masalah:** Tidak ada token/cookie
**Solusi:** Login dulu, pastikan `-b cookies.txt` atau `credentials: 'include'` di fetch

---

## 🚀 NEXT ACTIONS

1. ✅ Buat file `test-api.rest` dengan requests di atas
2. ✅ Install VS Code REST Client extension
3. ✅ Test satu per satu: health → register → login → checkout
4. ✅ Lihat response di VS Code atau browser console
5. ✅ Kalau error, perbaiki backend code

Good luck! 💪
