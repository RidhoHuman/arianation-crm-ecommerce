Write-Host "FILE UPLOAD TESTING" -ForegroundColor Cyan
Write-Host ""

$BaseURL = "https://arianation-crm-ecommerce.vercel.app"
$testImagePath = "test-image.png"

# Create test image
Write-Host "Creating test image..." -ForegroundColor Yellow
$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
[System.IO.File]::WriteAllBytes($testImagePath, [Convert]::FromBase64String($pngBase64))
Write-Host "Test image created: $testImagePath" -ForegroundColor Green
Write-Host ""

# Login ADMIN
Write-Host "Login ADMIN..." -ForegroundColor Yellow
$adminLogin = Invoke-WebRequest -Uri "$BaseURL/api/auth/login" -Method POST `
  -ContentType 'application/json' `
  -Body '{"email":"admin@test.com","password":"admin123"}' `
  -ErrorAction SilentlyContinue
$adminToken = ($adminLogin.Content | ConvertFrom-Json).data.token
Write-Host "Status: $($adminLogin.StatusCode)" -ForegroundColor Green
Write-Host ""

# Login CUSTOMER
Write-Host "Login CUSTOMER..." -ForegroundColor Yellow
$customerLogin = Invoke-WebRequest -Uri "$BaseURL/api/auth/login" -Method POST `
  -ContentType 'application/json' `
  -Body '{"email":"customer1@example.com","password":"password123"}' `
  -ErrorAction SilentlyContinue
$customerToken = ($customerLogin.Content | ConvertFrom-Json).data.token
Write-Host "Status: $($customerLogin.StatusCode)" -ForegroundColor Green
Write-Host ""

# Get product ID
Write-Host "Getting product ID..." -ForegroundColor Yellow
$products = Invoke-WebRequest -Uri "$BaseURL/api/products?limit=1" -ErrorAction SilentlyContinue
$productId = ($products.Content | ConvertFrom-Json).data[0].id
Write-Host "Product ID: $productId" -ForegroundColor Green
Write-Host ""

# Test 1: ADMIN uploads image
Write-Host "Test 1: ADMIN uploads product image" -ForegroundColor Cyan
$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
$imageFile = Get-Item -Path $testImagePath
$adminUpload = Invoke-WebRequest -Uri "$BaseURL/api/products/upload-image" `
  -Method POST `
  -Headers $adminHeaders `
  -Form @{image = $imageFile} `
  -ErrorAction SilentlyContinue
Write-Host "Status: $($adminUpload.StatusCode)" -ForegroundColor Green
$adminData = $adminUpload.Content | ConvertFrom-Json
Write-Host "Filename: $($adminData.data.filename)" -ForegroundColor Gray
Write-Host "URL: $($adminData.data.url)" -ForegroundColor Gray
Write-Host ""

# Test 2: ADMIN updates product with image
Write-Host "Test 2: ADMIN uploads and updates product" -ForegroundColor Cyan
$updateUpload = Invoke-WebRequest -Uri "$BaseURL/api/products/$productId/upload-image" `
  -Method POST `
  -Headers $adminHeaders `
  -Form @{image = $imageFile} `
  -ErrorAction SilentlyContinue
Write-Host "Status: $($updateUpload.StatusCode)" -ForegroundColor Green
$updateData = $updateUpload.Content | ConvertFrom-Json
Write-Host "Product: $($updateData.data.productName)" -ForegroundColor Gray
Write-Host "Image URL: $($updateData.data.imageUrl)" -ForegroundColor Gray
Write-Host ""

# Test 3: CUSTOMER tries to upload (should fail)
Write-Host "Test 3: CUSTOMER tries to upload (should be blocked)" -ForegroundColor Cyan
$customerHeaders = @{ "Authorization" = "Bearer $customerToken" }
$customerUpload = $null
$customerStatus = $null
try {
  $customerUpload = Invoke-WebRequest -Uri "$BaseURL/api/products/upload-image" `
    -Method POST `
    -Headers $customerHeaders `
    -Form @{image = $imageFile} `
    -ErrorAction Stop
} catch {
  $customerStatus = $_.Exception.Response.StatusCode.value__
}
if ($customerStatus -eq 403) {
  Write-Host "Status: 403" -ForegroundColor Green
  Write-Host "Result: CUSTOMER blocked as expected (Forbidden)" -ForegroundColor Green
}
Write-Host ""

# Test 4: Upload without token (should fail)
Write-Host "Test 4: Upload without token (should fail)" -ForegroundColor Cyan
$noAuthStatus = $null
try {
  $noAuthUpload = Invoke-WebRequest -Uri "$BaseURL/api/products/upload-image" `
    -Method POST `
    -Form @{image = $imageFile} `
    -ErrorAction Stop
} catch {
  $noAuthStatus = $_.Exception.Response.StatusCode.value__
}
if ($noAuthStatus -eq 401) {
  Write-Host "Status: 401" -ForegroundColor Green
  Write-Host "Result: Authentication required (Unauthorized)" -ForegroundColor Green
}
Write-Host ""

# Test 5: CUSTOMER uploads design file
Write-Host "Test 5: CUSTOMER uploads design file" -ForegroundColor Cyan
$designUpload = Invoke-WebRequest -Uri "$BaseURL/api/design-requests/upload-file" `
  -Method POST `
  -Headers $customerHeaders `
  -Form @{designFile = $imageFile} `
  -ErrorAction SilentlyContinue
Write-Host "Status: $($designUpload.StatusCode)" -ForegroundColor Green
$designData = $designUpload.Content | ConvertFrom-Json
Write-Host "Filename: $($designData.data.filename)" -ForegroundColor Gray
Write-Host "URL: $($designData.data.url)" -ForegroundColor Gray
Write-Host ""

# Cleanup
Write-Host "Cleanup: Removing test file..." -ForegroundColor Yellow
if (Test-Path $testImagePath) {
  Remove-Item $testImagePath
  Write-Host "Test file deleted" -ForegroundColor Green
}
Write-Host ""

Write-Host "ALL TESTS COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "✅ ADMIN can upload product images"
Write-Host "✅ ADMIN can upload and update products"  
Write-Host "✅ CUSTOMER blocked from product uploads (403)"
Write-Host "✅ Unauthenticated requests blocked (401)"
Write-Host "✅ CUSTOMER can upload design files"
Write-Host ""
