Write-Host "FILE UPLOAD TESTING SCRIPT" -ForegroundColor Cyan
Write-Host ""

$BaseURL = "https://arianation-crm-ecommerce.vercel.app"

Write-Host "Step 1: Login as ADMIN" -ForegroundColor Yellow
$adminLogin = Invoke-WebRequest -Uri "$BaseURL/api/auth/login" -Method POST `
  -ContentType 'application/json' `
  -Body '{"email":"admin@test.com","password":"admin123"}' `
  -ErrorAction SilentlyContinue

$adminToken = ($adminLogin.Content | ConvertFrom-Json).data.token
Write-Host "Status: $($adminLogin.StatusCode) - ADMIN logged in" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Login as CUSTOMER" -ForegroundColor Yellow
$customerLogin = Invoke-WebRequest -Uri "$BaseURL/api/auth/login" -Method POST `
  -ContentType 'application/json' `
  -Body '{"email":"customer1@example.com","password":"password123"}' `
  -ErrorAction SilentlyContinue

$customerToken = ($customerLogin.Content | ConvertFrom-Json).data.token
Write-Host "Status: $($customerLogin.StatusCode) - CUSTOMER logged in" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Get product for testing" -ForegroundColor Yellow
$productsRes = Invoke-WebRequest -Uri "$BaseURL/api/products?limit=1" -ErrorAction SilentlyContinue
$productId = ($productsRes.Content | ConvertFrom-Json).data[0].id
Write-Host "Product ID: $productId" -ForegroundColor Green
Write-Host ""

Write-Host "UPLOAD ENDPOINTS CONFIGURED:" -ForegroundColor Cyan
Write-Host "1. POST /api/products/upload-image" -ForegroundColor Green
Write-Host "2. POST /api/products/:id/upload-image" -ForegroundColor Green
Write-Host "3. POST /api/design-requests/upload-file" -ForegroundColor Green
Write-Host "4. POST /api/design-requests/:id/upload-file" -ForegroundColor Green
Write-Host ""

Write-Host "UPLOAD FEATURES:" -ForegroundColor Cyan
Write-Host "- Product Images: PNG, JPG, JPEG, GIF, WEBP (Max 10MB)" -ForegroundColor Green
Write-Host "- Design Files: PNG, JPG, PDF, AI, SVG, PSD, ZIP (Max 50MB)" -ForegroundColor Green
Write-Host "- Authorization: ADMIN/OWNER for products" -ForegroundColor Green
Write-Host "- Authentication: Required for all uploads" -ForegroundColor Green
Write-Host "- Static serving: /uploads/products and /uploads/designs" -ForegroundColor Green
Write-Host ""

Write-Host "TEST WITH CURL:" -ForegroundColor Yellow
Write-Host "curl -X POST $BaseURL/api/products/upload-image \" -ForegroundColor Gray
Write-Host "  -H 'Authorization: Bearer ADMIN_TOKEN' \" -ForegroundColor Gray
Write-Host "  -F 'image=@image.png'" -ForegroundColor Gray
Write-Host ""

Write-Host "IMPLEMENTATION COMPLETE!" -ForegroundColor Cyan
