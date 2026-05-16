# Admin Dashboard Frontend - Quick Start Guide

## 📋 Overview

The admin dashboard is a **comprehensive Next.js-based management interface** for Arianation operations. It provides a modern, responsive UI for managing products, orders, design requests, users, payments, analytics, and audit logs.

## 🎯 Features

✅ **Dashboard Overview** - Real-time statistics and recent orders  
✅ **Product Management** - Full CRUD with search/filter  
✅ **Order Management** - List, detail view, status updates, cancellations  
✅ **Design Requests** - View, manage, update status, view feedback  
✅ **User Management** - List users, change roles, toggle status  
✅ **Payment Verification** - Verify payments, process refunds  
✅ **Analytics** - Sales, revenue, orders, customers, designs (last 7/30/90 days)  
✅ **Audit Logs** - Track all admin operations with IP/user agent  
✅ **Role-Based Access** - OWNER/ADMIN only (protects all pages)  

## 📁 File Structure

```
frontend/src/app/admin/
├── layout.js                          # Admin layout with auth check + sidebar
├── page.js                            # Dashboard page (home)
├── components/
│   ├── AdminSidebar.js               # Navigation sidebar
│   ├── StatsCard.js                  # Reusable stat card component
│   └── DataTable.js                  # Reusable data table with pagination
├── products/
│   └── page.js                       # Products CRUD page
├── orders/
│   └── page.js                       # Orders management page
├── design-requests/
│   └── page.js                       # Design requests management
├── users/
│   └── page.js                       # Users management
├── payments/
│   └── page.js                       # Payments verification
├── analytics/
│   └── page.js                       # Analytics dashboard
└── audit-logs/
    └── page.js                       # Audit logs viewer
```

## 🚀 How to Use

### 1. Start Backend
```bash
cd d:\projects\arianation-crm-ecommerce
npm run dev
```
Backend should run on `http://localhost:3001`

### 2. Start Frontend
```bash
cd d:\projects\arianation-crm-ecommerce\frontend
npm run dev
```
Frontend should run on `http://localhost:3000`

### 3. Access Admin Dashboard
```
1. Go to http://localhost:3000/login
2. Login with:
   Email: owner@arianation.com
   Password: Owner@123
3. Click "Admin Dashboard" (or navigate to /admin)
4. You'll see the admin sidebar with all management options
```

## 🔐 Authentication

- **Protected Pages**: All `/admin/*` pages require login + OWNER/ADMIN role
- **Auto Redirect**: Non-admin users are redirected to home page
- **Token Management**: JWT tokens stored in localStorage
- **Session Persistence**: Uses HTTP cookies + Authorization header

## 🧩 Components

### StatsCard.js
Displays a statistic with icon, title, value, and optional subtitle.
```jsx
<StatsCard
  icon="📊"
  title="Total Orders"
  value="150"
  color="blue"
/>
```

### DataTable.js
Reusable table component with:
- Columns with custom rendering
- Loading state
- Pagination controls
- Action buttons per row
```jsx
<DataTable
  columns={columns}
  data={items}
  pagination={pagination}
  onPageChange={handlePageChange}
  actions={[{ label: 'Edit', onClick: handleEdit }]}
/>
```

### AdminSidebar.js
Fixed sidebar navigation with:
- Collapsible menu
- Active page highlighting
- User info display
- Logout button

## 📊 Page Features

### Dashboard (`/admin`)
- **4 Main Stats**: Today's orders, total revenue, customers, pending designs
- **Additional Stats**: Month's orders, top product
- **Recent Orders**: Table with latest 10 orders

### Products (`/admin/products`)
- **List**: Searchable product table with pagination
- **Create**: Form to add new products
- **Edit**: Update product details
- **Delete**: Remove products
- **Filters**: Search by name/description

### Orders (`/admin/orders`)
- **List**: Orders table with status, amount, date
- **Filter**: By status (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- **Detail Modal**: View full order with items and payment info
- **Status Updates**: Change order status
- **Cancel**: Cancel pending/confirmed orders

### Design Requests (`/admin/design-requests`)
- **List**: All design requests with status
- **Filter**: By status (DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REVISION_REQUESTED, REJECTED, IN_PRODUCTION, COMPLETED)
- **Detail Modal**: View design, feedback history, file link
- **Status Management**: Update design status
- **Feedback Viewer**: See all feedback from design staff

### Users (`/admin/users`)
- **List**: All users with role and status
- **Filter**: By role (CUSTOMER, DESIGN_STAFF, ADMIN, OWNER)
- **Role Change**: Promote users to ADMIN
- **Status Toggle**: Activate/deactivate users

### Payments (`/admin/payments`)
- **List**: All payments with status and method
- **Filter**: By status (PENDING, COMPLETED, FAILED)
- **Verify**: Mark payments as completed
- **Refund**: Process refunds (updates payment + order status)

### Analytics (`/admin/analytics`)
- **Time Range**: 7, 30, or 90 days
- **Sales**: Daily trends (orders, items, revenue)
- **Revenue**: By category and payment method
- **Orders**: Status distribution, average order value
- **Customers**: Total, new customers, top spenders
- **Designs**: Approval rate, status distribution

### Audit Logs (`/admin/audit-logs`)
- **List**: All admin operations with timestamps
- **Filter**: By action type or user
- **Details**: IP address, user agent, action type
- **Pagination**: 20 logs per page

## 🎨 Styling

- **Framework**: Tailwind CSS (already configured in Next.js)
- **Colors**: Blue (primary), Green (success), Red (danger), Orange (warning)
- **Responsive**: Mobile-first responsive design
- **Status Badges**: Color-coded status indicators
- **Transitions**: Smooth hover/transition effects

## 🔌 API Integration

All pages connect to backend REST APIs:

```javascript
// Example API call pattern
const response = await fetch('http://localhost:3001/api/admin/products', {
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
const data = await response.json();
```

**Base URL**: `http://localhost:3001/api/admin`

## 🚦 Error Handling

- **Auth Errors**: Redirect to login
- **Validation Errors**: Display inline error messages
- **API Errors**: Show error toast at top of page
- **Loading States**: Spinner in data tables

## 📱 Responsive Design

- **Mobile**: Stack layout, collapsible sidebar
- **Tablet**: 2-column grids
- **Desktop**: Full sidebar + content layout
- **Tables**: Horizontal scroll on small screens

## 🔄 Real-time Updates

- **Auto Refresh**: Tables refresh after CRUD operations
- **Pagination**: Maintains current page after updates
- **Filters**: Preserved during data refresh
- **Modals**: Auto-close after successful operations

## 🛠️ Development

### Adding a New Admin Page

1. Create folder: `/admin/new-feature/page.js`
2. Use template:
   ```jsx
   'use client';
   import { useEffect, useState } from 'react';
   import DataTable from '../components/DataTable';

   export default function NewFeaturePage() {
     const [data, setData] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       // Fetch data
     }, []);

     return (
       <div className="space-y-6">
         {/* Your UI */}
       </div>
     );
   }
   ```
3. Add to sidebar in `AdminSidebar.js` navItems array
4. Test with dev server

### Customizing Components

Edit `/admin/components/*` to modify reusable components

## ⚠️ Important Notes

1. **Backend Required**: All features need backend running on `:3001`
2. **Auth Required**: Must login before accessing `/admin`
3. **Role Check**: Only OWNER/ADMIN can access admin pages
4. **No Data Caching**: Refreshes on every page load
5. **Single User**: No real-time multi-user updates yet

## 📈 Future Enhancements

- [ ] Real-time charts using Recharts or Chart.js
- [ ] Bulk operations (bulk edit, bulk delete)
- [ ] Export to Excel/PDF
- [ ] Scheduled reports
- [ ] Real-time notifications
- [ ] Dark mode toggle
- [ ] User activity logs (who did what)
- [ ] Advanced filtering/search
- [ ] Saved views/filters

## 🆘 Troubleshooting

### Can't access /admin
- Check backend is running on `:3001`
- Verify login credentials
- Clear localStorage if issues persist

### Data not loading
- Check browser console for errors
- Verify JWT token in localStorage
- Check backend logs for API errors

### Sidebar not showing
- Check auth middleware in `layout.js`
- Verify user role is OWNER or ADMIN
- Reload page if auth state stuck

### Buttons not working
- Check network tab in devtools
- Verify backend endpoints are correct
- Check error messages in console

## 📞 Support

For issues, check:
1. Backend logs: `npm run dev` terminal
2. Frontend console: Browser DevTools
3. Network tab: API calls and responses
4. Backend API docs: `ADMIN_API_DOCS.md`

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-05-14  
**Version**: 1.0
