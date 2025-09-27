// Application constants

// User roles
const USER_ROLES = {
    ADMIN: 'admin',
    NURSE: 'nurse',
    PHYSICIAN: 'physician'
};

// Visit statuses
const VISIT_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Form submission statuses
const SUBMISSION_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted'
};

// Assessment types
const ASSESSMENT_TYPES = {
    NURSING: 'nursing',
    RADIOLOGY: 'radiology'
};

// Form IDs
const FORM_IDS = {
    NURSING_ASSESSMENT: 'form-05-uuid',
    RADIOLOGY_FORM: 'radiology-form'
};

// Morse Fall Risk Levels
const MORSE_RISK_LEVELS = {
    LOW: 'Low Risk',
    MODERATE: 'Moderate Risk',
    HIGH: 'High Risk'
};

// Gender options
const GENDER_OPTIONS = {
    MALE: 'Male',
    FEMALE: 'Female'
};

// Department options
const DEPARTMENTS = {
    EMERGENCY: 'Emergency',
    OUTPATIENT: 'Outpatient',
    INPATIENT: 'Inpatient',
    RADIOLOGY: 'Radiology',
    SURGERY: 'Surgery'
};

// Visit types
const VISIT_TYPES = {
    EMERGENCY: 'Emergency',
    SCHEDULED: 'Scheduled',
    FOLLOW_UP: 'Follow-up',
    CONSULTATION: 'Consultation'
};

// Notification types
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Legacy export for backward compatibility
const ROLES = ['admin', 'nurse', 'physician'];

module.exports = {
    USER_ROLES,
    VISIT_STATUS,
    SUBMISSION_STATUS,
    ASSESSMENT_TYPES,
    FORM_IDS,
    MORSE_RISK_LEVELS,
    GENDER_OPTIONS,
    DEPARTMENTS,
    VISIT_TYPES,
    NOTIFICATION_TYPES,
    ROLES // Legacy
};