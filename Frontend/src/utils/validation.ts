/**
 * Validation utilities với regex patterns
 */

// Regex patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, // Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
  phone: /^(0|\+84)[0-9]{9,10}$/, // Vietnamese phone format
  name: /^[a-zA-ZÀ-ỹ\s]{2,50}$/, // Vietnamese names with accents, 2-50 chars
};

// Validation functions
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!VALIDATION_PATTERNS.email.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true };
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  if (!VALIDATION_PATTERNS.password.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }
  if (!VALIDATION_PATTERNS.phone.test(phone)) {
    return { isValid: false, error: 'Please enter a valid phone number (e.g., 0901234567)' };
  }
  return { isValid: true };
};

export const validateName = (name: string, fieldName: string = 'Name'): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }
  if (!VALIDATION_PATTERNS.name.test(name)) {
    return { isValid: false, error: `${fieldName} can only contain letters and spaces` };
  }
  return { isValid: true };
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  return { isValid: true };
};
