const validator = require('validator');
const logger = require('./logger');

/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validate Email
 */
const validateEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Validate URL
 */
const validateUrl = (url) => {
  return validator.isURL(url);
};

/**
 * Sanitize Input
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.trim(input);
  }
  return input;
};

/**
 * Escape HTML
 */
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Generate Random String
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Paginate Query Results
 */
const paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.max(parseInt(limit) || 10, 1);
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

/**
 * Format Response
 */
const formatResponse = (success, message, data = null, error = null) => {
  return {
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  AppError,
  validateEmail,
  validateUrl,
  sanitizeInput,
  escapeHtml,
  generateRandomString,
  paginate,
  formatResponse,
};
