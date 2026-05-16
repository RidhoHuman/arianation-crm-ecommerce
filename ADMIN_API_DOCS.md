# Arianation Admin Dashboard API Documentation

## Overview
The Admin Dashboard API provides complete backend functionality for managing Arianation UMKM operations. All endpoints require **OWNER** or **ADMIN** role authentication and use JWT-based authorization.

**Base URL:** `http://localhost:3001/api`  
**Authentication:** JWT Token (in Authorization header or accessToken cookie)  
**Authorization:** OWNER or ADMIN role required for all endpoints

---

## Authentication & Authorization

### Required Headers
```
Authorization: Bearer <jwt_token>
Cookie: accessToken=<jwt_token>
Content-Type: application/json
```

### User Roles
- **OWNER**: Full access to all admin features (current solo founder)
- **ADMIN**: Full access to all admin features (prepared for future staff)
- **DESIGN_STAFF**: Design request feedback only (not admin dashboard access)
- **CUSTOMER**: No admin access (will receive 403 Forbidden)

### Example Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@arianation.com",
  "password": "Owner@123"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "owner@arianation.com",
      "role": "OWNER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Dashboard Endpoints

### GET /api/admin/dashboard
Retrieve comprehensive dashboard statistics and recent activity.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": {
      "today": 5,
      "month": 25,
      "total": 150
    },
    "revenue": {
      "total": 12500000,
      "currency": "IDR"
    },
    "customers": {
      "total": 42
    },
    "designs": {
      "pending": 3
    },
    "topProducts": [
      {
        "productId": "prod_1",
        "productName": "T-Shirt Premium",
        "count": 45,
        "revenue": 6750000
      }
    ],
    "recentOrders": [
      {
        "id": "order_1",
        "orderNumber": "ORD-2026-001",
        "totalAmount": 500000,
        "status": "CONFIRMED",
        "itemCount": 2,
        "createdAt": "2026-05-14T11:12:27.932Z"
      }
    ]
  },
  "message": "Dashboard data retrieved successfully"
}
```

---

## Product Management Endpoints

### GET /api/admin/products
List all products with optional filtering and search.

**Query Parameters:**
- `page` (default: 1) - Page number for pagination
- `limit` (default: 10) - Items per page
- `search` - Search by product name or description
- `categoryId` - Filter by category
- `businessType` - Filter by business type

**Example Request:**
```bash
GET /api/admin/products?page=1&limit=10&search=kaos
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_1",
      "categoryId": "cat_1",
      "productName": "T-Shirt Premium",
      "description": "Premium quality t-shirt",
      "price": 150000,
      "stockQuantity": 20,
      "productType": "CLOTHING",
      "businessType": "SABLON",
      "imageUrl": "http://localhost:3001/uploads/product-1.jpg",
      "isActive": true,
      "createdAt": "2026-05-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "message": "Products retrieved successfully"
}
```

### POST /api/admin/products
Create a new product.

**Request Body:**
```json
{
  "categoryId": "cat_1",
  "productName": "Premium Hoodie",
  "description": "Comfortable premium hoodie",
  "price": 250000,
  "stockQuantity": 50,
  "productType": "CLOTHING",
  "businessType": "SABLON",
  "imageUrl": "http://localhost:3001/uploads/product-new.jpg"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "prod_2",
    "categoryId": "cat_1",
    "productName": "Premium Hoodie",
    "price": 250000,
    "stockQuantity": 50,
    "productType": "CLOTHING",
    "businessType": "SABLON",
    "isActive": true,
    "createdAt": "2026-05-14T12:00:00.000Z"
  },
  "message": "Product created successfully"
}
```

### PUT /api/admin/products/:id
Update an existing product.

**Request Body:**
```json
{
  "productName": "Premium Hoodie Updated",
  "price": 275000,
  "stockQuantity": 40,
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "prod_2",
    "productName": "Premium Hoodie Updated",
    "price": 275000,
    "stockQuantity": 40,
    "isActive": true,
    "updatedAt": "2026-05-14T12:30:00.000Z"
  },
  "message": "Product updated successfully"
}
```

### DELETE /api/admin/products/:id
Delete a product.

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Product deleted successfully"
}
```

---

## Order Management Endpoints

### GET /api/admin/orders
List all orders with optional filtering.

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10) - Items per page
- `status` - Filter by order status (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- `search` - Search by order number
- `dateFrom` - Filter from date (ISO 8601)
- `dateTo` - Filter to date (ISO 8601)

**Example Request:**
```bash
GET /api/admin/orders?status=PENDING&dateFrom=2026-05-01&dateTo=2026-05-31
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "order_1",
      "orderNumber": "ORD-2026-001",
      "userId": "user_1",
      "totalAmount": 500000,
      "status": "PENDING",
      "paymentMethod": "BANK_TRANSFER",
      "items": [
        {
          "id": "item_1",
          "productName": "T-Shirt Premium",
          "quantity": 2,
          "price": 150000,
          "subtotal": 300000
        }
      ],
      "payment": {
        "id": "pay_1",
        "status": "PENDING",
        "amount": 500000
      },
      "createdAt": "2026-05-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "message": "Orders retrieved successfully"
}
```

### GET /api/admin/orders/:id
Get order detail.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "order_1",
    "orderNumber": "ORD-2026-001",
    "userId": "user_1",
    "totalAmount": 500000,
    "status": "CONFIRMED",
    "items": [
      {
        "id": "item_1",
        "product": {
          "id": "prod_1",
          "productName": "T-Shirt Premium",
          "price": 150000
        },
        "quantity": 2,
        "subtotal": 300000,
        "designRequest": {
          "id": "design_1",
          "designTitle": "Custom Design",
          "status": "APPROVED"
        }
      }
    ],
    "payment": {
      "id": "pay_1",
      "status": "COMPLETED",
      "method": "BANK_TRANSFER",
      "amount": 500000,
      "verifiedBy": "owner_id",
      "verifiedAt": "2026-05-14T10:30:00.000Z"
    },
    "tracking": {
      "id": "track_1",
      "status": "SHIPPED",
      "courierName": "JNE",
      "trackingNumber": "1234567890"
    },
    "designRequests": [
      {
        "id": "design_1",
        "designTitle": "Custom Design",
        "status": "APPROVED",
        "quantity": 100,
        "feedback": []
      }
    ],
    "createdAt": "2026-05-14T10:00:00.000Z"
  },
  "message": "Order detail retrieved successfully"
}
```

### PUT /api/admin/orders/:id/status
Update order status.

**Request Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Valid Statuses:** PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "order_1",
    "status": "CONFIRMED",
    "updatedAt": "2026-05-14T12:00:00.000Z"
  },
  "message": "Order status updated to CONFIRMED"
}
```

### PUT /api/admin/orders/:id/cancel
Cancel an order.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "order_1",
    "status": "CANCELLED",
    "updatedAt": "2026-05-14T12:15:00.000Z"
  },
  "message": "Order cancelled successfully"
}
```

### GET /api/admin/orders/export
Export all orders as CSV.

**Response:** CSV file download with columns: Order ID, Order Number, Total Amount, Status, Items, Created At

---

## Design Request Management Endpoints

### GET /api/admin/design-requests
List all design requests.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` - Filter by status (DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REVISION_REQUESTED, REJECTED, IN_PRODUCTION, COMPLETED)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "design_1",
      "userId": "user_1",
      "orderId": "order_1",
      "designTitle": "T-Shirt Custom Design",
      "designFileUrl": "http://localhost:3001/uploads/designs/design-1.pdf",
      "quantity": 100,
      "status": "SUBMITTED",
      "feedback": [],
      "order": {
        "orderNumber": "ORD-2026-001"
      },
      "createdAt": "2026-05-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2
  },
  "message": "Design requests retrieved successfully"
}
```

### GET /api/admin/design-requests/:id
Get design request detail.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "design_1",
    "userId": "user_1",
    "orderId": "order_1",
    "designTitle": "T-Shirt Custom Design",
    "designFileUrl": "http://localhost:3001/uploads/designs/design-1.pdf",
    "quantity": 100,
    "status": "UNDER_REVIEW",
    "feedback": [
      {
        "id": "feedback_1",
        "designStaffId": "staff_1",
        "feedbackText": "Design looks good, minor color adjustment needed",
        "feedbackType": "REVISION_NEEDED",
        "createdAt": "2026-05-14T11:00:00.000Z"
      }
    ],
    "order": {
      "id": "order_1",
      "orderNumber": "ORD-2026-001"
    },
    "orderItems": [
      {
        "id": "item_1",
        "productId": "prod_1",
        "quantity": 100,
        "price": 25000
      }
    ],
    "createdAt": "2026-05-14T10:00:00.000Z"
  },
  "message": "Design request detail retrieved successfully"
}
```

### PATCH /api/admin/design-requests/:id/status
Update design request status.

**Request Body:**
```json
{
  "status": "IN_PRODUCTION"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "design_1",
    "status": "IN_PRODUCTION",
    "updatedAt": "2026-05-14T12:30:00.000Z"
  },
  "message": "Design request status updated to IN_PRODUCTION"
}
```

---

## User Management Endpoints

### GET /api/admin/users
List all users.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `role` - Filter by role (CUSTOMER, ADMIN, DESIGN_STAFF, OWNER)
- `search` - Search by email

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_1",
      "email": "owner@arianation.com",
      "fullName": "Owner Arianation",
      "role": "OWNER",
      "isActive": true,
      "createdAt": "2026-05-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  },
  "message": "Users retrieved successfully"
}
```

### GET /api/admin/users/:id
Get user detail.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_1",
    "email": "owner@arianation.com",
    "fullName": "Owner Arianation",
    "role": "OWNER",
    "isActive": true,
    "customerProfile": null,
    "designStaffInfo": null,
    "createdAt": "2026-05-01T00:00:00.000Z"
  },
  "message": "User detail retrieved successfully"
}
```

### PUT /api/admin/users/:id/role
Update user role.

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

**Valid Roles:** CUSTOMER, ADMIN, DESIGN_STAFF, OWNER

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_2",
    "email": "staff@arianation.com",
    "fullName": "Design Staff",
    "role": "ADMIN"
  },
  "message": "User role updated to ADMIN"
}
```

### PUT /api/admin/users/:id/status
Toggle user active status.

**Request Body:**
```json
{
  "isActive": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_2",
    "email": "staff@arianation.com",
    "fullName": "Design Staff",
    "isActive": false
  },
  "message": "User status changed to inactive"
}
```

---

## Payment Management Endpoints

### GET /api/admin/payments
List all payments.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` - Filter by status (PENDING, COMPLETED, FAILED, EXPIRED)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pay_1",
      "orderId": "order_1",
      "amount": 500000,
      "status": "COMPLETED",
      "method": "BANK_TRANSFER",
      "transactionId": "TXN-2026-001",
      "verifiedBy": "owner_id",
      "verifiedAt": "2026-05-14T10:30:00.000Z",
      "order": {
        "orderNumber": "ORD-2026-001",
        "totalAmount": 500000
      },
      "createdAt": "2026-05-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 30,
    "totalPages": 3
  },
  "message": "Payments retrieved successfully"
}
```

### PUT /api/admin/payments/:id/verify
Verify payment and mark as completed.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pay_1",
    "status": "COMPLETED",
    "verifiedBy": "owner_id",
    "verifiedAt": "2026-05-14T12:00:00.000Z"
  },
  "message": "Payment verified successfully"
}
```

### POST /api/admin/payments/:id/refund
Process refund for a payment.

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pay_1",
    "status": "FAILED",
    "notes": "Customer requested cancellation"
  },
  "message": "Refund processed successfully"
}
```

---

## Analytics Endpoints

### GET /api/admin/analytics/sales
Get sales analytics for the specified period.

**Query Parameters:**
- `days` (default: 30) - Number of days to analyze

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "data": [
      {
        "date": "2026-05-01",
        "orders": 5,
        "items": 15,
        "revenue": 750000
      },
      {
        "date": "2026-05-02",
        "orders": 3,
        "items": 8,
        "revenue": 450000
      }
    ],
    "summary": {
      "totalOrders": 50,
      "totalItems": 120,
      "totalRevenue": 12500000
    }
  },
  "message": "Sales analytics retrieved successfully"
}
```

### GET /api/admin/analytics/revenue
Get revenue analytics by category and payment method.

**Query Parameters:**
- `days` (default: 30)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "totalRevenue": 12500000,
    "byCategory": [
      {
        "category": "T-Shirts",
        "productId": "prod_1",
        "productName": "T-Shirt Premium",
        "revenue": 6750000,
        "itemsSold": 45
      }
    ],
    "byPaymentMethod": [
      {
        "method": "BANK_TRANSFER",
        "revenue": 10000000,
        "transactions": 40
      }
    ]
  },
  "message": "Revenue analytics retrieved successfully"
}
```

### GET /api/admin/analytics/orders
Get order analytics and status distribution.

**Query Parameters:**
- `days` (default: 30)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "byStatus": [
      {
        "status": "DELIVERED",
        "count": 30,
        "revenue": 8500000
      },
      {
        "status": "PENDING",
        "count": 5,
        "revenue": 1250000
      }
    ],
    "byDate": [
      {
        "date": "2026-05-01",
        "count": 5,
        "revenue": 750000
      }
    ],
    "summary": {
      "totalOrders": 50,
      "avgOrderValue": 250000
    }
  },
  "message": "Order analytics retrieved successfully"
}
```

### GET /api/admin/analytics/customers
Get customer acquisition and tier analytics.

**Query Parameters:**
- `days` (default: 30)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "totalCustomers": 150,
    "newCustomers": 25,
    "byTier": [
      {
        "tier": "GOLD",
        "count": 5
      },
      {
        "tier": "SILVER",
        "count": 15
      }
    ],
    "topCustomers": [
      {
        "userId": "user_5",
        "email": "loyal@customer.com",
        "name": "Loyal Customer",
        "totalSpent": 5000000,
        "orderCount": 10
      }
    ]
  },
  "message": "Customer analytics retrieved successfully"
}
```

### GET /api/admin/analytics/designs
Get design request statistics.

**Query Parameters:**
- `days` (default: 30)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "totalDesigns": 50,
    "approvalRate": "80%",
    "byStatus": [
      {
        "status": "APPROVED",
        "count": 40
      },
      {
        "status": "SUBMITTED",
        "count": 8
      }
    ],
    "byProductType": [
      {
        "type": "T-SHIRT",
        "count": 30
      },
      {
        "type": "HOODIE",
        "count": 20
      }
    ],
    "byDate": [
      {
        "date": "2026-05-01",
        "submitted": 5,
        "approved": 4,
        "rejected": 1
      }
    ]
  },
  "message": "Design analytics retrieved successfully"
}
```

---

## Audit Logs Endpoint

### GET /api/admin/audit-logs
Retrieve audit logs of all admin actions.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `action` - Filter by action type
- `userId` - Filter by user who performed action

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "log_1",
      "userId": "owner_id",
      "orderId": "order_1",
      "action": "ORDER_STATUS_UPDATED_TO_CONFIRMED",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-05-14T12:00:00.000Z"
    },
    {
      "id": "log_2",
      "userId": "owner_id",
      "action": "PRODUCT_CREATED",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-05-14T11:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13
  },
  "message": "Audit logs retrieved successfully"
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token",
  "status": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "status": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "status": 404
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error: Missing required fields",
  "status": 400
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "status": 500
}
```

---

## Testing

### Login as Admin
```powershell
$adminLogin = @{
    email    = "owner@arianation.com"
    password = "Owner@123"
} | ConvertTo-Json

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method Post -ContentType "application/json" `
    -Body $adminLogin -WebSession $session

echo $response
```

### Test Dashboard
```powershell
$dashboard = Invoke-RestMethod -Uri "http://localhost:3001/api/admin/dashboard" `
    -Method Get -WebSession $session

echo $dashboard | ConvertTo-Json
```

### Run Full Test Suite
```powershell
cd d:\projects\arianation-crm-ecommerce
powershell -ExecutionPolicy Bypass -File test-admin-api.ps1
```

---

## Rate Limiting

All admin endpoints are rate-limited to **100 requests per 15 minutes** to prevent abuse.

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1526310000
```

---

## Deployment

### Frontend Integration
Admin dashboard frontend (Next.js) will consume these APIs:
- Dashboard: GET /api/admin/dashboard
- Products: GET/POST/PUT/DELETE /api/admin/products
- Orders: GET/PUT /api/admin/orders
- Analytics: GET /api/admin/analytics/*
- Users: GET/PUT /api/admin/users
- Payments: GET/PUT /api/admin/payments
- Audit: GET /api/admin/audit-logs

### Production Deployment
- Backend: Railway/Render with OWNER/ADMIN restricted access
- Database: PostgreSQL with connection pooling
- Rate limiting: 100 req/15 min (configurable)
- Audit logging: All operations logged automatically

---

## Support & Troubleshooting

### Issue: 403 Forbidden on all endpoints
**Solution:** Ensure user has OWNER or ADMIN role. Check role with GET /api/users/me

### Issue: Dashboard shows 0 data
**Solution:** Ensure there are actual orders in the system. Check GET /api/admin/orders

### Issue: Analytics show no data for period
**Solution:** Analytics filters by order status (CONFIRMED/DELIVERED). Ensure orders have been confirmed.

### Issue: Rate limit exceeded
**Solution:** Wait 15 minutes for the window to reset or contact backend admin.

---

**Last Updated:** 2026-05-14  
**Version:** 1.0  
**Status:** Production Ready ✅
