/**
 * Error Handler Utility
 * 
 * Centralized error handling system for the VanillaForge.
 * Provides consistent error processing, user notifications, and error reporting.
 * 
 * @author VanillaForge Team
 * @version 3.0.0
 * @since 2025-06-14
 */

import { Logger } from './logger.js';
import { Notification } from './notification.js';

/**
 * Error types enum
 * @readonly
 * @enum {string}
 */
export const ErrorType = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NETWORK: 'network',
  DATABASE: 'database',
  SYSTEM: 'system',
  USER_INPUT: 'user_input',
  CONFIGURATION: 'configuration'
};

/**
 * Error severity levels
 * @readonly
 * @enum {string}
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error Handler class for centralized error management
 * 
 * Handles all application errors, provides user-friendly messages,
 * and manages error reporting and recovery strategies.
 */
export class ErrorHandler {  /**
   * Initialize the error handler
   */
  constructor(notification) {
    this.logger = new Logger('ErrorHandler');
    
    // Safely initialize notification system
    if (notification) {
      this.notification = notification;
    } else if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Only create Notification in browser environment
      this.notification = new Notification();
    } else {
      // Fallback for non-browser environments
      this.notification = {
        showToast: (message, type) => console.log(`[${type.toUpperCase()}] ${message}`),
        showModal: (title, message, options) => console.log(`[MODAL] ${title}: ${message}`)
      };
    }
    
    this.errorCounts = new Map();
    this.lastErrors = [];
    this.maxLastErrors = 10;
    this.logger.info('Error handler initialized');
  }
  /**
   * Handle application errors
   * 
   * @param {Error} error - The error object
   * @param {Object} [context={}] - Additional context about the error
   * @param {boolean} [showToUser=true] - Whether to show error to user
   * @returns {Object} Processed error information
   */
  handleError(error, context = {}, showToUser = true) {
    try {
      const errorInfo = this.createErrorInfo(error, context);
      
      this.logError(errorInfo);
      this.trackError(errorInfo);
      
      if (showToUser) {
        this.showUserNotification(errorInfo);
      }
      
      this.reportError(errorInfo);
      
      return errorInfo;
    } catch (handlingError) {
      this.logger.error('Error in error handler:', { error: handlingError, originalError: error });
      this.notification.showToast('An unexpected error occurred.', 'error');
      return this.createFallbackErrorInfo(error);
    }
  }

  /**
   * Create fallback error info when error handler fails
   * 
   * @private
   * @param {Error} error - Original error
   * @returns {Object} Fallback error information
   */
  createFallbackErrorInfo(error) {
    return {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: ErrorType.SYSTEM,
      severity: ErrorSeverity.HIGH,
      message: error?.message || 'Unknown error occurred',
      handled: false,
      fallback: true
    };
  }

  /**
   * Handle global errors (uncaught exceptions)
   * 
   * @param {Error} error - The error object
   * @param {Object} [context={}] - Additional context
   */
  handleGlobalError(error, context = {}) {
    const errorInfo = this.handleError(error, {
      ...context,
      global: true,
      severity: ErrorSeverity.HIGH
    }, true);
    
    this.logger.error('Global error caught', errorInfo);
  }

  /**
   * Create structured error information
   * 
   * @private
   * @param {Error} error - The error object
   * @param {Object} context - Additional context
   * @returns {Object} Structured error information
   */
  createErrorInfo(error, context) {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    // Determine error type
    const type = this.determineErrorType(error, context);
    
    // Determine severity
    const severity = this.determineSeverity(error, context, type);
    
    return {
      id: errorId,
      timestamp,
      type,
      severity,
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: timestamp
      },
      user: this.getCurrentUserContext(),
      handled: true
    };
  }

  /**
   * Determine error type based on error object and context
   * 
   * @private
   * @param {Error} error - The error object
   * @param {Object} context - Error context
   * @returns {string} Error type
   */
  determineErrorType(error, context) {
    // Check context type first
    if (context.type) {
      return context.type;
    }
    
    // Check error properties
    if (error?.code) {
      if (error.code.includes('auth/')) {
        return ErrorType.AUTHENTICATION;
      }
      if (error.code.includes('permission')) {
        return ErrorType.AUTHORIZATION;
      }
      if (error.code.includes('network') || error.code.includes('offline')) {
        return ErrorType.NETWORK;
      }
    }
    
    // Check error message
    const message = error?.message?.toLowerCase() || '';
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.AUTHORIZATION;
    }
    
    return ErrorType.SYSTEM;
  }

  /**
   * Determine error severity
   * 
   * @private
   * @param {Error} error - The error object
   * @param {Object} context - Error context
   * @param {string} type - Error type
   * @returns {string} Error severity
   */
  determineSeverity(error, context, type) {
    // Check context severity first
    if (context.severity) {
      return context.severity;
    }
    
    // Global errors are high severity
    if (context.global) {
      return ErrorSeverity.HIGH;
    }
    
    // Type-based severity
    switch (type) {
      case ErrorType.SYSTEM:
      case ErrorType.DATABASE:
        return ErrorSeverity.HIGH;
      case ErrorType.NETWORK:
      case ErrorType.AUTHENTICATION:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION:
      case ErrorType.USER_INPUT:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Log error information
   * 
   * @private
   * @param {Object} errorInfo - Structured error information
   */
  logError(errorInfo) {
    const logData = {
      errorId: errorInfo.id,
      type: errorInfo.type,
      severity: errorInfo.severity,
      message: errorInfo.message,
      context: errorInfo.context
    };
    
    // Log based on severity
    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        this.logger.error(`[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        this.logger.info(`[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`, logData);
        break;
    }
  }

  /**
   * Track error occurrence for analytics
   * 
   * @private
   * @param {Object} errorInfo - Structured error information
   */
  trackError(errorInfo) {
    // Count error occurrences
    const errorKey = `${errorInfo.type}:${errorInfo.message}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
    
    // Store recent errors
    this.lastErrors.unshift(errorInfo);
    if (this.lastErrors.length > this.maxLastErrors) {
      this.lastErrors = this.lastErrors.slice(0, this.maxLastErrors);
    }
  }

  showUserNotification(errorInfo) {
    const message = this.getUserFriendlyMessage(errorInfo);
    
    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        this.notification.showModal('Error', message, {
          details: JSON.stringify(errorInfo, null, 2),
          buttons: [
            { label: 'Report Issue', action: 'report', onClick: () => this.reportIssue(errorInfo) },
            { label: 'Close', action: 'close' }
          ]
        });
        break;
      case ErrorSeverity.MEDIUM:
        this.notification.showToast(message, 'error');
        break;
      case ErrorSeverity.LOW:
        this.notification.showToast(message, 'warning');
        break;
    }
  }

  /**
   * Get user-friendly error message
   * 
   * @private
   * @param {Object} errorInfo - Structured error information
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(errorInfo) {
    const messages = {
      [ErrorType.VALIDATION]: `Please check the ${errorInfo.context.field || 'input'} field and try again.`,
      [ErrorType.AUTHENTICATION]: 'Please sign in to continue.',
      [ErrorType.AUTHORIZATION]: "You don't have permission to perform this action.",
      [ErrorType.NETWORK]: 'Please check your internet connection and try again.',
      [ErrorType.DATABASE]: "We're experiencing technical difficulties. Please try again later.",
      [ErrorType.SYSTEM]: 'Something went wrong. Please try again later.',
      [ErrorType.USER_INPUT]: 'Invalid input provided. Please correct and try again.',
      [ErrorType.CONFIGURATION]: 'Configuration error. Please contact support.'
    };
    
    return messages[errorInfo.type] || messages[ErrorType.SYSTEM];
  }


  /**
   * Report error to external services
   * 
   * @private
   * @param {Object} errorInfo - Error information
   */
  async reportError(errorInfo) {
    try {
      // This would integrate with error reporting services like Sentry
      // For now, just store in localStorage
      
      const reports = JSON.parse(localStorage.getItem('ucm_error_reports') || '[]');
      reports.push(errorInfo);
      
      // Keep only last 50 reports
      if (reports.length > 50) {
        reports.shift();
      }
      
      localStorage.setItem('ucm_error_reports', JSON.stringify(reports));
      
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  /**
   * Report issue via user action
   * 
   * @private
   * @param {Object} errorInfo - Error information
   */
  reportIssue(errorInfo) {
    // This would open a support ticket or email
    const subject = `Error Report: ${errorInfo.type}`;
    const body = `Error ID: ${errorInfo.id}\nTimestamp: ${errorInfo.timestamp}\nMessage: ${errorInfo.message}\n\nTechnical Details:\n${JSON.stringify(errorInfo, null, 2)}`;
    
    const mailtoLink = `mailto:support@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  }

  /**
   * Get current user context for error reporting
   * 
   * @private
   * @returns {Object} User context
   */
  getCurrentUserContext() {
    try {
      // This would get actual user information
      return {
        authenticated: false, // Would check actual auth state
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { error: 'Failed to get user context' };
    }
  }

  /**
   * Generate unique error ID
   * 
   * @private
   * @returns {string} Unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   * 
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    return {
      totalErrors: this.lastErrors.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.lastErrors.slice(0, 5).map(err => ({
        id: err.id,
        type: err.type,
        severity: err.severity,
        timestamp: err.timestamp,
        message: err.message
      }))
    };
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorCounts.clear();
    this.lastErrors = [];
    localStorage.removeItem('ucm_error_reports');
    this.logger.info('Error history cleared');
  }
}
