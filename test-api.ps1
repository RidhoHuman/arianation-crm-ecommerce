# Arianation CRM - API Testing dengan PowerShell
# Buka PowerShell dan run file ini: .\test-api.ps1
# Atau copy-paste individual commands

# ═══════════════════════════════════════════════════
# 1. HEALTH CHECK
# ═══════════════════════════════════════════════════

Write-Host "Testing API Health..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET
$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

# ═══════════════════════════════════════════════════
# 2. REGISTER USER
# ═══════════════════════════════════════════════════

Write-Host "`nRegistering new user..." -ForegroundColor Cyan
$body = @{
    name     = "Budi Santoso"
    email    = "budi@arianation.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

# ═══════════════════════════════════════════════════
# 3. LOGIN (Save session for later)
# ═══════════════════════════════════════════════════

Write-Host "`nLogging in..." -ForegroundColor Cyan
$body = @{
    email    = "budi@arianation.com"
    password = "password123"
} | ConvertTo-Json

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -WebSession $session `
    -ResponseHeadersVariable "RespHeaders"

# Extract and save cookies
$cookies = $session.Cookies.GetCookies("http://localhost:3001")
Write-Host "Cookies:" -ForegroundColor Green
$cookies | ForEach-Object { Write-Host "  $($_.Name) = $($_.Value)" }

# Show response
$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

# ═══════════════════════════════════════════════════
# 4. GET PRODUCTS
# ═══════════════════════════════════════════════════

Write-Host "`nGetting products..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/products" -Method GET
$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

# ═══════════════════════════════════════════════════
# 5. GUEST CHECKOUT
# ═══════════════════════════════════════════════════

Write-Host "`nGuest checkout..." -ForegroundColor Cyan
$body = @{
    firstName  = "Budi"
    lastName   = "Santoso"
    address    = "Jl. Merdeka 123"
    city       = "Jakarta"
    postalCode = "12210"
    phone      = "081234567890"
    country    = "INDONESIA"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/checkout" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

# ═══════════════════════════════════════════════════
# 6. AUTHENTICATED CHECKOUT (Using saved session)
# ═══════════════════════════════════════════════════

Write-Host "`nAuthenticated checkout..." -ForegroundColor Cyan
$body = @{
    firstName  = "Budi"
    lastName   = "Santoso"
    address    = "Jl. Merdeka 123"
    city       = "Jakarta"
    postalCode = "12210"
    phone      = "081234567890"
    country    = "INDONESIA"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/checkout" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -WebSession $session

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

# ═══════════════════════════════════════════════════
# 7. GET MY PROFILE (With auth)
# ═══════════════════════════════════════════════════

Write-Host "`nGetting my profile..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/users/me" `
    -Method GET `
    -WebSession $session

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

# ═══════════════════════════════════════════════════
# 8. LOGOUT
# ═══════════════════════════════════════════════════

Write-Host "`nLogging out..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/logout" `
    -Method POST `
    -ContentType "application/json" `
    -WebSession $session

$response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host

# ═══════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════

function Test-API {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    try {
        if ($Body) {
            $Body = $Body | ConvertTo-Json
        }
        
        $response = Invoke-WebRequest -Uri $Uri -Method $Method -Body $Body -ContentType "application/json"
        $response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host -ForegroundColor Green
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# USAGE EXAMPLES:
# Test-API "http://localhost:3001/api/health"
# Test-API "http://localhost:3001/api/products" GET
# Test-API "http://localhost:3001/api/auth/login" POST @{email="test@example.com"; password="123"}
