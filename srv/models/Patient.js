const { GENDER_OPTIONS } = require('../utils/constants');
const { calculateAge, formatDate } = require('../utils/helpers');

class Patient {
    constructor(data) {
        this.ssn = data.ssn;
        this.full_name = data.full_name;
        this.mobile_number = data.mobile_number;
        this.medical_number = data.medical_number;
        this.date_of_birth = data.date_of_birth;
        this.gender = data.gender;
        this.address = data.address;
        this.emergency_contact_name = data.emergency_contact_name;
        this.emergency_contact_phone = data.emergency_contact_phone;
        this.emergency_contact_relation = data.emergency_contact_relation;
        this.created_at = data.created_at;
    }

    // Get patient age
    getAge() {
        return calculateAge(this.date_of_birth);
    }

    // Get formatted date of birth
    getFormattedDateOfBirth() {
        return formatDate(this.date_of_birth);
    }

    // Get display gender
    getDisplayGender() {
        return this.gender || 'Not specified';
    }

    // Check if patient is male
    isMale() {
        return this.gender === GENDER_OPTIONS.MALE;
    }

    // Check if patient is female
    isFemale() {
        return this.gender === GENDER_OPTIONS.FEMALE;
    }

    // Get patient initials
    getInitials() {
        if (!this.full_name) return '';
        return this.full_name
            .split(' ')
            .map(name => name.charAt(0).toUpperCase())
            .join('');
    }

    // Get masked SSN for display
    getMaskedSSN() {
        if (!this.ssn || this.ssn.length < 4) return this.ssn;
        return '*'.repeat(this.ssn.length - 4) + this.ssn.slice(-4);
    }

    // Get full contact info
    getContactInfo() {
        const contacts = [];
        if (this.mobile_number) contacts.push(`Mobile: ${this.mobile_number}`);
        if (this.emergency_contact_name && this.emergency_contact_phone) {
            contacts.push(`Emergency: ${this.emergency_contact_name} (${this.emergency_contact_phone})`);
        }
        return contacts.join(', ');
    }

    // Convert to safe object
    toSafeObject() {
        return {
            ssn: this.ssn,
            full_name: this.full_name,
            mobile_number: this.mobile_number,
            medical_number: this.medical_number,
            date_of_birth: this.date_of_birth,
            gender: this.gender,
            address: this.address,
            emergency_contact_name: this.emergency_contact_name,
            emergency_contact_phone: this.emergency_contact_phone,
            emergency_contact_relation: this.emergency_contact_relation,
            created_at: this.created_at,
            age: this.getAge(),
            formatted_dob: this.getFormattedDateOfBirth()
        };
    }

    // Static method to create from database row
    static fromDatabaseRow(row) {
        return new Patient(row);
    }

    // Static method to validate patient data
    static validate(patientData) {
        const errors = [];

        if (!patientData.ssn || !this.isValidSSN(patientData.ssn)) {
            errors.push('Valid 14-digit SSN is required');
        }

        if (!patientData.full_name || patientData.full_name.trim().length < 2) {
            errors.push('Full name must be at least 2 characters long');
        }

        if (!patientData.medical_number || patientData.medical_number.trim().length < 3) {
            errors.push('Medical number must be at least 3 characters long');
        }

        if (!patientData.date_of_birth || !this.isValidDateOfBirth(patientData.date_of_birth)) {
            errors.push('Valid date of birth is required');
        }

        if (!patientData.gender || !Object.values(GENDER_OPTIONS).includes(patientData.gender)) {
            errors.push('Valid gender is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Static helper method to validate SSN
    static isValidSSN(ssn) {
        return /^\d{14}$/.test(ssn);
    }

    // Static helper method to validate date of birth
    static isValidDateOfBirth(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        
        return date instanceof Date && !isNaN(date) && date <= now && age <= 150;
    }
}

module.exports = Patient;