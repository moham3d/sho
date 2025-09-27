const { USER_ROLES } = require('../utils/constants');
const bcrypt = require('bcrypt');

class User {
    constructor(data) {
        this.user_id = data.user_id;
        this.username = data.username;
        this.email = data.email;
        this.full_name = data.full_name;
        this.role = data.role;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.password_hash = data.password_hash;
    }

    // Check if user is admin
    isAdmin() {
        return this.role === USER_ROLES.ADMIN;
    }

    // Check if user is nurse
    isNurse() {
        return this.role === USER_ROLES.NURSE;
    }

    // Check if user is physician
    isPhysician() {
        return this.role === USER_ROLES.PHYSICIAN;
    }

    // Check if user is active
    isActive() {
        return this.is_active === 1;
    }

    // Verify password
    async verifyPassword(password) {
        if (!this.password_hash) return false;
        return await bcrypt.compare(password, this.password_hash);
    }

    // Get display role
    getDisplayRole() {
        switch (this.role) {
            case USER_ROLES.ADMIN:
                return 'Administrator';
            case USER_ROLES.NURSE:
                return 'Nurse';
            case USER_ROLES.PHYSICIAN:
                return 'Physician';
            default:
                return 'Unknown';
        }
    }

    // Get user initials
    getInitials() {
        if (!this.full_name) return '';
        return this.full_name
            .split(' ')
            .map(name => name.charAt(0).toUpperCase())
            .join('');
    }

    // Convert to safe object (without password)
    toSafeObject() {
        return {
            user_id: this.user_id,
            username: this.username,
            email: this.email,
            full_name: this.full_name,
            role: this.role,
            is_active: this.is_active,
            created_at: this.created_at
        };
    }

    // Convert to session object
    toSessionObject() {
        return {
            userId: this.user_id,
            username: this.username,
            fullName: this.full_name,
            role: this.role,
            isActive: this.is_active
        };
    }

    // Static method to create from database row
    static fromDatabaseRow(row) {
        return new User(row);
    }

    // Static method to validate user data
    static validate(userData) {
        const errors = [];

        if (!userData.username || userData.username.trim().length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (!userData.email || !this.isValidEmail(userData.email)) {
            errors.push('Valid email is required');
        }

        if (!userData.full_name || userData.full_name.trim().length < 2) {
            errors.push('Full name must be at least 2 characters long');
        }

        if (!userData.role || !Object.values(USER_ROLES).includes(userData.role)) {
            errors.push('Valid role is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Static helper method to validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

module.exports = User;