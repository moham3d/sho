// Data validation functions

const { USER_ROLES, GENDER_OPTIONS, DEPARTMENTS, VISIT_TYPES } = require('./constants');

/**
 * Validate user data
 * @param {object} userData - User data to validate
 * @returns {object} - Validation result {isValid, errors}
 */
function validateUser(userData) {
    const errors = [];
    
    if (!userData.username || userData.username.trim().length < 3) {
        errors.push('Username must be at least 3 characters long');
    }
    
    if (!userData.email || !isValidEmail(userData.email)) {
        errors.push('Valid email is required');
    }
    
    if (!userData.full_name || userData.full_name.trim().length < 2) {
        errors.push('Full name must be at least 2 characters long');
    }
    
    if (!userData.role || !Object.values(USER_ROLES).includes(userData.role)) {
        errors.push('Valid role is required');
    }
    
    if (userData.password && userData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate patient data
 * @param {object} patientData - Patient data to validate
 * @returns {object} - Validation result {isValid, errors}
 */
function validatePatient(patientData) {
    const errors = [];
    
    if (!patientData.ssn || !isValidSSN(patientData.ssn)) {
        errors.push('Valid 14-digit SSN is required');
    }
    
    if (!patientData.full_name || patientData.full_name.trim().length < 2) {
        errors.push('Full name must be at least 2 characters long');
    }
    
    if (!patientData.medical_number || patientData.medical_number.trim().length < 3) {
        errors.push('Medical number must be at least 3 characters long');
    }
    
    if (!patientData.date_of_birth || !isValidDateOfBirth(patientData.date_of_birth)) {
        errors.push('Valid date of birth is required');
    }
    
    if (!patientData.gender || !Object.values(GENDER_OPTIONS).includes(patientData.gender)) {
        errors.push('Valid gender is required');
    }
    
    if (patientData.mobile_number && !isValidPhoneNumber(patientData.mobile_number)) {
        errors.push('Valid mobile number is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate visit data
 * @param {object} visitData - Visit data to validate
 * @returns {object} - Validation result {isValid, errors}
 */
function validateVisit(visitData) {
    const errors = [];
    
    if (!visitData.patient_ssn || !isValidSSN(visitData.patient_ssn)) {
        errors.push('Valid patient SSN is required');
    }
    
    if (!visitData.visit_date || !isValidDate(visitData.visit_date)) {
        errors.push('Valid visit date is required');
    }
    
    if (!visitData.visit_type || !Object.values(VISIT_TYPES).includes(visitData.visit_type)) {
        errors.push('Valid visit type is required');
    }
    
    if (!visitData.department || !Object.values(DEPARTMENTS).includes(visitData.department)) {
        errors.push('Valid department is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate nursing assessment data
 * @param {object} assessmentData - Assessment data to validate
 * @returns {object} - Validation result {isValid, errors}
 */
function validateNursingAssessment(assessmentData) {
    const errors = [];
    
    if (!assessmentData.visit_id) {
        errors.push('Visit ID is required');
    }
    
    if (!assessmentData.chief_complaint || assessmentData.chief_complaint.trim().length < 5) {
        errors.push('Chief complaint must be at least 5 characters long');
    }
    
    if (!assessmentData.age || assessmentData.age < 0 || assessmentData.age > 120) {
        errors.push('Valid age is required (0-120)');
    }
    
    // Validate vital signs if provided
    if (assessmentData.temperature_celsius && (assessmentData.temperature_celsius < 30 || assessmentData.temperature_celsius > 45)) {
        errors.push('Temperature must be between 30-45°C');
    }
    
    if (assessmentData.pulse_bpm && (assessmentData.pulse_bpm < 40 || assessmentData.pulse_bpm > 200)) {
        errors.push('Pulse must be between 40-200 BPM');
    }
    
    if (assessmentData.blood_pressure_systolic && (assessmentData.blood_pressure_systolic < 60 || assessmentData.blood_pressure_systolic > 300)) {
        errors.push('Systolic BP must be between 60-300 mmHg');
    }
    
    if (assessmentData.blood_pressure_diastolic && (assessmentData.blood_pressure_diastolic < 30 || assessmentData.blood_pressure_diastolic > 200)) {
        errors.push('Diastolic BP must be between 30-200 mmHg');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate radiology assessment data
 * @param {object} radiologyData - Radiology data to validate
 * @returns {object} - Validation result {isValid, errors}
 */
function validateRadiologyAssessment(radiologyData) {
    const errors = [];
    
    if (!radiologyData.examination_type || radiologyData.examination_type.trim().length < 3) {
        errors.push('Examination type must be at least 3 characters long');
    }
    
    if (!radiologyData.clinical_history || radiologyData.clinical_history.trim().length < 10) {
        errors.push('Clinical history must be at least 10 characters long');
    }
    
    if (!radiologyData.patient_consent || radiologyData.patient_consent.trim().length < 5) {
        errors.push('Patient consent information is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
function isValidPhoneNumber(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validate date format and value
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid
 */
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * Validate date of birth (not in future, reasonable age)
 * @param {string} dateString - Date of birth to validate
 * @returns {boolean} - True if valid
 */
function isValidDateOfBirth(dateString) {
    if (!isValidDate(dateString)) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    
    return date <= now && age <= 150;
}

/**
 * Sanitize and validate text input
 * @param {string} text - Text to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {object} - {isValid, sanitized, errors}
 */
function validateText(text, minLength = 0, maxLength = 1000) {
    const errors = [];
    let sanitized = '';
    
    if (typeof text !== 'string') {
        errors.push('Text must be a string');
    } else {
        sanitized = text.trim().replace(/[<>]/g, '');
        
        if (sanitized.length < minLength) {
            errors.push(`Text must be at least ${minLength} characters long`);
        }
        
        if (sanitized.length > maxLength) {
            errors.push(`Text must be no more than ${maxLength} characters long`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        sanitized,
        errors
    };
}

module.exports = {
    validateUser,
    validatePatient,
    validateVisit,
    validateNursingAssessment,
    validateRadiologyAssessment,
    isValidEmail,
    isValidSSN,
    isValidPhoneNumber,
    isValidDate,
    isValidDateOfBirth,
    validateText
};