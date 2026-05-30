# Phase 6: Frontend E-Commerce Implementation Plan

**Date:** May 28, 2026  
**Status:** 🚀 IN PROGRESS  
**Target Duration:** 2-3 weeks

---

## 📋 DETAILED IMPLEMENTATION PLAN

### A. Project Setup & Dependencies

#### 1. Install Required Libraries
```bash
npm install \
  axios \
  zustand \
  react-hook-form \
  zod \
  @hookform/resolvers \
  react-toastify \
  date-fns \
  clsx \
  tailwind-merge
```

#### 2. Environment Configuration
```env
# frontend/.env.local
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Arianation
```

### B. Folder Structure to Create
```
frontend/src/
├── pages/
│   ├── Home.jsx (✅ exists - enhance)
│   ├── Products.jsx (🆕 product listing)
│   ├── ProductDetail.jsx (🆕 product detail)
│   ├── Cart.jsx (🆕 shopping cart)
│   ├── Checkout.jsx (✅ exists - implement)
│   ├── OrderConfirmation.jsx (🆕)
│   ├── OrderTracking.jsx (🆕)
│   ├── Dashboard.jsx (✅ exists - enhance)
│   ├── Login.jsx (✅ exists - implement)
│   ├── Register.jsx (✅ exists - implement)
│   └── NotFound.jsx (🆕)
│
├── components/
│   ├── Layout.jsx (✅ exists - enhance)
│   ├── Header.jsx (🆕)
│   ├── Footer.jsx (🆕)
│   ├── Navigation.jsx (🆕)
│   ├── ProductCard.jsx (🆕)
│   ├── ProductGrid.jsx (🆕)
│   ├── CartItem.jsx (🆕)
│   ├── CartSummary.jsx (🆕)
│   ├── CheckoutForm.jsx (🆕)
│   ├── AddressForm.jsx (🆕)
│   ├── PaymentForm.jsx (🆕)
│   ├── OrderTimeline.jsx (🆕)
│   ├── LoadingSpinner.jsx (🆕)
│   ├── ErrorMessage.jsx (🆕)
│   └── ConfirmDialog.jsx (🆕)
│
├── hooks/
│   ├── useAuth.js (🆕)
│   ├── useProduct.js (🆕)
│   ├── useCart.js (🆕)
│   ├── useOrder.js (🆕)
│   └── useFetch.js (🆕)
│
├── store/
│   ├── authStore.js (🆕 Zustand - user auth state)
│   ├── cartStore.js (🆕 Zustand - shopping cart)
│   └── uiStore.js (🆕 Zustand - loading, notifications)
│
├── services/
│   ├── api.js (🆕 Axios instance)
│   ├── authService.js (🆕 Login/Register API calls)
│   ├── productService.js (🆕 Product API calls)
│   ├── cartService.js (🆕 Cart API calls)
│   ├── orderService.js (🆕 Order API calls)
│   └── paymentService.js (🆕 Payment API calls)
│
├── utils/
│   ├── formatters.js (🆕 Format price, date, etc.)
│   ├── validators.js (🆕 Form validation schemas)
│   ├── constants.js (🆕 App constants)
│   └── storage.js (🆕 LocalStorage helpers)
│
├── styles/
│   ├── globals.css (🆕)
│   └── tailwind.css (🆕)
│
└── types/ (Optional - if using JSDoc)
    ├── product.types.js
    ├── order.types.js
    └── user.types.js
```

---

## 🎯 PAGES TO IMPLEMENT

### 1. Products Page (Product Listing)
**File:** `src/pages/Products.jsx`

**Features:**
- Display product grid (with pagination or infinite scroll)
- Filter by category, price range, business type
- Search functionality
- Sort by: newest, price (low-high, high-low), popularity
- Show: product image, name, price, stock status
- Add to cart button

**Data from API:**
- GET `/api/products` (with filters & pagination)

**Components Used:**
- ProductGrid
- ProductCard
- FilterSidebar
- Pagination

---

### 2. Product Detail Page
**File:** `src/pages/ProductDetail.jsx`

**Features:**
- Product image gallery
- Product name, price, description
- Stock status & quantity selector
- Add to cart button
- Related products section
- Product reviews (if implemented)

**Data from API:**
- GET `/api/products/:id`

**Components Used:**
- ImageGallery
- ProductDetails
- RelatedProducts

---

### 3. Shopping Cart Page
**File:** `src/pages/Cart.jsx`

**Features:**
- List all cart items
- Edit quantity per item
- Remove items
- Cart summary (subtotal, tax, shipping)
- Proceed to checkout button
- Continue shopping button
- Empty cart message

**Data from:**
- Local Zustand store (cartStore)
- Show total price calculation

**Components Used:**
- CartItem
- CartSummary

---

### 4. Checkout Page (Multi-Step Form)
**File:** `src/pages/Checkout.jsx`

**Steps:**
1. **Shipping Address**
   - Form with address fields
   - Address validation
   - Save address for future use

2. **Shipping Method**
   - Display available couriers
   - Shipping cost calculation
   - Estimated delivery date

3. **Payment Method**
   - Select payment method
   - Payment form (bank transfer, credit card, e-wallet)

4. **Order Review**
   - Show order summary
   - Review shipping & payment details
   - Final confirmation button

**Data from API:**
- GET `/api/orders/shipping-costs` (for courier options)
- POST `/api/orders` (create order)

**Components Used:**
- StepIndicator
- AddressForm
- ShippingMethodSelector
- PaymentForm
- OrderReview

---

### 5. Payment Form Component
**File:** `src/components/PaymentForm.jsx`

**Features:**
- Multiple payment method selection
- Payment form fields
- Order review
- Confirm payment button

**Payment Methods:**
- Bank Transfer
- Credit Card (with 3D Secure if available)
- E-Wallet (if integrated)

---

### 6. Order Confirmation Page
**File:** `src/pages/OrderConfirmation.jsx`

**Features:**
- Thank you message
- Order number display
- Order summary
- Estimated delivery date
- Link to track order
- Link to continue shopping

**Data from:**
- Order details from previous step or API

---

### 7. Order Tracking Page
**File:** `src/pages/OrderTracking.jsx`

**Features:**
- Order status timeline
- Current location (if available)
- Tracking number
- Estimated delivery date
- Carrier information
- Contact support button

**Data from API:**
- GET `/api/orders/:id/tracking`

**Components Used:**
- OrderTimeline
- TrackingDetails

---

### 8. User Dashboard/Account
**File:** `src/pages/Dashboard.jsx`

**Sections:**
1. **Profile Information**
   - User name, email
   - Avatar
   - Edit profile button

2. **My Orders**
   - List of all orders
   - Order status
   - Quick links to track order
   - Reorder button

3. **Design Requests**
   - Submitted design requests
   - Status of each request
   - Upload files section

4. **Addresses**
   - Saved addresses
   - Add/edit/delete address
   - Set default address

5. **Notification Settings**
   - Email notification preferences

**Data from API:**
- GET `/api/users/profile`
- GET `/api/orders` (user's orders)
- GET `/api/design-requests`
- GET `/api/users/addresses`

---

## 🏗️ COMPONENTS TO CREATE

### Core Layout Components
1. **Header** - Navigation, logo, search bar, cart icon
2. **Footer** - Links, company info, social media
3. **Navigation** - Breadcrumbs, category menu
4. **Sidebar** - Filters (for products page)

### Product Components
1. **ProductCard** - Single product display
2. **ProductGrid** - Grid of products
3. **ImageGallery** - Product image viewer
4. **FilterPanel** - Category, price, type filters

### Cart Components
1. **CartItem** - Single cart item with quantity selector
2. **CartSummary** - Subtotal, tax, shipping, total
3. **EmptyCart** - Message when cart is empty

### Checkout Components
1. **StepIndicator** - Visual step progress
2. **AddressForm** - Address input & validation
3. **ShippingMethodSelector** - Courier selection
4. **PaymentForm** - Payment method selection & details
5. **OrderReview** - Order summary for confirmation

### Order Tracking Components
1. **OrderTimeline** - Status progression timeline
2. **TrackingDetails** - Tracking number, carrier, etc.

### Utility Components
1. **LoadingSpinner** - Loading state
2. **ErrorMessage** - Error display
3. **ConfirmDialog** - Confirmation modal
4. **Toast Notifications** - Success/error messages
5. **Badge** - Stock status, sale badge, new badge

---

## 🎨 STATE MANAGEMENT (Zustand Stores)

### authStore.js
```javascript
{
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  login: (email, password) => {},
  register: (userData) => {},
  logout: () => {},
  setUser: (user) => {},
  checkAuth: () => {}
}
```

### cartStore.js
```javascript
{
  items: [],
  addItem: (product, quantity) => {},
  removeItem: (productId) => {},
  updateQuantity: (productId, quantity) => {},
  clearCart: () => {},
  getTotalPrice: () => {},
  getItemCount: () => {},
  loadFromStorage: () => {},
  saveToStorage: () => {}
}
```

### uiStore.js
```javascript
{
  isLoading: false,
  notifications: [],
  addNotification: (type, message) => {},
  removeNotification: (id) => {},
  setLoading: (loading) => {}
}
```

---

## 📡 API HOOKS

### useAuth.js
```javascript
- useLogin(email, password)
- useRegister(userData)
- useLogout()
- useUser()
- useIsAuthenticated()
```

### useProduct.js
```javascript
- useProducts(filters, pagination)
- useProductDetail(id)
- useCategories()
- useRelatedProducts(productId)
```

### useCart.js
```javascript
- useAddToCart(product, quantity)
- useRemoveFromCart(productId)
- useUpdateCartQuantity(productId, quantity)
- useCartTotal()
```

### useOrder.js
```javascript
- useCreateOrder(orderData)
- useOrders(filters)
- useOrderDetail(id)
- useOrderTracking(id)
- useShippingCosts(address)
```

### useFetch.js (Generic hook)
```javascript
- useFetch(url, options)
- Returns: { data, error, isLoading, refetch }
```

---

## 🔒 AUTHENTICATION FLOW

1. **Login/Register Page**
   - Form submission → authService.login() or authService.register()
   - Store token in localStorage & authStore
   - Redirect to home or dashboard

2. **Protected Routes**
   - Check authStore.isAuthenticated
   - If not authenticated → redirect to login
   - If authenticated → show page

3. **Auto-login on App Load**
   - Check localStorage for token
   - Validate token with backend
   - Restore user session

---

## 🛒 SHOPPING FLOW

1. **User Browses Products**
   - Products page → ProductGrid → ProductCard

2. **User Clicks Product**
   - Navigate to ProductDetail page
   - Show image gallery, details, related products

3. **User Adds to Cart**
   - Select quantity
   - Click "Add to Cart"
   - Update cartStore
   - Show toast notification
   - Update cart icon count

4. **User Goes to Cart**
   - Cart page shows cartStore items
   - Can update quantities, remove items

5. **User Proceeds to Checkout**
   - Multi-step form:
     - Step 1: Enter shipping address
     - Step 2: Select shipping method (get costs from API)
     - Step 3: Select payment method
     - Step 4: Review order
   - Submit → POST `/api/orders` → Create order

6. **Order Created**
   - Show order confirmation page
   - Display order number, ETA
   - Link to track order

7. **User Tracks Order**
   - Order tracking page
   - Show timeline, location, tracking number
   - Auto-refresh every few minutes

---

## 📋 FORM VALIDATION SCHEMAS (Zod)

### Address Schema
```javascript
{
  street: string (required, min 5)
  city: string (required)
  province: string (required)
  postalCode: string (required, pattern: \d{5})
  phoneNumber: string (required, pattern: phone)
}
```

### Payment Schema
```javascript
{
  paymentMethod: enum (BANK_TRANSFER, CREDIT_CARD, E_WALLET)
  // Additional fields based on payment method
}
```

### Contact Schema
```javascript
{
  firstName: string (required)
  lastName: string (required)
  email: string (required, email)
  phoneNumber: string (required)
}
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Week 1 (High Priority)
1. ✅ Setup: Install dependencies, setup stores, API client
2. ✅ Authentication: Login/Register pages
3. ✅ Products: Listing page with grid & filtering
4. ✅ Product Detail: Detail page with images & info
5. ✅ Cart: Shopping cart page with add/remove/quantity

### Week 2 (High Priority)
1. ✅ Checkout: Multi-step form with validation
2. ✅ Payment: Payment form component
3. ✅ Order: Order confirmation page
4. ✅ Dashboard: User profile & order history

### Week 3 (Medium Priority)
1. ✅ Tracking: Order tracking page
2. ✅ Design Requests: Submit & track designs
3. ✅ Error Handling: Better error messages
4. ✅ Performance: Optimization & caching

---

## ✅ CHECKLIST FOR COMPLETION

- [ ] Dependencies installed
- [ ] Folder structure created
- [ ] API client setup (Axios)
- [ ] Zustand stores created
- [ ] Authentication implemented
- [ ] Products page complete
- [ ] Product detail page complete
- [ ] Shopping cart implemented
- [ ] Checkout flow complete (4 steps)
- [ ] Order confirmation page
- [ ] Order tracking page
- [ ] Dashboard/Account page
- [ ] Form validation with Zod
- [ ] Error handling & notifications
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Performance optimization
- [ ] Testing (basic E2E)
- [ ] Code cleanup & documentation

