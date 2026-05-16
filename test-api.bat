@REM Arianation CRM - cURL API Testing for Windows CMD
@REM Run this file di Command Prompt (CMD)
@REM Or copy-paste individual commands

@REM ═══════════════════════════════════════════════════
@REM 1. HEALTH CHECK
@REM ═══════════════════════════════════════════════════

curl http://localhost:3001/api/health

@REM Expected: {"success":true,"message":"Arianation API is running"...}

@REM ═══════════════════════════════════════════════════
@REM 2. REGISTER USER
@REM ═══════════════════════════════════════════════════

curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Budi Santoso\",\"email\":\"budi@arianation.com\",\"password\":\"password123\"}"

@REM Expected: {"success":true,"user":{"id":"...","name":"Budi Santoso"...}}

@REM ═══════════════════════════════════════════════════
@REM 3. LOGIN (Save cookies to file for later use)
@REM ═══════════════════════════════════════════════════

curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -c cookies.txt ^
  -d "{\"email\":\"budi@arianation.com\",\"password\":\"password123\"}"

@REM Expected: {"success":true,"user":{"email":"budi@arianation.com"...}}
@REM Note: Cookies saved to cookies.txt untuk authenticated requests

@REM ═══════════════════════════════════════════════════
@REM 4. GET PRODUCTS (No auth needed)
@REM ═══════════════════════════════════════════════════

curl http://localhost:3001/api/products

@REM ═══════════════════════════════════════════════════
@REM 5. GUEST CHECKOUT
@REM ═══════════════════════════════════════════════════

curl -X POST http://localhost:3001/api/checkout ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Budi\",\"lastName\":\"Santoso\",\"address\":\"Jl. Merdeka 123\",\"city\":\"Jakarta\",\"postalCode\":\"12210\",\"phone\":\"081234567890\",\"country\":\"INDONESIA\"}"

@REM Expected: {"success":true,"order":{"id":"...","status":"pending"...}}

@REM ═══════════════════════════════════════════════════
@REM 6. CHECKOUT (With auth - use saved cookies)
@REM ═══════════════════════════════════════════════════

curl -X POST http://localhost:3001/api/checkout ^
  -H "Content-Type: application/json" ^
  -b cookies.txt ^
  -d "{\"firstName\":\"Budi\",\"lastName\":\"Santoso\",\"address\":\"Jl. Merdeka 123\",\"city\":\"Jakarta\",\"postalCode\":\"12210\",\"phone\":\"081234567890\",\"country\":\"INDONESIA\"}"

@REM ═══════════════════════════════════════════════════
@REM 7. GET MY PROFILE (With auth)
@REM ═══════════════════════════════════════════════════

curl http://localhost:3001/api/users/me ^
  -b cookies.txt

@REM ═══════════════════════════════════════════════════
@REM 8. LOGOUT (With auth)
@REM ═══════════════════════════════════════════════════

curl -X POST http://localhost:3001/api/auth/logout ^
  -H "Content-Type: application/json" ^
  -b cookies.txt

@REM Expected: {"success":true,"message":"Logged out successfully"}

@REM ═══════════════════════════════════════════════════
@REM TIPS FOR WINDOWS CMD
@REM ═══════════════════════════════════════════════════

@REM Use ^ for line continuation
@REM Escape double quotes with backslash: \"
@REM Or use single quotes around JSON: -d '{"key":"value"}'

@REM Pretty print JSON:
@REM  - Use online tool: jsonformatter.org
@REM  - Or install jq: choco install jq
@REM    Then: curl url | jq .

@REM Save output to file:
@REM  curl url > response.json

@REM Show headers in response:
@REM  curl -i url

@REM Verbose mode (debug):
@REM  curl -v url
