# Design Request API Documentation

## Fitur Design Request untuk Arianation UMKM (Sablon & Fashion)

Sistem Design Request memungkinkan pelanggan Arianation untuk submit request desain custom untuk produk sablon dan fashion mereka dengan file upload, feedback management, dan status tracking.

---

## Endpoints

### 1. List Design Requests
**GET** `/api/design-requests`

List semua design requests milik user (customers lihat sendiri, admin lihat semua)

**Query Parameters:**
- `page` (int): Halaman (default: 1)
- `limit` (int): Items per page (default: 10)
- `status` (string): Filter status (DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, IN_PRODUCTION, COMPLETED)

**Response Example:**
```json
{
  "success": true,
  "message": "Design requests retrieved successfully",
  "data": [
    {
      "id": "cmoyg03xj0001va0sn6h8nd02",
      "userId": "cmoye0...",
      "designTitle": "Custom T-Shirt Design",
      "designDescription": "Minimalis design untuk kaos sablon",
      "designFileUrl": "https://example.com/design.jpg",
      "fileType": "JPG",
      "quantity": 50,
      "productTypeForSablon": "KAOS",
      "colorPreferences": "Black, White",
      "status": "SUBMITTED",
      "submittedAt": "2026-05-09T14:31:55.000Z",
      "deadline": "2026-05-16T00:00:00.000Z",
      "feedback": [],
      "order": null,
      "createdAt": "2026-05-09T14:31:54.867Z",
      "updatedAt": "2026-05-09T14:31:54.867Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 2. Create Design Request
**POST** `/api/design-requests`

Create design request baru dengan optional file upload

**Request Body (JSON):**
```json
{
  "designTitle": "Custom Kaos Design",
  "designDescription": "Minimalis design untuk kaos sablon",
  "referenceImageUrl": "https://example.com/design.jpg",
  "quantity": 50,
  "productTypeForSablon": "KAOS",
  "colorPreferences": "Black, White",
  "deadline": "2026-05-16T00:00:00.000Z",
  "orderId": null
}
```

**File Upload (Multipart Form):**
- `designFile` (file): Upload design file (PNG, JPG, PDF, AI, CDR, SVG - max 50MB)

**Required Fields:**
- `designTitle`: Nama/judul design
- `quantity`: Jumlah item untuk di-sablon

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmoyg03xj0001va0sn6h8nd02",
    "userId": "cmoye0x...",
    "designTitle": "Custom Kaos Design",
    "status": "SUBMITTED",
    "designFileUrl": "/uploads/designFile-...",
    "fileType": "JPG",
    "quantity": 50,
    "submittedAt": "2026-05-09T14:31:54.867Z"
  },
  "message": "Design request created successfully"
}
```

---

### 3. Get Design Request Detail
**GET** `/api/design-requests/:id`

Ambil detail design request spesifik termasuk semua feedback

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmoyg03xj0001va0sn6h8nd02",
    "designTitle": "Custom Kaos Design",
    "quantity": 50,
    "status": "SUBMITTED",
    "feedback": [],
    "orderItems": []
  },
  "message": "Design request retrieved successfully"
}
```

---

### 4. Update Design Request
**PUT/PATCH** `/api/design-requests/:id`

Update field design request (hanya bisa sebelum SUBMITTED)

**Request Body:**
```json
{
  "designTitle": "Updated Title",
  "quantity": 75,
  "colorPreferences": "Red, Blue"
}
```

---

### 5. Submit Design Request  
**PUT** `/api/design-requests/:id/submit`

Ubah status dari DRAFT ke SUBMITTED

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmoyg03xj0001va0sn6h8nd02",
    "status": "SUBMITTED",
    "submittedAt": "2026-05-09T14:31:54.867Z"
  },
  "message": "Design request submitted successfully"
}
```

---

### 6. Add Feedback (DESIGN_STAFF/ADMIN)
**POST** `/api/design-requests/:id/feedback`

Design staff menambahkan feedback ke design request

**Request Body:**
```json
{
  "feedbackText": "Design looks good! Minor adjustments needed on color scheme.",
  "feedbackType": "REVISION_NEEDED",
  "revisionNotes": "Please adjust red color to be darker (RGB: 200,0,0)",
  "suggestedChangesUrl": "https://example.com/suggestions.jpg"
}
```

**Feedback Types:**
- `APPROVED`: Design approved untuk production
- `REVISION_NEEDED`: Perlu revisi
- `REJECTED`: Design ditolak

**Status Update Otomatis:**
- `APPROVED` → Status berubah ke `APPROVED`
- `REVISION_NEEDED` → Status berubah ke `REVISION_REQUESTED`
- `REJECTED` → Status berubah ke `REJECTED`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "feedback_id",
    "designRequestId": "cmoyg03xj0001va0sn6h8nd02",
    "designStaffId": "admin_user_id",
    "feedbackText": "Design looks good!...",
    "feedbackType": "REVISION_NEEDED",
    "revisionNotes": "Please adjust red color..."
  },
  "message": "Feedback added successfully"
}
```

---

### 7. Delete Design Request
**DELETE** `/api/design-requests/:id`

Hapus design request (hanya DRAFT atau REJECTED yang bisa dihapus)

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Design request deleted successfully"
}
```

---

## Design Status Flow

```
DRAFT
  ↓
SUBMITTED → UNDER_REVIEW
  ↓ (feedback)
REVISION_REQUESTED → APPROVED (after revision approved)
  ↓
IN_PRODUCTION
  ↓
COMPLETED

(atau) REJECTED (at any point)
```

---

## File Upload Support

**Accepted File Types:**
- PNG, JPG, JPEG, PDF (design files)
- AI, CDR (design software files)
- SVG (vector format)

**Storage:**
- Files stored in: `public/uploads/`
- URL accessible at: `/uploads/designFile-{timestamp}-{random}.{ext}`
- Max size: 50MB per file

---

## Authentication & Authorization

**Required Roles:**
- `CUSTOMER`: Create own requests, view own requests
- `DESIGN_STAFF`: View all requests, add feedback, update status
- `ADMIN`: Full access to all operations

**Cookie/Header Auth:**
- Cookies: `accessToken` set automatically on login
- Header: `Authorization: Bearer {token}` 

---

## Testing Design Request API

### PowerShell Test:
```powershell
cd d:\projects\arianation-crm-ecommerce
powershell -ExecutionPolicy Bypass -File test-design-api.ps1
```

### cURL Test:
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' \
  -c cookies.txt

# Create design request
curl -X POST http://localhost:3001/api/design-requests \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "designTitle": "My Design",
    "quantity": 50,
    "productTypeForSablon": "KAOS",
    "referenceImageUrl": "https://example.com/design.jpg"
  }'

# List design requests
curl -X GET http://localhost:3001/api/design-requests \
  -b cookies.txt

# Get detail
curl -X GET http://localhost:3001/api/design-requests/{id} \
  -b cookies.txt
```

---

## Database Schema

### DesignRequest Model:
```prisma
model DesignRequest {
  id                  String    @id @default(cuid())
  orderId             String?   // Link ke order (optional)
  userId              String    // Pelanggan yang request
  
  designTitle         String    // Judul design
  designDescription   String?   // Deskripsi lengkap
  referenceImageUrl   String?   // URL ke reference image
  designFileUrl       String    // URL ke file uploaded/stored
  fileType            String    // PNG, JPG, PDF, AI, CDR
  
  quantity            Int       // Jumlah item
  productTypeForSablon String?  // KAOS, ATRIBUT, dll
  colorPreferences    String?   // Preferensi warna
  
  status              DesignStatus @default(DRAFT)
  submittedAt         DateTime?
  deadline            DateTime?
  
  feedback            DesignFeedback[]
  orderItems          OrderItem[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model DesignFeedback {
  id                  String    @id @default(cuid())
  designRequestId     String
  designRequest       DesignRequest @relation(...)
  
  designStaffId       String    // Staff yang beri feedback
  feedbackText        String    // Komentar feedback
  feedbackType        String    // APPROVED, REVISION_NEEDED, REJECTED
  revisionNotes       String?   // Catatan revisi
  suggestedChangesUrl String?   // Link ke suggested changes
  
  createdAt           DateTime  @default(now())
}
```

---

## Workflow Example

1. **Customer membuat design request:**
   - POST /api/design-requests dengan design title, quantity, reference image
   - Status: SUBMITTED (langsung)
   - File disimpan di /uploads/ jika di-upload

2. **Design staff review:**
   - GET /api/design-requests (lihat semua pending)
   - GET /api/design-requests/{id} (detail dengan feedback history)

3. **Design staff memberikan feedback:**
   - POST /api/design-requests/{id}/feedback
   - Jika REVISION_NEEDED → status auto jadi REVISION_REQUESTED
   - Jika APPROVED → status auto jadi APPROVED

4. **Customer lihat feedback:**
   - GET /api/design-requests/{id} (lihat feedback terbaru)
   - Update design dan resubmit (PUT /:id untuk update)

5. **Proses lanjutan:**
   - IN_PRODUCTION (saat design approved & mulai sablon)
   - COMPLETED (selesai)
   - Atau REJECTED jika tidak sesuai

---

## Error Handling

**Common Errors:**

| Code | Message | Cause |
|------|---------|-------|
| 400 | "designTitle and quantity are required" | Missing required fields |
| 404 | "Design request not found" | ID tidak valid |
| 401 | "Unauthorized" | Not authenticated |
| 403 | "Forbidden" / "Unauthorized to view" | Insufficient permissions |
| 413 | "File too large" | File > 50MB |
| 415 | "File type not allowed" | Unsupported file extension |

---

## Features

✅ Design request CRUD (Create, Read, Update, Delete)
✅ File upload support (multer middleware)
✅ Feedback system untuk design staff
✅ Status tracking & automation
✅ Order linkage (design bisa di-link ke order)
✅ Audit logging (log semua aksi)
✅ Role-based access control (customer, staff, admin)
✅ Deadline tracking
✅ Color preferences & product type custom untuk UMKM sablon
✅ Soft delete ready (dengan REJECTED/ARCHIVED status)

---

## Next Steps

- [ ] Frontend dashboard untuk customer view design requests & feedback
- [ ] Frontend form untuk upload design dengan drag-drop
- [ ] Email notification saat ada feedback baru
- [ ] Admin dashboard untuk manage semua design requests
- [ ] Payment integration (design request bisa jadi orderItem dengan biaya)
- [ ] Design gallery / showcase untuk user lihat previous designs
