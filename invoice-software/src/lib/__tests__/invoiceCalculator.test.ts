import { calculateInvoice, calculateLineTotal } from '../invoiceCalculator';

describe('invoiceCalculator', () => {
  describe('calculateLineTotal', () => {
    it('should calculate line total correctly', () => {
      const total = calculateLineTotal(5, 10.5);
      expect(total).toBe(52.5);
    });

    it('should handle decimal precision', () => {
      const total = calculateLineTotal(3, 10.33);
      expect(total).toBe(30.99);
    });

    it('should return 0 for negative quantity', () => {
      const total = calculateLineTotal(-5, 10);
      expect(total).toBe(0);
    });

    it('should return 0 for negative price', () => {
      const total = calculateLineTotal(5, -10);
      expect(total).toBe(0);
    });
  });

  describe('calculateInvoice', () => {
    it('should calculate valid invoice correctly', () => {
      const result = calculateInvoice({
        items: [
          { quantity: 2, unitPrice: 100 },
          { quantity: 1, unitPrice: 50 },
        ],
        taxRate: 0.1,
        discountAmount: 25,
        amountPaid: 0,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.subtotal).toBe(250);
      expect(result.taxAmount).toBe(25);
      expect(result.total).toBe(250);
      expect(result.balanceDue).toBe(250);
    });

    it('should handle tax calculations correctly', () => {
      const result = calculateInvoice({
        items: [{ quantity: 1, unitPrice: 100 }],
        taxRate: 0.15,
        discountAmount: 0,
        amountPaid: 0,
      });

      expect(result.taxAmount).toBe(15);
      expect(result.total).toBe(115);
    });

    it('should handle discount correctly', () => {
      const result = calculateInvoice({
        items: [{ quantity: 1, unitPrice: 100 }],
        taxRate: 0.1,
        discountAmount: 10,
        amountPaid: 0,
      });

      expect(result.total).toBe(100);
      expect(result.balanceDue).toBe(100);
    });

    it('should calculate balance due after payment', () => {
      const result = calculateInvoice({
        items: [{ quantity: 1, unitPrice: 100 }],
        taxRate: 0.1,
        discountAmount: 0,
        amountPaid: 60,
      });

      expect(result.total).toBe(110);
      expect(result.balanceDue).toBe(50);
    });

    it('should mark as invalid for negative quantity', () => {
      const result = calculateInvoice({
        items: [{ quantity: -1, unitPrice: 100 }],
        taxRate: 0.1,
        discountAmount: 0,
        amountPaid: 0,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should mark as invalid for invalid tax rate', () => {
      const result = calculateInvoice({
        items: [{ quantity: 1, unitPrice: 100 }],
        taxRate: 1.5,
        discountAmount: 0,
        amountPaid: 0,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Tax rate'))).toBe(true);
    });

    it('should mark as invalid for negative discount', () => {
      const result = calculateInvoice({
        items: [{ quantity: 1, unitPrice: 100 }],
        taxRate: 0.1,
        discountAmount: -10,
        amountPaid: 0,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Discount'))).toBe(true);
    });

    it('should handle empty items', () => {
      const result = calculateInvoice({
        items: [],
        taxRate: 0.1,
        discountAmount: 0,
        amountPaid: 0,
      });

      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(0);
      expect(result.balanceDue).toBe(0);
    });
  });
});
