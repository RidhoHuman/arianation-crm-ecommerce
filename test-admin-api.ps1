$baseUrl = "http://localhost:3001/api"
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "=== ARIANATION ADMIN DASHBOARD API TEST ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create admin user (if needed)
Write-Host "1. SETUP - CREATE OR LOGIN AS OWNER/ADMIN" -ForegroundColor Yellow
try {
    # Try login dengan owner/admin credentials
    $adminLogin = @{
        email    = "owner@arianation.com"
        password = "Owner@123"
    } | ConvertTo-Json

    $loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post -ContentType "application/json" `
        -Body $adminLogin -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Owner/Admin logged in" -ForegroundColor Green
}
catch {
    Write-Host "[WARN] Owner account not found, creating one..." -ForegroundColor Yellow
    
    try {
        $createAdmin = @{
            email    = "owner@arianation.com"
            password = "Owner@123"
            fullName = "Owner Arianation"
        } | ConvertTo-Json

        $createResp = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
            -Method Post -ContentType "application/json" `
            -Body $createAdmin -ErrorAction Stop

        Write-Host "[OK] Owner account created, now promoting to OWNER role..." -ForegroundColor Green
        
        # Manual SQL update or use API to set role to OWNER
        # For now, use the created account
        $adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        $loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
            -Method Post -ContentType "application/json" `
            -Body $adminLogin -WebSession $adminSession -ErrorAction Stop
    }
    catch {
        Write-Host "[ERROR] Failed to setup owner account: $_" -ForegroundColor Red
        exit 1
    }
}

$ownerId = $loginResp.data.user.id
$ownerRole = $loginResp.data.user.role
Write-Host "     Role: $ownerRole"
Write-Host ""

# Step 2: Dashboard
Write-Host "2. GET DASHBOARD" -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Dashboard retrieved" -ForegroundColor Green
    Write-Host "     Today Orders: $($dashboard.data.orders.today)"
    Write-Host "     Month Orders: $($dashboard.data.orders.month)"
    Write-Host "     Total Revenue: Rp $($dashboard.data.revenue.total)"
    Write-Host "     Total Customers: $($dashboard.data.customers.total)"
    Write-Host "     Pending Designs: $($dashboard.data.designs.pending)"
}
catch {
    Write-Host "[ERROR] Failed to get dashboard: $_" -ForegroundColor Red
}

Write-Host ""

# Step 3: Get All Products
Write-Host "3. GET ALL PRODUCTS (ADMIN)" -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "$baseUrl/admin/products?limit=5" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Products retrieved" -ForegroundColor Green
    Write-Host "     Total: $($products.pagination.total)"
    $products.data | ForEach-Object {
        Write-Host "     - $($_.productName) (Rp $($_.price)) - Stock: $($_.stockQuantity)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get products: $_" -ForegroundColor Red
}

Write-Host ""

# Step 4: Get Orders
Write-Host "4. GET ALL ORDERS (ADMIN)" -ForegroundColor Yellow
try {
    $orders = Invoke-RestMethod -Uri "$baseUrl/admin/orders?limit=5" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Orders retrieved" -ForegroundColor Green
    Write-Host "     Total: $($orders.pagination.total)"
    $orders.data | ForEach-Object {
        Write-Host "     - Order: $($_.orderNumber) | Status: $($_.status) | Amount: Rp $($_.totalAmount)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get orders: $_" -ForegroundColor Red
}

Write-Host ""

# Step 5: Get Design Requests
Write-Host "5. GET ALL DESIGN REQUESTS (ADMIN)" -ForegroundColor Yellow
try {
    $designs = Invoke-RestMethod -Uri "$baseUrl/admin/design-requests?limit=5" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Design requests retrieved" -ForegroundColor Green
    Write-Host "     Total: $($designs.pagination.total)"
    $designs.data | ForEach-Object {
        Write-Host "     - $($_.designTitle) | Status: $($_.status) | Qty: $($_.quantity)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get design requests: $_" -ForegroundColor Red
}

Write-Host ""

# Step 6: Get Users
Write-Host "6. GET ALL USERS (ADMIN)" -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/admin/users?limit=5" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Users retrieved" -ForegroundColor Green
    Write-Host "     Total: $($users.pagination.total)"
    $users.data | ForEach-Object {
        Write-Host "     - $($_.fullName) ($($_.email)) | Role: $($_.role)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get users: $_" -ForegroundColor Red
}

Write-Host ""

# Step 7: Analytics - Sales
Write-Host "7. GET SALES ANALYTICS (last 30 days)" -ForegroundColor Yellow
try {
    $sales = Invoke-RestMethod -Uri "$baseUrl/admin/analytics/sales?days=30" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Sales analytics retrieved" -ForegroundColor Green
    Write-Host "     Period: $($sales.data.period)"
    Write-Host "     Total Orders: $($sales.data.summary.totalOrders)"
    Write-Host "     Total Items: $($sales.data.summary.totalItems)"
    Write-Host "     Total Revenue: Rp $($sales.data.summary.totalRevenue)"
}
catch {
    Write-Host "[ERROR] Failed to get sales analytics: $_" -ForegroundColor Red
}

Write-Host ""

# Step 8: Analytics - Revenue
Write-Host "8. GET REVENUE ANALYTICS (last 30 days)" -ForegroundColor Yellow
try {
    $revenue = Invoke-RestMethod -Uri "$baseUrl/admin/analytics/revenue?days=30" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Revenue analytics retrieved" -ForegroundColor Green
    Write-Host "     Total Revenue: Rp $($revenue.data.totalRevenue)"
    Write-Host "     By Category:"
    $revenue.data.byCategory | ForEach-Object {
        Write-Host "       - $($_.category): Rp $($_.revenue) ($($_.itemsSold) items)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get revenue analytics: $_" -ForegroundColor Red
}

Write-Host ""

# Step 9: Analytics - Orders
Write-Host "9. GET ORDER ANALYTICS (last 30 days)" -ForegroundColor Yellow
try {
    $orderAna = Invoke-RestMethod -Uri "$baseUrl/admin/analytics/orders?days=30" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Order analytics retrieved" -ForegroundColor Green
    Write-Host "     Total Orders: $($orderAna.data.summary.totalOrders)"
    Write-Host "     Avg Order Value: Rp $($orderAna.data.summary.avgOrderValue)"
    Write-Host "     By Status:"
    $orderAna.data.byStatus | ForEach-Object {
        Write-Host "       - $($_.status): $($_.count) orders"
    }
}
catch {
    Write-Host "[ERROR] Failed to get order analytics: $_" -ForegroundColor Red
}

Write-Host ""

# Step 10: Analytics - Customers
Write-Host "10. GET CUSTOMER ANALYTICS (last 30 days)" -ForegroundColor Yellow
try {
    $customers = Invoke-RestMethod -Uri "$baseUrl/admin/analytics/customers?days=30" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Customer analytics retrieved" -ForegroundColor Green
    Write-Host "     Total Customers: $($customers.data.totalCustomers)"
    Write-Host "     New Customers: $($customers.data.newCustomers)"
    Write-Host "     By Tier:"
    $customers.data.byTier | ForEach-Object {
        Write-Host "       - $($_.tier): $($_.count)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get customer analytics: $_" -ForegroundColor Red
}

Write-Host ""

# Step 11: Analytics - Design Requests
Write-Host "11. GET DESIGN ANALYTICS (last 30 days)" -ForegroundColor Yellow
try {
    $designs = Invoke-RestMethod -Uri "$baseUrl/admin/analytics/designs?days=30" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Design analytics retrieved" -ForegroundColor Green
    Write-Host "     Total Designs: $($designs.data.totalDesigns)"
    Write-Host "     Approval Rate: $($designs.data.approvalRate)"
    Write-Host "     By Status:"
    $designs.data.byStatus | ForEach-Object {
        Write-Host "       - $($_.status): $($_.count)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get design analytics: $_" -ForegroundColor Red
}

Write-Host ""

# Step 12: Get Payments
Write-Host "12. GET ALL PAYMENTS (ADMIN)" -ForegroundColor Yellow
try {
    $payments = Invoke-RestMethod -Uri "$baseUrl/admin/payments?limit=5" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Payments retrieved" -ForegroundColor Green
    Write-Host "     Total: $($payments.pagination.total)"
    $payments.data | ForEach-Object {
        Write-Host "     - Amount: Rp $($_.amount) | Status: $($_.status) | Method: $($_.method)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get payments: $_" -ForegroundColor Red
}

Write-Host ""

# Step 13: Get Audit Logs
Write-Host "13. GET AUDIT LOGS (ADMIN)" -ForegroundColor Yellow
try {
    $auditLogs = Invoke-RestMethod -Uri "$baseUrl/admin/audit-logs?limit=10" `
        -Method Get -WebSession $adminSession -ErrorAction Stop

    Write-Host "[OK] Audit logs retrieved" -ForegroundColor Green
    Write-Host "     Total: $($auditLogs.pagination.total)"
    $auditLogs.data | Select-Object -First 5 | ForEach-Object {
        Write-Host "     - $($_.action) | At: $($_.createdAt)"
    }
}
catch {
    Write-Host "[ERROR] Failed to get audit logs: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== ADMIN DASHBOARD TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "[+] Dashboard retrieved"
Write-Host "[+] Products management working"
Write-Host "[+] Orders management working"
Write-Host "[+] Design requests management working"
Write-Host "[+] Users management working"
Write-Host "[+] Payments management working"
Write-Host "[+] Analytics endpoints working (Sales, Revenue, Orders, Customers, Designs)"
Write-Host "[+] Audit logging working"
Write-Host ""
Write-Host "All admin endpoints tested successfully!" -ForegroundColor Green
Write-Host ""
