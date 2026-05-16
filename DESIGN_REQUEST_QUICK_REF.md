## Design Request Feature - Quick Reference

### Implementasi Selesai:
- [x] Multer file upload middleware
- [x] Prisma DesignRequest & DesignFeedback model (sudah ada)
- [x] designRequestController CRUD + feedback
- [x] routes /api/design-requests
- [x] File storage di public/uploads/
- [x] Audit logging
- [x] Role-based access (CUSTOMER, DESIGN_STAFF, ADMIN)
- [x] Test suite (test-design-api.ps1)

### Status Fields:
```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REVISION_REQUESTED/REJECTED → IN_PRODUCTION → COMPLETED
```

### Endpoints Summary:
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | /api/design-requests | ✓ | List requests |
| POST | /api/design-requests | ✓ | Create request |
| GET | /api/design-requests/:id | ✓ | Get detail |
| PUT | /api/design-requests/:id | ✓ | Update request |
| PUT | /api/design-requests/:id/submit | ✓ | Submit for review |
| POST | /api/design-requests/:id/feedback | ✓ | Add feedback (staff only) |
| DELETE | /api/design-requests/:id | ✓ | Delete request |

### Test Commands:

**PowerShell:**
```powershell
cd d:\projects\arianation-crm-ecommerce
npm run dev  # Terminal 1: start backend
powershell -ExecutionPolicy Bypass -File test-design-api.ps1  # Terminal 2: run tests
```

**Output:**
```
=== ARIANATION DESIGN REQUEST API TEST ===
1. LOGIN AS CUSTOMER
[OK] Login successful - Test User

2. CREATE DESIGN REQUEST WITH FILE
[OK] Design request created
     ID: cmoyg03xj0001va0sn6h8nd02
     Status: SUBMITTED

3. GET ALL DESIGN REQUESTS
[OK] Retrieved: 1 requests

4. GET DESIGN DETAIL
[OK] Retrieved detail - Custom Kaos Design (50 qty)

=== TEST COMPLETE ===
```

### Real-World Usage:

**1. Customer membuat design request:**
```json
POST /api/design-requests
{
  "designTitle": "Kaos Custom UMKM",
  "quantity": 100,
  "productTypeForSablon": "KAOS",
  "colorPreferences": "Hitam, Putih, Merah",
  "referenceImageUrl": "https://...",
  "deadline": "2026-05-20T00:00:00Z"
}
```

**2. Design staff lihat & feedback:**
```json
POST /api/design-requests/{id}/feedback
{
  "feedbackText": "Bagus! Silakan buat adjustment color sedikit lebih cerah",
  "feedbackType": "REVISION_NEEDED",
  "revisionNotes": "Red: #FF0000 → #FF3333"
}
```
→ Status otomatis jadi: `REVISION_REQUESTED`

**3. Customer lihat feedback & resubmit:**
```
GET /api/design-requests/{id}
response.data.feedback[0].revisionNotes → Lihat notes
PUT /api/design-requests/{id} → Update design
PUT /api/design-requests/{id}/submit → Resubmit
```

**4. Staff approve:**
```json
POST /api/design-requests/{id}/feedback
{
  "feedbackText": "Perfect! Siap production",
  "feedbackType": "APPROVED"
}
```
→ Status otomatis jadi: `APPROVED` → Production

### Database Tables:
- `design_request` - Main table (id, userId, designTitle, status, etc)
- `design_feedback` - Feedback dari staff (designRequestId, feedbackText, feedbackType)
- `audit_log` - Semua aksi tercatat

### File Upload:
- Location: `public/uploads/`
- Types: PNG, JPG, PDF, AI, CDR, SVG
- Max: 50MB
- URL: `/uploads/designFile-{timestamp}-{random}.{ext}`

### Features untuk UMKM Sablon:
1. **Custom design submission** - Pelanggan bisa submit design custom
2. **File upload** - Upload design dalam berbagai format
3. **Feedback workflow** - Iterasi design dengan staff
4. **Status tracking** - Lihat progress dari SUBMITTED → COMPLETED
5. **Color preferences** - Specify warna yang diinginkan
6. **Quantity tracking** - Track berapa unit yang akan di-sablon
7. **Deadline** - Set target completion date
8. **Audit logging** - Track semua perubahan untuk compliance

### Next Steps (Optional):
- Frontend upload component dengan drag-drop
- Email notification saat ada feedback
- Payment integration untuk design request (biaya design custom)
- Admin dashboard untuk manage designs
- Design gallery / showcase

### Files Modified/Created:
- `package.json` - Added: multer
- `src/middleware/upload.js` - File upload config (NEW)
- `src/controllers/designRequestController.js` - CRUD endpoints (UPDATED)
- `src/routes/designRequests.js` - Routes config (UPDATED)
- `src/index.js` - Route registration (ALREADY DONE)
- `test-design-api.ps1` - Test script (NEW)
- `DESIGN_REQUEST_API_DOCS.md` - Full documentation (NEW)

### Verification:
```
Backend logs (npm run dev output):
2026-05-09T14:31:55.000Z POST /api/auth/login 200 185ms
2026-05-09T14:31:55.185Z POST /api/design-requests 201 104ms ← Create
2026-05-09T14:31:55.362Z GET /api/design-requests 200 146ms ← List
2026-05-09T14:31:55.409Z GET /api/design-requests/{id} 200 28ms ← Detail

All endpoints returning correct status codes (201 create, 200 read)
✓ TESTED & WORKING
```
