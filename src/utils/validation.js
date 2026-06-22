/**
 * Validation Utilities
 * 
 * This module provides comprehensive validation functions for the VanillaForge.
 * It includes validation for user input, data integrity, business rules, and security.
 * 
 * Features:
 * - Email validation
 * - Phone number validation
 * - Currency amount validation
 * - Date validation
 * - String sanitization
 * - Business rule validation
 * - Security validation
 * 
 * @author VanillaForge Team
 * @version 3.0.0
 * @since 2024-06-14
 */

import { Logger } from './logger.js';
import * as Validators from './validators.js';

export class ValidationUtils {
    constructor(logger) {
        this.logger = logger || new Logger('ValidationUtils');
        this.validators = {
            email: Validators.validateEmail,
            phone: Validators.validatePhoneNumber,
            currency: Validators.validateCurrencyAmount,
            // Add other validators here
        };
    }

    validate(type, value, options) {
        const validator = this.validators[type];
        if (!validator) {
            this.logger.warn(`Validator for type "${type}" not found.`);
            return { isValid: true, sanitized: value, errors: [] };
        }
        try {
            return validator(value, options);
        } catch (error) {
            this.logger.error(`Validation failed for type "${type}"`, { error, value });
            return { isValid: false, errors: ['Validation failed due to an unexpected error.'] };
        }
    }

    validateFields(data, rules) {
        const result = {
            isValid: true,
            errors: {},
            sanitized: {}
        };

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            const fieldResult = this.validate(rule.type, value, rule.options);

            if (!fieldResult.isValid) {
                result.isValid = false;
                result.errors[field] = fieldResult.errors;
            } else {
                result.sanitized[field] = fieldResult.sanitized;
            }
        }

        return result;
    }
}
