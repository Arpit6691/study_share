/**
 * Validation Utility for Authentication
 */

const BLOCKED_DOMAINS = [
  "tempmail.com", 
  "10minutemail.com", 
  "mailinator.com",
  "guerrillamail.com",
  "yopmail.com"
];

/**
 * Validates email format and blocks disposable domains
 */
const validateEmail = (email) => {
  if (!email) return { valid: false, message: "Email is required" };
  
  // Standard Regex for Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email format" };
  }

  // Block disposable domains
  const domain = email.split('@')[1].toLowerCase();
  if (BLOCKED_DOMAINS.includes(domain)) {
    return { valid: false, message: "Registration with temporary/disposable emails is not allowed" };
  }

  return { valid: true };
};

/**
 * Validates password strength
 * Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
const validatePassword = (password) => {
  if (!password) return { valid: false, message: "Password is required" };
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters long` };
  }
  if (!hasUpperCase) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!hasLowerCase) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!hasNumber) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: "Password must contain at least one special character" };
  }

  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword
};
