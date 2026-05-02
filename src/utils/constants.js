// src/utils/constants.js

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  DESIGN_STAFF: 'DESIGN_STAFF',
  OWNER: 'OWNER',
};

const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
};

const PAYMENT_METHOD = {
  QRIS: 'QRIS',
  BANK_TRANSFER: 'BANK_TRANSFER',
  COD: 'COD',
};

const DESIGN_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  COMPLETED: 'COMPLETED',
};

const MESSAGES = {
  // Auth
  AUTH_LOGIN_SUCCESS: 'Login successful',
  AUTH_REGISTER_SUCCESS: 'Registration successful',
  AUTH_LOGOUT_SUCCESS: 'Logout successful',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_TOKEN_EXPIRED: 'Token has expired',
  AUTH_TOKEN_INVALID: 'Invalid token',
  AUTH_TOKEN_MISSING: 'Authentication token is required',
  AUTH_ACCOUNT_DISABLED: 'Account is disabled',
  AUTH_EMAIL_EXISTS: 'Email address is already registered',

  // Users
  USER_FOUND: 'User retrieved successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_NOT_FOUND: 'User not found',
  USERS_FOUND: 'Users retrieved successfully',
  USER_PASSWORD_CHANGED: 'Password changed successfully',
  USER_WRONG_PASSWORD: 'Current password is incorrect',

  // Products
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_FOUND: 'Product retrieved successfully',
  PRODUCTS_FOUND: 'Products retrieved successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  PRODUCT_NOT_FOUND: 'Product not found',

  // Cart
  CART_FOUND: 'Cart retrieved successfully',
  CART_ITEM_ADDED: 'Item added to cart',
  CART_ITEM_UPDATED: 'Cart item updated',
  CART_ITEM_REMOVED: 'Item removed from cart',
  CART_CLEARED: 'Cart cleared',
  CART_EMPTY: 'Cart is empty',

  // Orders
  ORDER_CREATED: 'Order created successfully',
  ORDER_FOUND: 'Order retrieved successfully',
  ORDERS_FOUND: 'Orders retrieved successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_CANNOT_CANCEL: 'Order cannot be cancelled in its current status',

  // Payments
  PAYMENT_CREATED: 'Payment initiated successfully',
  PAYMENT_FOUND: 'Payment retrieved successfully',
  PAYMENTS_FOUND: 'Payments retrieved successfully',
  PAYMENT_VERIFIED: 'Payment verified successfully',
  PAYMENT_NOT_FOUND: 'Payment not found',
  PAYMENT_ALREADY_COMPLETED: 'Payment has already been completed',

  // Design Requests
  DESIGN_REQUEST_CREATED: 'Design request created successfully',
  DESIGN_REQUEST_FOUND: 'Design request retrieved successfully',
  DESIGN_REQUESTS_FOUND: 'Design requests retrieved successfully',
  DESIGN_REQUEST_UPDATED: 'Design request updated successfully',
  DESIGN_REQUEST_NOT_FOUND: 'Design request not found',
  DESIGN_FEEDBACK_ADDED: 'Feedback added successfully',

  // General
  FORBIDDEN: 'You do not have permission to perform this action',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'An internal server error occurred',
  NOT_FOUND: 'Resource not found',
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  DESIGN_STATUS,
  MESSAGES,
};
