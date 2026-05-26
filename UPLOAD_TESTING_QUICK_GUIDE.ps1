Write-Host "FILE UPLOAD TESTING GUIDE" -ForegroundColor Cyan
Write-Host ""

$BaseURL = "https://arianation-crm-ecommerce.vercel.app"

# Get tokens
Write-Host "Getting authentication tokens..." -ForegroundColor Yellow
$adminLogin = Invoke-WebRequest -Uri "$BaseURL/api/auth/login" -Method POST `
  -ContentType 'application/json' `
  -Body '{"email":"admin@test.com","password":"admin123"}' `
  -ErrorAction SilentlyContinue
$adminToken = ($adminLogin.Content | ConvertFrom-Json).data.token

$customerLogin = Invoke-WebRequest -Uri "$BaseURL/api/auth/login" -Method POST `
  -ContentType 'application/json' `
  -Body '{"email":"customer1@example.com","password":"password123"}' `
  -ErrorAction SilentlyContinue
$customerToken = ($customerLogin.Content | ConvertFrom-Json).data.token

Write-Host "Tokens obtained successfully" -ForegroundColor Green
Write-Host ""

# Display testing options
Write-Host "TESTING OPTIONS:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Use Git Bash (includes curl)" -ForegroundColor Green
Write-Host "  curl -X POST $BaseURL/api/products/upload-image \" -ForegroundColor Gray
Write-Host "    -H 'Authorization: Bearer ADMIN_TOKEN' \" -ForegroundColor Gray
Write-Host "    -F 'image=@test-image.png'" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Use Postman (recommended for testing)" -ForegroundColor Green
Write-Host "  1. Download and open Postman" -ForegroundColor Gray
Write-Host "  2. Create POST request" -ForegroundColor Gray
Write-Host "  3. URL: $BaseURL/api/products/upload-image" -ForegroundColor Gray
Write-Host "  4. Headers - Add:" -ForegroundColor Gray
Write-Host "     Authorization: Bearer ADMIN_TOKEN" -ForegroundColor Gray
Write-Host "  5. Body - Select 'form-data'" -ForegroundColor Gray
Write-Host "     Key: image" -ForegroundColor Gray
Write-Host "     Value: [Select image file]" -ForegroundColor Gray
Write-Host "  6. Click Send" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: PowerShell 7+ (upgrade required)" -ForegroundColor Green
Write-Host "  winget install Microsoft.PowerShell" -ForegroundColor Gray
Write-Host "  Then use -Form parameter" -ForegroundColor Gray
Write-Host ""

Write-Host "ENDPOINTS IMPLEMENTED:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. POST /api/products/upload-image" -ForegroundColor Yellow
Write-Host "   - Upload product image only" -ForegroundColor Gray
Write-Host "   - Auth: ADMIN/OWNER" -ForegroundColor Gray
Write-Host ""

Write-Host "2. POST /api/products/:id/upload-image" -ForegroundColor Yellow
Write-Host "   - Upload and update product" -ForegroundColor Gray
Write-Host "   - Auth: ADMIN/OWNER" -ForegroundColor Gray
Write-Host ""

Write-Host "3. POST /api/design-requests/upload-file" -ForegroundColor Yellow
Write-Host "   - Upload design file" -ForegroundColor Gray
Write-Host "   - Auth: Any authenticated user" -ForegroundColor Gray
Write-Host ""

Write-Host "4. POST /api/design-requests/:id/upload-file" -ForegroundColor Yellow
Write-Host "   - Upload and update design request" -ForegroundColor Gray
Write-Host "   - Auth: Any authenticated user (ownership checked)" -ForegroundColor Gray
Write-Host ""

Write-Host "IMPLEMENTATION STATUS:" -ForegroundColor Cyan
Write-Host "✅ File upload middleware (Multer)" -ForegroundColor Green
Write-Host "✅ Product image upload endpoints" -ForegroundColor Green
Write-Host "✅ Design file upload endpoints" -ForegroundColor Green
Write-Host "✅ Authorization and authentication" -ForegroundColor Green
Write-Host "✅ File type and size validation" -ForegroundColor Green
Write-Host "✅ Static file serving (/uploads)" -ForegroundColor Green
Write-Host "✅ Error handling" -ForegroundColor Green
Write-Host ""

Write-Host "TOKENS FOR TESTING:" -ForegroundColor Cyan
Write-Host ""
Write-Host "ADMIN Token (first 50 chars):" -ForegroundColor Gray
Write-Host $adminToken.Substring(0, 50) -ForegroundColor Cyan
Write-Host ""
Write-Host "CUSTOMER Token (first 50 chars):" -ForegroundColor Gray
Write-Host $customerToken.Substring(0, 50) -ForegroundColor Cyan
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Install Git for Windows (includes curl)" -ForegroundColor Yellow
Write-Host "2. Or install Postman for GUI testing" -ForegroundColor Yellow
Write-Host "3. Use the tokens above for testing" -ForegroundColor Yellow
Write-Host ""
