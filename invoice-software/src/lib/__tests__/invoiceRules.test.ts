import {
  isValidStatus,
  isValidTransition,
  validateInvoiceDates,
  determineInvoiceStatus,
  validatePaymentAmount,
  canDeleteInvoice,
  canEditInvoice,
  canAddPayment,
  validateDiscount,
} from '../invoiceRules';

describe('invoiceRules', () => {
  describe('isValidStatus', () => {
    it('should accept valid statuses', () => {
      expect(isValidStatus('draft')).toBe(true);
      expect(isValidStatus('sent')).toBe(true);
      expect(isValidStatus('paid')).toBe(true);
      expect(isValidStatus('overdue')).toBe(true);
      expect(isValidStatus('cancelled')).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(isValidStatus('invalid')).toBe(false);
      expect(isValidStatus('DRAFT')).toBe(false);
    });
  });

  describe('isValidTransition', () => {
    it('should allow draft to sent', () => {
      expect(isValidTransition('draft', 'sent')).toBe(true);
    });

    it('should allow sent to paid', () => {
      expect(isValidTransition('sent', 'paid')).toBe(true);
    });

    it('should not allow paid to draft', () => {
      expect(isValidTransition('paid', 'draft')).toBe(false);
    });

    it('should not allow cancelled transitions', () => {
      expect(isValidTransition('cancelled', 'draft')).toBe(false);
    });

    it('should allow same status', () => {
      expect(isValidTransition('draft', 'draft')).toBe(true);
    });
  });

  describe('validateInvoiceDates', () => {
    it('should accept valid dates', () => {
      const result = validateInvoiceDates(new Date('2026-01-01'), new Date('2026-01-31'));
      expect(result.isValid).toBe(true);
    });

    it('should accept same date', () => {
      const sameDate = new Date('2026-01-01');
      const result = validateInvoiceDates(sameDate, sameDate);
      expect(result.isValid).toBe(true);
    });

    it('should reject due date before issue date', () => {
      const result = validateInvoiceDates(new Date('2026-01-31'), new Date('2026-01-01'));
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid issue date', () => {
      const result = validateInvoiceDates(new Date('invalid'), new Date('2026-01-31'));
      expect(result.isValid).toBe(false);
    });
  });

  describe('determineInvoiceStatus', () => {
    it('should mark as paid when balance due is 0', () => {
      const status = determineInvoiceStatus(0, new Date('2026-12-31'), 'sent');
      expect(status).toBe('paid');
    });

    it('should mark as overdue when past due date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const status = determineInvoiceStatus(100, pastDate, 'sent');
      expect(status).toBe('overdue');
    });

    it('should keep sent status when not yet due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const status = determineInvoiceStatus(100, futureDate, 'sent');
      expect(status).toBe('sent');
    });

    it('should always keep cancelled as cancelled', () => {
      const status = determineInvoiceStatus(0, new Date(), 'cancelled');
      expect(status).toBe('cancelled');
    });
  });

  describe('validatePaymentAmount', () => {
    it('should accept valid payment', () => {
      const result = validatePaymentAmount(50, 100);
      expect(result.isValid).toBe(true);
    });

    it('should reject zero payment', () => {
      const result = validatePaymentAmount(0, 100);
      expect(result.isValid).toBe(false);
    });

    it('should reject negative payment', () => {
      const result = validatePaymentAmount(-50, 100);
      expect(result.isValid).toBe(false);
    });

    it('should allow overpayment', () => {
      const result = validatePaymentAmount(150, 100);
      expect(result.isValid).toBe(true);
    });
  });

  describe('canDeleteInvoice', () => {
    it('should allow deleting draft invoices', () => {
      expect(canDeleteInvoice('draft')).toBe(true);
    });

    it('should not allow deleting sent invoices', () => {
      expect(canDeleteInvoice('sent')).toBe(false);
    });

    it('should not allow deleting paid invoices', () => {
      expect(canDeleteInvoice('paid')).toBe(false);
    });
  });

  describe('canEditInvoice', () => {
    it('should allow editing draft invoices', () => {
      expect(canEditInvoice('draft')).toBe(true);
    });

    it('should allow editing sent invoices', () => {
      expect(canEditInvoice('sent')).toBe(true);
    });

    it('should not allow editing paid invoices', () => {
      expect(canEditInvoice('paid')).toBe(false);
    });

    it('should not allow editing cancelled invoices', () => {
      expect(canEditInvoice('cancelled')).toBe(false);
    });
  });

  describe('canAddPayment', () => {
    it('should allow payment on sent invoice', () => {
      expect(canAddPayment('sent', 100)).toBe(true);
    });

    it('should not allow payment on cancelled invoice', () => {
      expect(canAddPayment('cancelled', 100)).toBe(false);
    });

    it('should not allow payment on paid invoice', () => {
      expect(canAddPayment('paid', 0)).toBe(false);
    });

    it('should not allow payment when balance due is 0', () => {
      expect(canAddPayment('sent', 0)).toBe(false);
    });
  });

  describe('validateDiscount', () => {
    it('should accept valid discount', () => {
      const result = validateDiscount(10, 100);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative discount', () => {
      const result = validateDiscount(-10, 100);
      expect(result.isValid).toBe(false);
    });

    it('should reject discount exceeding subtotal', () => {
      const result = validateDiscount(150, 100);
      expect(result.isValid).toBe(false);
    });

    it('should allow discount exceeding subtotal if allowed', () => {
      const result = validateDiscount(150, 100, true);
      expect(result.isValid).toBe(true);
    });
  });
});
