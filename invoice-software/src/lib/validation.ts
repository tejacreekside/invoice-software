/**
 * Validation utilities for request payloads
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  return { valid: true };
}

export function validateString(value: unknown, fieldName: string, maxLength = 255): { valid: boolean; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.trim().length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }
  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }
  return { valid: true };
}

export function validateNumber(value: unknown, fieldName: string, min = 0, max = Infinity): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { valid: false, error: `${fieldName} must be a finite number` };
  }
  if (value < min || value > max) {
    return { valid: false, error: `${fieldName} must be between ${min} and ${max}` };
  }
  return { valid: true };
}

export function validateDate(value: unknown, fieldName: string): { valid: boolean; error?: string } {
  if (!(value instanceof Date) && typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a valid date` };
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) {
    return { valid: false, error: `${fieldName} is not a valid date` };
  }
  return { valid: true };
}

export function validateRequired<T>(value: T | null | undefined, fieldName: string): { valid: boolean; error?: string } {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}
