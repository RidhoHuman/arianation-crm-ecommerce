# Order Fulfillment Workflow Implementation Plan

## Overview
Complete order fulfillment process from payment confirmation to delivery, with proper status transitions, tracking, and notifications.

---

## 1. Order Status Workflow

### State Diagram
```
PENDING 
  ↓ (Payment confirmed)
CONFIRMED
  ↓ (Admin confirms delivery feasibility)
PROCESSING
  ↓ (Items packed & ready)
READY_FOR_DELIVERY
  ↓ (Handed to courier)
SHIPPED
  ↓ (Delivered to customer)
DELIVERED
  ✓ DONE

Alternative paths:
- PENDING → CANCELLED (Customer cancels or payment fails)
- Any → FAILED (Fulfillment issue)
```

### Valid Status Transitions
- `PENDING → CONFIRMED`: Payment verified, customer confirmed order
- `CONFIRMED → PROCESSING`: Admin starts packing
- `PROCESSING → READY_FOR_DELIVERY`: Items packed & labeled
- `READY_FOR_DELIVERY → SHIPPED`: Courier picked up, tracking number assigned
- `SHIPPED → DELIVERED`: Customer received
- `PENDING → CANCELLED`: Before payment/customer cancellation
- `CONFIRMED → CANCELLED`: Before processing starts
- Any → `FAILED`: For issues (partial fulfillment, lost package, etc.)

---

## 2. Database Updates

### New/Updated Models

#### OrderStatusHistory (NEW)
```prisma
model OrderStatusHistory {
  id              String    @id @default(cuid())
  orderId         String
  order           Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  previousStatus  String
  newStatus       String
  reason          String?
  updatedBy       String    // Admin/System that made change
  notes           String?
  
  createdAt       DateTime  @default(now())
  
  @@index([orderId])
  @@index([createdAt])
}
```

#### OrderNotification (NEW)
```prisma
model OrderNotification {
  id            String    @id @default(cuid())
  orderId       String
  order         Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  userId        String?   // Recipient user
  recipientEmail String?
  
  type          String    // CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  title         String
  message       String
  emailSent     Boolean   @default(false)
  sentAt        DateTime?
  
  createdAt     DateTime  @default(now())
  
  @@index([orderId])
  @@index([type])
}
```

#### Update Order Model
```prisma
model Order {
  // ... existing fields ...
  statusHistory   OrderStatusHistory[]
  notifications   OrderNotification[]
}
```

---

## 3. New Endpoints

### Status Management

#### 1. Update Order Status (Enhanced)
**PUT** `/api/orders/:id/status`
- Only: ADMIN, OWNER, DESIGN_STAFF
- Body: `{ status, carrier?, trackingNumber?, notes? }`
- Validates status transition rules
- Creates OrderStatusHistory record
- Triggers notification
- Updates OrderTracking if SHIPPED
- Response: Updated order with history

#### 2. Get Order Status History
**GET** `/api/orders/:id/history`
- Returns all status changes with timestamps & reasons
- Paginated if needed

#### 3. Get Order Timeline
**GET** `/api/orders/:id/timeline`
- Returns combined view: status history + tracking updates
- For customer view (shows delivery progress)

### Tracking Management

#### 4. Update Tracking Information
**PUT** `/api/orders/:id/tracking`
- Body: `{ carrier, trackingNumber, estimatedDeliveryDate, currentLocation, notes }`
- Updates OrderTracking
- Creates TrackingHistory entry

#### 5. Get Tracking Details
**GET** `/api/orders/:id/tracking`
- Returns current tracking + history
- Already exists, enhance it

### Notifications

#### 6. Get Order Notifications
**GET** `/api/orders/:id/notifications`
- Returns all notifications for order
- Status, timestamp, email sent flag

#### 7. Resend Notification
**POST** `/api/orders/:id/notifications/:notificationId/resend`
- Resend email for specific notification
- Only ADMIN/OWNER

---

## 4. Business Logic

### Status Transition Validation
```javascript
const validTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_FOR_DELIVERY', 'FAILED'],
  READY_FOR_DELIVERY: ['SHIPPED', 'FAILED'],
  SHIPPED: ['DELIVERED', 'FAILED'],
  DELIVERED: [], // Final state
  CANCELLED: [], // Final state
  FAILED: ['PROCESSING', 'CANCELLED'], // Can retry or cancel
};
```

### Status Change Rules
- **PENDING → CONFIRMED**: Only if Payment.status = 'COMPLETED'
- **CONFIRMED → PROCESSING**: Check stock availability
- **PROCESSING → READY_FOR_DELIVERY**: Require packing verification (optional)
- **READY_FOR_DELIVERY → SHIPPED**: Require tracking number
- **SHIPPED → DELIVERED**: Can auto-update via courier webhook (future)

### Notification Triggers
When status changes:
1. **CONFIRMED**: Send "Order Confirmed" email
2. **PROCESSING**: Send "Your order is being prepared" 
3. **SHIPPED**: Send "Order Shipped" + tracking link
4. **DELIVERED**: Send "Delivery Confirmation" + rating prompt
5. **CANCELLED**: Send "Order Cancelled" + refund status
6. **FAILED**: Send "Delivery Issue" + support contact

---

## 5. Implementation Steps

### Phase 1: Database
- [ ] Add OrderStatusHistory model
- [ ] Add OrderNotification model
- [ ] Update Order model relations
- [ ] Run migration: `npx prisma migrate dev --name add-fulfillment`

### Phase 2: Core Service
- [ ] Create OrderFulfillmentService
  - validateStatusTransition()
  - updateOrderStatus()
  - createStatusHistory()
  - triggerNotification()

### Phase 3: Controller Updates
- [ ] Update orderController.updateOrderStatus() with validation
- [ ] Add getOrderStatusHistory()
- [ ] Add getOrderTimeline()
- [ ] Add updateOrderTracking()

### Phase 4: Routes
- [ ] Add new routes in src/routes/orders.js
- [ ] Add admin routes in src/routes/admin.js

### Phase 5: Notifications
- [ ] Create NotificationService
  - generateNotificationMessage()
  - sendEmailNotification()
  - saveNotificationRecord()

### Phase 6: Admin UI
- [ ] Update admin orders page to show status history
- [ ] Add status transition form
- [ ] Add tracking info management

### Phase 7: Customer UI
- [ ] Add order timeline/tracking page for customers
- [ ] Show status history
- [ ] Show tracking info when SHIPPED

---

## 6. Testing Scenarios

1. Normal Flow: PENDING → CONFIRMED → PROCESSING → READY_FOR_DELIVERY → SHIPPED → DELIVERED
2. Cancel Before Processing: PENDING → CONFIRMED → CANCELLED
3. Delivery Issue: PROCESSING → FAILED → PROCESSING → SHIPPED
4. Track by Courier: Update tracking via ORDER_TRACKING_UPDATE webhook
5. Email Resend: Resend any status confirmation email
6. Timeline View: Customer sees full order journey

---

## 7. Future Enhancements

- [ ] Courier API integration (auto-update tracking)
- [ ] SMS notifications on status change
- [ ] Customer notification preferences
- [ ] Batch status updates (bulk operations)
- [ ] Fulfillment performance analytics
- [ ] Auto-mark as delivered after X days (SHIPPED state)
- [ ] Return management workflow

