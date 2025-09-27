const db = require('../config/database');
const bcrypt = require('bcrypt');

class UserService {
    // Get all users with filters
    static getUsers(filters = {}) {
        return new Promise((resolve, reject) => {
            const { search, role, status } = filters;

            let sql = `
                SELECT user_id, username, email, full_name, role, is_active, created_at
                FROM users
                WHERE 1=1
            `;

            const params = [];

            if (search) {
                sql += ` AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (role && role !== 'all') {
                sql += ` AND role = ?`;
                params.push(role);
            }

            if (status && status !== 'all') {
                if (status === 'active') {
                    sql += ` AND is_active = 1`;
                } else if (status === 'inactive') {
                    sql += ` AND is_active = 0`;
                }
            }

            sql += ` ORDER BY created_at DESC`;

            db.all(sql, params, (err, users) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(users || []);
                }
            });
        });
    }

    // Get user by ID
    static getUserById(userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT user_id, username, email, full_name, role, is_active, created_at FROM users WHERE user_id = ?', 
                [userId], (err, user) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            });
        });
    }

    // Create new user
    static createUser(userData) {
        return new Promise(async (resolve, reject) => {
            try {
                const { username, email, full_name, role, password } = userData;
                
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);
                
                db.run(`
                    INSERT INTO users (username, email, full_name, role, password_hash, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
                `, [username, email, full_name, role, hashedPassword], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ userId: this.lastID });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Update user
    static updateUser(userId, userData) {
        return new Promise(async (resolve, reject) => {
            try {
                const { username, email, full_name, role, password, is_active } = userData;
                
                let sql = `
                    UPDATE users 
                    SET username = ?, email = ?, full_name = ?, role = ?, is_active = ?
                `;
                let params = [username, email, full_name, role, is_active];

                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    sql += `, password_hash = ?`;
                    params.push(hashedPassword);
                }

                sql += ` WHERE user_id = ?`;
                params.push(userId);

                db.run(sql, params, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Delete user
    static deleteUser(userId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM users WHERE user_id = ?', [userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Get user counts for dashboard
    static getUserCount() {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.count);
                }
            });
        });
    }
}

module.exports = UserService;