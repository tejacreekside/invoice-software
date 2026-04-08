/**
 * invoiceCalculator
 * 
 * Centralized module for all invoice financial calculations.
 * Handles subtotal, tax, discount, total, and balance due.
 * 
 * Design principles:
 * - No side effects
 * - Single responsibility
 * - Safe numeric handling (avoid floating point errors)
 * - Prevent invalid negative values
 */

interface InvoiceCalculationInput {
  items: Array<{
    quantity: number;
    unitPrice: number;
  }>;
  taxRate: number;
  discountAmount: number;
  amountPaid: number;
}

interface InvoiceCalculationOutput {
  subtotal: number;
  taxAmount: number;
  total: number;
  balanceDue: number;
  isValid: boolean;
  errors: string[];
}

/**
 * Safely round to 2 decimal places
 */
function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate subtotal from invoice items
 */
function calculateSubtotal(items: InvoiceCalculationInput['items']): number {
  if (!items || items.length === 0) return 0;

  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + itemTotal;
  }, 0);

  return roundToTwo(subtotal);
}

/**
 * Calculate tax amount
 */
function calculateTax(subtotal: number, taxRate: number): number {
  if (taxRate < 0 || taxRate > 1) {
    return 0;
  }
  return roundToTwo(subtotal * taxRate);
}

/**
 * Calculate total amount
 */
function calculateTotal(
  subtotal: number,
  taxAmount: number,
  discountAmount: number
): number {
  let total = subtotal + taxAmount - discountAmount;
  // Ensure total doesn't go negative
  total = Math.max(0, total);
  return roundToTwo(total);
}

/**
 * Calculate balance due
 */
function calculateBalanceDue(total: number, amountPaid: number): number {
  let balance = total - amountPaid;
  // Balance due should be >= 0 (fully paid or overpaid)
  balance = Math.max(0, balance);
  return roundToTwo(balance);
}

/**
 * Validate calculation inputs
 */
function validateInputs(input: InvoiceCalculationInput): string[] {
  const errors: string[] = [];

  if (!Array.isArray(input.items)) {
    errors.push('Items must be an array');
  } else {
    input.items.forEach((item, index) => {
      if (item.quantity < 0) {
        errors.push(`Item ${index}: Quantity cannot be negative`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Item ${index}: Unit price cannot be negative`);
      }
      if (!Number.isFinite(item.quantity) || !Number.isFinite(item.unitPrice)) {
        errors.push(`Item ${index}: Quantity and unit price must be finite numbers`);
      }
    });
  }

  if (input.taxRate < 0 || input.taxRate > 1) {
    errors.push('Tax rate must be between 0 and 1');
  }

  if (input.discountAmount < 0) {
    errors.push('Discount amount cannot be negative');
  }

  if (input.amountPaid < 0) {
    errors.push('Amount paid cannot be negative');
  }

  if (!Number.isFinite(input.taxRate) || !Number.isFinite(input.discountAmount) || !Number.isFinite(input.amountPaid)) {
    errors.push('All numeric values must be finite numbers');
  }

  return errors;
}

/**
 * Main calculation function
 * Returns all calculated values and validation errors
 */
export function calculateInvoice(input: InvoiceCalculationInput): InvoiceCalculationOutput {
  const errors = validateInputs(input);
  
  const subtotal = calculateSubtotal(input.items);
  const taxAmount = calculateTax(subtotal, input.taxRate);
  const total = calculateTotal(subtotal, taxAmount, input.discountAmount);
  const balanceDue = calculateBalanceDue(total, input.amountPaid);

  return {
    subtotal,
    taxAmount,
    total,
    balanceDue,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate line item total (quantity × unitPrice)
 */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  if (quantity < 0 || unitPrice < 0) {
    return 0;
  }
  return roundToTwo(quantity * unitPrice);
}

export { roundToTwo };
export type { InvoiceCalculationInput, InvoiceCalculationOutput };
