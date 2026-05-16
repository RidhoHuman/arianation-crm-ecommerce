🆘 DATABASE SETUP - LANGKAH PENTING!
====================================

Dari test tadi, ada 2 masalah:

1. ❌ Database tables tidak ada
   Error: "The table (not available) does not exist in the current database"
   
2. ❌ Register field error
   Sent: "name" 
   Expected: "fullName"

---

## 🔧 FIX: JALANKAN PRISMA MIGRATION

### STEP 1: Stop Backend
Di terminal yang menjalankan backend, press: **Ctrl+C**

```
[nodemon] app crashed - waiting for file changes before starting...
```

### STEP 2: Buka Terminal BARU

```bash
cd d:\projects\arianation-crm-ecommerce
```

### STEP 3: Jalankan Migration
```bash
npx prisma migrate dev --name init
```

**Expected output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "arianation_db" at "localhost:5432"

✔ Enter a name for the new migration: › init
✔ Created migration: 20260509_init
✔ Ran 1 migration in 0.05s
✔ Generated Prisma Client
```

### STEP 4: Start Backend Lagi
Di terminal backend:
```bash
npm run dev
```

Wait untuk: `✅ Database connection successful`

### STEP 5: Test Register Dengan Field BENAR
Di terminal testing:
```bash
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Test User\",\"email\":\"test123@test.com\",\"password\":\"password123\"}"
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test123@test.com",
    "fullName": "Test User",
    "role": "CUSTOMER",
    "createdAt": "..."
  }
}
```

---

## ✅ CORRECTED TEST COMMANDS

**Register (gunakan fullName, bukan name):**
```bash
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Budi Santoso\",\"email\":\"budi@test.com\",\"password\":\"password123\",\"phone\":\"081234567890\"}"
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login ^
  -c cookies.txt ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"budi@test.com\",\"password\":\"password123\"}"
```

**Get Profile (dengan cookies):**
```bash
curl http://localhost:3001/api/users/me -b cookies.txt
```

**Guest Checkout:**
```bash
curl -X POST http://localhost:3001/api/checkout ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Budi\",\"lastName\":\"Santoso\",\"address\":\"Jl. Test\",\"city\":\"Jakarta\",\"postalCode\":\"12210\",\"phone\":\"081234567890\",\"country\":\"INDONESIA\"}"
```

---

## 🚨 KALAU MASIH ERROR

**Error: "Already exists"?**
Gunakan email baru setiap test:
- test123@test.com
- test456@test.com
- test789@test.com

**Error: "Connection refused"?**
Pastikan:
1. Backend running: `npm run dev` di terminal backend
2. PostgreSQL berjalan
3. .env file benar (DATABASE_URL)

**Error: "Invalid token"?**
Pastikan login berhasil dulu dan cookies tersimpan.

---

## 📋 COMPLETE TESTING WORKFLOW

```bash
# Terminal 1: Backend
npm run dev
# Wait: ✅ Database connection successful

# Terminal 2: Migration + Testing
npx prisma migrate dev --name init

# Test 1: Health
curl http://localhost:3001/api/health

# Test 2: Register (use fullName!)
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"password123\"}"

# Test 3: Login
curl -X POST http://localhost:3001/api/auth/login ^
  -c cookies.txt ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"password123\"}"

# Test 4: Get Profile
curl http://localhost:3001/api/users/me -b cookies.txt

# Test 5: Guest Checkout
curl -X POST http://localhost:3001/api/checkout ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"address\":\"Jl Test\",\"city\":\"Jakarta\",\"postalCode\":\"12210\",\"phone\":\"081234567890\",\"country\":\"INDONESIA\"}"
```

Good luck! 🚀
