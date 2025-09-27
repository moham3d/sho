// Utility helper functions

/**
 * Generate a unique ID with prefix
 * @param {string} prefix - Prefix for the ID
 * @returns {string} - Generated unique ID
 */
function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate SSN format (14 digits)
 * @param {string} ssn - SSN to validate
 * @returns {boolean} - True if valid
 */
function isValidSSN(ssn) {
    return /^\d{14}$/.test(ssn);
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format datetime for display
 * @param {string|Date} datetime - Datetime to format
 * @returns {string} - Formatted datetime string
 */
function formatDateTime(datetime) {
    if (!datetime) return '';
    return new Date(datetime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calculate age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number} - Age in years
 */
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

/**
 * Sanitize string input
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
}

/**
 * Parse integer with default value
 * @param {string|number} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} - Parsed integer or default
 */
function parseIntWithDefault(value, defaultValue = 0) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse float with default value
 * @param {string|number} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} - Parsed float or default
 */
function parseFloatWithDefault(value, defaultValue = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Check if object is empty
 * @param {object} obj - Object to check
 * @returns {boolean} - True if empty
 */
function isEmpty(obj) {
    return obj == null || (typeof obj === 'object' && Object.keys(obj).length === 0);
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalize(str) {
    if (typeof str !== 'string' || str.length === 0) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generate medical number (simple implementation)
 * @returns {string} - Generated medical number
 */
function generateMedicalNumber() {
    return 'MED' + Date.now().toString().slice(-8);
}

module.exports = {
    generateId,
    isValidSSN,
    formatDate,
    formatDateTime,
    calculateAge,
    sanitizeString,
    parseIntWithDefault,
    parseFloatWithDefault,
    isEmpty,
    capitalize,
    generateMedicalNumber
};