/**
 * invoiceRules
 * 
 * Centralized module for invoice business rules.
 * Handles status validation, transitions, date validation, and custom rules.
 * 
 * This module is designed to be extended for custom Modisoft-unsupported rules
 * without spreading logic across the codebase.
 */

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

const VALID_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  paid: ['overdue'], // Can move back to overdue if dates change
  overdue: ['paid', 'cancelled'],
  cancelled: [],
};

/**
 * Validate if a status is valid
 */
export function isValidStatus(status: string): status is InvoiceStatus {
  return VALID_STATUSES.includes(status as InvoiceStatus);
}

/**
 * Check if a status transition is allowed
 */
export function isValidTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  if (!isValidStatus(from) || !isValidStatus(to)) {
    return false;
  }
  if (from === to) {
    return true; // Allow no-op transitions
  }
  return STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Validate issue and due dates
 */
export function validateInvoiceDates(issueDate: Date, dueDate: Date): { isValid: boolean; error?: string } {
  if (isNaN(issueDate.getTime())) {
    return { isValid: false, error: 'Issue date is invalid' };
  }
  if (isNaN(dueDate.getTime())) {
    return { isValid: false, error: 'Due date is invalid' };
  }
  if (dueDate < issueDate) {
    return { isValid: false, error: 'Due date must be on or after issue date' };
  }
  return { isValid: true };
}

/**
 * Determine invoice status based on payment and due date
 * Logic: If balance due > 0 and due date has passed, mark as overdue
 */
export function determineInvoiceStatus(
  balanceDue: number,
  dueDate: Date,
  currentStatus: InvoiceStatus
): InvoiceStatus {
  // Cancelled invoices stay cancelled
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }

  // If fully paid
  if (balanceDue <= 0) {
    return 'paid';
  }

  // If balance due and due date has passed
  const now = new Date();
  if (balanceDue > 0 && now > dueDate) {
    return 'overdue';
  }

  // Keep current status if it's valid
  if (isValidStatus(currentStatus)) {
    return currentStatus;
  }

  // Default to sent for unpaid invoices
  return 'sent';
}

/**
 * Validate if a payment can be applied to an invoice
 */
export function validatePaymentAmount(
  paymentAmount: number,
  balanceDue: number
): { isValid: boolean; error?: string } {
  if (paymentAmount <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than zero' };
  }

  if (!Number.isFinite(paymentAmount)) {
    return { isValid: false, error: 'Payment amount must be a finite number' };
  }

  // Allow overpayment but warn
  if (paymentAmount > balanceDue) {
    return { isValid: true }; // Still valid, but caller might want to warn
  }

  return { isValid: true };
}

/**
 * Check if invoice can be deleted (only drafts)
 */
export function canDeleteInvoice(status: InvoiceStatus): boolean {
  return status === 'draft';
}

/**
 * Check if invoice can be edited
 * Only draft and sent invoices can be edited
 */
export function canEditInvoice(status: InvoiceStatus): boolean {
  return status === 'draft' || status === 'sent';
}

/**
 * Check if payment can be added to invoice
 */
export function canAddPayment(status: InvoiceStatus, balanceDue: number): boolean {
  if (status === 'cancelled' || status === 'paid' || balanceDue <= 0) {
    return false;
  }
  return true;
}

/**
 * Validate the discount amount against subtotal
 * Ensures discount doesn't exceed subtotal (unless explicitly allowed by business rules)
 */
export function validateDiscount(
  discountAmount: number,
  subtotal: number,
  allowExcess: boolean = false
): { isValid: boolean; error?: string } {
  if (discountAmount < 0) {
    return { isValid: false, error: 'Discount amount cannot be negative' };
  }

  if (!Number.isFinite(discountAmount)) {
    return { isValid: false, error: 'Discount amount must be a finite number' };
  }

  if (!allowExcess && discountAmount > subtotal) {
    return { isValid: false, error: 'Discount amount cannot exceed subtotal' };
  }

  return { isValid: true };
}

/**
 * Get user-friendly status label
 */
export function getStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  };
  return labels[status] || 'Unknown';
}

export type { InvoiceStatus };
export { VALID_STATUSES, STATUS_TRANSITIONS };
