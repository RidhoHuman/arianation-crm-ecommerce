# Arianation CRM E-Commerce API Documentation

**Version**: 1.0.0  
**Base URL**: `http://localhost:3001/api` (Development)  
**Last Updated**: May 16, 2026

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Products](#products)
4. [Cart](#cart)
5. [Orders](#orders)
6. [Order Fulfillment](#order-fulfillment)
7. [Payments](#payments)
8. [Admin Management](#admin-management)
9. [Design Requests](#design-requests)
10. [Webhooks](#webhooks)
11. [Error Handling](#error-handling)

---

## Authentication

All protected endpoints require an `Authorization` header with a valid JWT token or HttpOnly cookie.

### Register
**POST** `/auth/register`

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "phone": "+62812345678",
  "role": "CUSTOMER"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "cuid123...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "CUSTOMER"
  }
}
```

### Login
**POST** `/auth/login`

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "cuid123...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "CUSTOMER"
  },
  "accessToken": "eyJhbGc..."
}
```

### Refresh Token
**POST** `/auth/refresh`

**Response** (200):
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "user": { ... }
}
```

### Get Current User
**GET** `/auth/me`

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "success": true,
  "user": { ... }
}
```

---

## Users

### Get User Profile
**GET** `/users/:id`

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "cuid123...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+62812345678",
    "role": "CUSTOMER",
    "customerProfile": {
      "address": "Jl. Merdeka No. 1",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postalCode": "12000"
    }
  }
}
```

### Update User Profile
**PUT** `/users/:id`

```json
{
  "fullName": "John Doe Updated",
  "phone": "+62812345679",
  "address": "Jl. Merdeka No. 2",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12001"
}
```

**Response** (200): Updated user object

---

## Products

### List All Products
**GET** `/products?page=1&limit=10&businessType=FASHION_RETAIL`

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)
- `businessType` (optional): `FASHION_RETAIL` | `SABLON_SERVICE`
- `category` (optional): Category ID
- `search` (optional): Product name search

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid123...",
      "productName": "Kaos Premium",
      "description": "High quality t-shirt",
      "price": 75000,
      "stockQuantity": 100,
      "productType": "KAOS",
      "businessType": "FASHION_RETAIL",
      "imageUrl": "https://...",
      "category": { ... },
      "variants": [ ... ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

### Get Product Details
**GET** `/products/:id`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "cuid123...",
    "productName": "Kaos Premium",
    "price": 75000,
    "stockQuantity": 100,
    "variants": [
      {
        "id": "var123...",
        "variantName": "SIZE",
        "sku": "KAOS-PREM-M",
        "additionalPrice": 5000,
        "stockQuantity": 50
      }
    ],
    "category": { ... }
  }
}
```

### Create Product (Admin)
**POST** `/admin/products`

**Headers**: `Authorization: Bearer {adminToken}`

```json
{
  "productName": "Kaos Premium",
  "description": "High quality t-shirt",
  "price": 75000,
  "stockQuantity": 100,
  "productType": "KAOS",
  "businessType": "FASHION_RETAIL",
  "categoryId": "cat123...",
  "imageUrl": "https://..."
}
```

---

## Cart

### Get Cart
**GET** `/cart`

**Response** (200):
```json
{
  "success": true,
  "cart": {
    "id": "cart123...",
    "userId": "user123...",
    "items": [
      {
        "id": "item123...",
        "product": { ... },
        "variant": { ... },
        "quantity": 2,
        "unitPrice": 75000,
        "subtotal": 150000
      }
    ],
    "totalItems": 2,
    "totalAmount": 150000
  }
}
```

### Add to Cart
**POST** `/cart/add`

```json
{
  "productId": "prod123...",
  "variantId": "var123...",
  "quantity": 2
}
```

**Response** (200): Updated cart

### Update Cart Item
**PUT** `/cart/items/:itemId`

```json
{
  "quantity": 5
}
```

### Remove from Cart
**DELETE** `/cart/items/:itemId`

---

## Orders

### Create Order (Checkout)
**POST** `/orders`

```json
{
  "items": [
    {
      "productId": "prod123...",
      "variantId": "var123...",
      "quantity": 2
    }
  ],
  "paymentMethod": "BANK_TRANSFER",
  "deliveryAddress": "Jl. Merdeka No. 1",
  "notes": "Please ring doorbell twice"
}
```

**Response** (201):
```json
{
  "success": true,
  "order": {
    "id": "ord123...",
    "orderNumber": "ORD-20260516-001",
    "userId": "user123...",
    "status": "PENDING",
    "totalAmount": 150000,
    "paymentMethod": "BANK_TRANSFER",
    "items": [ ... ],
    "payment": {
      "id": "pay123...",
      "status": "PENDING",
      "method": "BANK_TRANSFER",
      "transactionId": "TXN123..."
    }
  }
}
```

### Get Orders (Customer)
**GET** `/orders?page=1&limit=10&status=PENDING`

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)
- `status` (optional): `PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED`

**Response** (200): Array of orders with pagination

### Get Order Details
**GET** `/orders/:id`

**Response** (200):
```json
{
  "success": true,
  "order": {
    "id": "ord123...",
    "orderNumber": "ORD-20260516-001",
    "status": "PROCESSING",
    "totalAmount": 150000,
    "items": [ ... ],
    "payment": { ... },
    "tracking": { ... }
  }
}
```

### Cancel Order
**POST** `/orders/:id/cancel`

```json
{
  "reason": "Change my mind"
}
```

---

## Order Fulfillment

### Get Order Status History
**GET** `/orders/:id/status-history`

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "hist123...",
      "orderId": "ord123...",
      "previousStatus": "PENDING",
      "newStatus": "CONFIRMED",
      "reason": "Payment received",
      "updatedBy": "admin123...",
      "createdAt": "2026-05-16T10:30:00Z"
    }
  ]
}
```

### Get Order Timeline
**GET** `/orders/:id/timeline`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "orderId": "ord123...",
    "currentStatus": "PROCESSING",
    "timeline": [
      {
        "type": "STATUS_CHANGE",
        "status": "PROCESSING",
        "timestamp": "2026-05-16T10:45:00Z",
        "details": { ... }
      },
      {
        "type": "TRACKING_UPDATE",
        "status": "SHIPPED",
        "timestamp": "2026-05-16T14:20:00Z",
        "details": { ... }
      }
    ],
    "trackingInfo": { ... }
  }
}
```

### Get Order Notifications
**GET** `/orders/:id/notifications`

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "notif123...",
      "type": "CONFIRMED",
      "title": "Order Confirmed! 🎉",
      "message": "Your order has been confirmed",
      "emailSent": true,
      "sentAt": "2026-05-16T10:30:00Z",
      "createdAt": "2026-05-16T10:30:00Z"
    }
  ]
}
```

### Update Order Tracking (Admin)
**PUT** `/admin/orders/:id/tracking`

```json
{
  "trackingNumber": "JNE123456789",
  "carrier": "JNE",
  "currentLocation": "Jakarta Distribution Center",
  "estimatedDeliveryDate": "2026-05-18",
  "status": "SHIPPED",
  "notes": "Package on the way"
}
```

**Response** (200):
```json
{
  "success": true,
  "tracking": {
    "id": "track123...",
    "orderId": "ord123...",
    "trackingNumber": "JNE123456789",
    "carrier": "JNE",
    "status": "SHIPPED",
    "currentLocation": "Jakarta Distribution Center",
    "lastUpdate": "2026-05-16T14:20:00Z",
    "history": [ ... ]
  }
}
```

---

## Payments

### Create Payment (Xendit/Manual)
**POST** `/payments`

```json
{
  "orderId": "ord123...",
  "method": "BANK_TRANSFER",
  "amount": 150000
}
```

**Response** (201):
```json
{
  "success": true,
  "payment": {
    "id": "pay123...",
    "orderId": "ord123...",
    "status": "PENDING",
    "method": "BANK_TRANSFER",
    "amount": 150000,
    "transactionId": "TXN123...",
    "bankAccount": "1234567890",
    "bankName": "BCA",
    "accountName": "PT Arianation"
  }
}
```

### Verify Payment (Admin)
**POST** `/admin/payments/:id/verify`

```json
{
  "verifiedBy": "admin123...",
  "notes": "Manual verification"
}
```

---

## Admin Management

### Get All Orders (Admin)
**GET** `/admin/orders?page=1&limit=20&status=PENDING`

**Headers**: `Authorization: Bearer {adminToken}` with `OWNER` or `ADMIN` role

**Response** (200):
```json
{
  "success": true,
  "orders": [ ... ],
  "pagination": { ... }
}
```

### Get Order Detail (Admin)
**GET** `/admin/orders/:id`

**Response** (200):
```json
{
  "success": true,
  "order": {
    "id": "ord123...",
    "orderNumber": "ORD-20260516-001",
    "customer": { ... },
    "items": [ ... ],
    "payment": { ... },
    "tracking": { ... },
    "statusHistory": [ ... ],
    "notifications": [ ... ]
  }
}
```

### Update Order Status (Admin)
**PUT** `/admin/orders/:id/status`

```json
{
  "newStatus": "CONFIRMED",
  "reason": "Payment verified",
  "notes": "Processing now"
}
```

**Response** (200):
```json
{
  "success": true,
  "order": {
    "id": "ord123...",
    "status": "CONFIRMED",
    "statusHistory": [ ... ]
  }
}
```

### Export Orders
**GET** `/admin/orders/export?format=csv&startDate=2026-05-01&endDate=2026-05-31`

**Response**: CSV file download

### Get Analytics Dashboard
**GET** `/admin/analytics/dashboard`

**Response** (200):
```json
{
  "success": true,
  "analytics": {
    "totalOrders": 250,
    "totalRevenue": 18750000,
    "totalCustomers": 120,
    "averageOrderValue": 75000,
    "ordersByStatus": {
      "PENDING": 10,
      "CONFIRMED": 50,
      "PROCESSING": 120,
      "SHIPPED": 60,
      "DELIVERED": 10
    }
  }
}
```

### Get Audit Logs
**GET** `/admin/audit-logs?page=1&limit=50`

**Response** (200):
```json
{
  "success": true,
  "logs": [
    {
      "id": "log123...",
      "userId": "admin123...",
      "action": "ORDER_STATUS_UPDATED",
      "targetId": "ord123...",
      "details": { ... },
      "createdAt": "2026-05-16T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## Design Requests

### Create Design Request
**POST** `/design-requests`

```json
{
  "designTitle": "Custom T-shirt Design",
  "designDescription": "Navy blue with white print",
  "referenceImageUrl": "https://...",
  "designFileUrl": "https://...",
  "fileType": "PNG",
  "quantity": 50,
  "productTypeForSablon": "KAOS",
  "colorPreferences": "Navy, White",
  "deadline": "2026-05-25"
}
```

**Response** (201):
```json
{
  "success": true,
  "designRequest": {
    "id": "design123...",
    "userId": "user123...",
    "status": "DRAFT",
    "designTitle": "Custom T-shirt Design"
  }
}
```

### Get Design Requests
**GET** `/design-requests?status=SUBMITTED&page=1`

**Response** (200): Array of design requests

### Submit Design for Review
**PUT** `/design-requests/:id/submit`

**Response** (200):
```json
{
  "success": true,
  "designRequest": {
    "id": "design123...",
    "status": "SUBMITTED",
    "submittedAt": "2026-05-16T10:30:00Z"
  }
}
```

### Add Design Feedback (Design Staff)
**POST** `/design-requests/:id/feedback`

```json
{
  "feedbackText": "Please adjust the color to match",
  "feedbackType": "REVISION_NEEDED",
  "revisionNotes": "Change navy to sky blue",
  "suggestedChangesUrl": "https://..."
}
```

---

## Webhooks

### Courier Webhook
**POST** `/webhooks/courier`

**Headers**: 
- `x-webhook-token: {XENDIT_WEBHOOK_VERIFY_TOKEN}`

**Body**:
```json
{
  "orderId": "ord123...",
  "status": "SHIPPED",
  "trackingNumber": "JNE123456789",
  "carrier": "JNE",
  "currentLocation": "Jakarta",
  "estimatedDeliveryDate": "2026-05-18"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Invalid/missing token |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `BAD_REQUEST` | Invalid request |
| `CONFLICT` | Resource already exists |

---

## Rate Limiting

All endpoints are rate-limited:
- **Public endpoints**: 100 requests per 15 minutes per IP
- **Protected endpoints**: 300 requests per 15 minutes per user

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1684226400
```

---

## Authentication Methods

### JWT Token (Bearer)
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:3001/api/orders
```

### HttpOnly Cookie
Token automatically sent in cookies for browser requests.

---

## Environment Variables

```env
DATABASE_URL=mysql://root:password@localhost:3306/arianation_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=3001

# SMTP (Optional - for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@arianation.com

# Webhook
XENDIT_WEBHOOK_VERIFY_TOKEN=webhook_secret_token
```

---

**Last Updated**: May 16, 2026
**Maintained By**: Development Team
