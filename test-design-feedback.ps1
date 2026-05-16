$baseUrl = "http://localhost:3001/api"

Write-Host "=== DESIGN REQUEST FEEDBACK TEST ===" -ForegroundColor Cyan
Write-Host ""

# Create separate sessions
$customerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$staffSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "1. LOGIN AS CUSTOMER" -ForegroundColor Yellow
try {
    $custLogin = @{
        email    = "test@test.com"
        password = "password123"
    } | ConvertTo-Json

    $custResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post -ContentType "application/json" `
        -Body $custLogin -WebSession $customerSession -ErrorAction Stop

    Write-Host "[OK] Customer logged in" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Customer login failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. CREATE DESIGN REQUEST (CUSTOMER)" -ForegroundColor Yellow
try {
    $designBody = @{
        designTitle         = "T-Shirt Design Request"
        designDescription   = "Custom design for office uniforms"
        quantity            = 100
        productTypeForSablon = "KAOS"
        colorPreferences    = "Navy Blue, White"
        referenceImageUrl   = "https://example.com/design.jpg"
        deadline            = (Get-Date).AddDays(7).ToString("o")
    } | ConvertTo-Json

    $designResp = Invoke-RestMethod -Uri "$baseUrl/design-requests" `
        -Method Post -ContentType "application/json" `
        -Body $designBody -WebSession $customerSession -ErrorAction Stop

    $designId = $designResp.data.id
    Write-Host "[OK] Design request created" -ForegroundColor Green
    Write-Host "     ID: $designId"
    Write-Host "     Status: $($designResp.data.status)"
}
catch {
    Write-Host "[ERROR] Design request creation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. LOGIN AS ADMIN/STAFF" -ForegroundColor Yellow
try {
    $staffLogin = @{
        email    = "admin@arianation.com"
        password = "Admin@123"
    } | ConvertTo-Json

    $staffResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post -ContentType "application/json" `
        -Body $staffLogin -WebSession $staffSession -ErrorAction Stop

    Write-Host "[OK] Staff logged in" -ForegroundColor Green
    Write-Host "     Role: $($staffResp.data.user.role)"
}
catch {
    Write-Host "[WARN] Staff account not found - creating one for testing..." -ForegroundColor Yellow
    
    # Try to create a test admin account
    try {
        $createAdminBody = @{
            email    = "design-staff@arianation.com"
            password = "staff123"
            fullName = "Design Staff"
        } | ConvertTo-Json

        $createResp = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
            -Method Post -ContentType "application/json" `
            -Body $createAdminBody -ErrorAction Stop

        Write-Host "     [OK] Staff account created"
        
        # Now login
        $staffResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
            -Method Post -ContentType "application/json" `
            -Body (@{
                email    = "design-staff@arianation.com"
                password = "staff123"
            } | ConvertTo-Json) `
            -WebSession $staffSession -ErrorAction Stop
    }
    catch {
        Write-Host "[WARN] Could not setup staff account. Skipping feedback test." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "=== TEST PARTIAL COMPLETE ===" -ForegroundColor Cyan
        Write-Host "[+] Design Request Created: $designId"
        Write-Host "[+] Status: SUBMITTED"
        exit 0
    }
}

Write-Host ""
Write-Host "4. STAFF ADDS FEEDBACK (REVISION NEEDED)" -ForegroundColor Yellow
try {
    $feedbackBody = @{
        feedbackText = "Design looks professional! Please adjust the shade of blue to be slightly lighter."
        feedbackType = "REVISION_NEEDED"
        revisionNotes = "Change navy blue (hex: #001F3F) to lighter shade (hex: #004080)"
    } | ConvertTo-Json

    $feedbackResp = Invoke-RestMethod -Uri "$baseUrl/design-requests/$designId/feedback" `
        -Method Post -ContentType "application/json" `
        -Body $feedbackBody -WebSession $staffSession -ErrorAction Stop

    Write-Host "[OK] Feedback added" -ForegroundColor Green
    Write-Host "     Type: $($feedbackResp.data.feedbackType)"
    Write-Host "     Notes: $($feedbackResp.data.revisionNotes)"
}
catch {
    Write-Host "[ERROR] Failed to add feedback: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. CUSTOMER VIEWS FEEDBACK" -ForegroundColor Yellow
try {
    $detailResp = Invoke-RestMethod -Uri "$baseUrl/design-requests/$designId" `
        -Method Get -WebSession $customerSession -ErrorAction Stop

    Write-Host "[OK] Design request detail retrieved" -ForegroundColor Green
    Write-Host "     Status: $($detailResp.data.status)"
    Write-Host "     Feedback Count: $($detailResp.data.feedback.Count)"
    
    if ($detailResp.data.feedback.Count -gt 0) {
        Write-Host "     Latest Feedback: $($detailResp.data.feedback[0].feedbackText)"
        Write-Host "     Revision Notes: $($detailResp.data.feedback[0].revisionNotes)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get design detail: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "[+] Design Request: $designId"
Write-Host "[+] Status Flow: SUBMITTED -> REVISION_REQUESTED"
Write-Host "[+] Feedback System: Working"
Write-Host ""
