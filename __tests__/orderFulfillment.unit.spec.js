const {
  validateStatusTransition,
  validateTransitionRules,
} = require('../src/services/orderFulfillmentService');

const { BadRequestError } = require('../src/utils/errors');

describe('orderFulfillmentService - unit', () => {
  describe('validateStatusTransition()', () => {
    test('allows valid transition PENDING -> CONFIRMED', () => {
      expect(() => validateStatusTransition('PENDING', 'CONFIRMED')).not.toThrow();
    });

    test('throws on invalid current status', () => {
      expect(() => validateStatusTransition('UNKNOWN', 'CONFIRMED')).toThrow(BadRequestError);
    });

    test('throws on disallowed transition', () => {
      expect(() => validateStatusTransition('DELIVERED', 'PROCESSING')).toThrow(BadRequestError);
    });
  });

  describe('validateTransitionRules()', () => {
    test('requires completed payment when confirming pending order', async () => {
      const mockTrx = jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));
      const order = { status: 'PENDING', payment: { status: 'PENDING' } };
      await expect(validateTransitionRules(mockTrx, order, 'CONFIRMED')).rejects.toThrow(
        BadRequestError
      );
    });

    test('allows confirming when payment completed', async () => {
      const mockTrx = jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));
      const order = { status: 'PENDING', payment: { status: 'COMPLETED' } };
      await expect(validateTransitionRules(mockTrx, order, 'CONFIRMED')).resolves.toBeUndefined();
    });

    test('requires tracking number before shipping', async () => {
      const mockTrx = jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));
      const order = { status: 'READY_FOR_DELIVERY', tracking: null };
      await expect(validateTransitionRules(mockTrx, order, 'SHIPPED')).rejects.toThrow(
        BadRequestError
      );
    });

    test('allows shipping when tracking number present', async () => {
      const mockTrx = jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));
      const order = { status: 'READY_FOR_DELIVERY', tracking: { trackingNumber: 'T123' } };
      await expect(validateTransitionRules(mockTrx, order, 'SHIPPED')).resolves.toBeUndefined();
    });
  });
});
