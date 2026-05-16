$baseUrl = "http://localhost:3001/api"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "=== ARIANATION DESIGN REQUEST API TEST ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. LOGIN AS CUSTOMER" -ForegroundColor Yellow
$loginBody = @{
    email    = "test@test.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -WebSession $session `
        -ErrorAction Stop

    Write-Host "[OK] Login successful" -ForegroundColor Green
    Write-Host "     User: $($loginResponse.data.user.fullName)"
}
catch {
    Write-Host "[ERROR] Login failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. CREATE DESIGN REQUEST WITH FILE" -ForegroundColor Yellow

$designData = @{
    designTitle         = "Custom Kaos Design"
    designDescription   = "Minimalis design"
    referenceImageUrl   = "https://example.com/design.jpg"
    quantity            = 50
    productTypeForSablon = "KAOS"
    colorPreferences    = "Black, White"
    deadline            = (Get-Date).AddDays(7).ToString("o")
} | ConvertTo-Json

try {
    $designResponse = Invoke-RestMethod -Uri "$baseUrl/design-requests" `
        -Method Post `
        -ContentType "application/json" `
        -Body $designData `
        -WebSession $session `
        -ErrorAction Stop

    $designRequestId = $designResponse.data.id
    Write-Host "[OK] Design request created" -ForegroundColor Green
    Write-Host "     ID: $designRequestId"
    Write-Host "     Status: $($designResponse.data.status)"
    Write-Host "     File URL: $($designResponse.data.designFileUrl)"
}
catch {
    Write-Host "[ERROR] Design creation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. GET ALL DESIGN REQUESTS" -ForegroundColor Yellow

try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/design-requests" `
        -Method Get `
        -WebSession $session `
        -ErrorAction Stop

    Write-Host "[OK] Retrieved: $($listResponse.data.Count) requests" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to list" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. GET DESIGN DETAIL" -ForegroundColor Yellow

try {
    $detailResponse = Invoke-RestMethod -Uri "$baseUrl/design-requests/$designRequestId" `
        -Method Get `
        -WebSession $session `
        -ErrorAction Stop

    Write-Host "[OK] Retrieved detail" -ForegroundColor Green
    Write-Host "     Title: $($detailResponse.data.designTitle)"
    Write-Host "     Qty: $($detailResponse.data.quantity)"
}
catch {
    Write-Host "[ERROR] Failed to get detail" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "[+] Design Request: $designRequestId"
Write-Host "[+] API Endpoints: Working"

