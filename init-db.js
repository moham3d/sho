const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

const schemaPath = path.join(__dirname, 'docs', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, async (err) => {
    if (err) {
        console.error('Error executing schema:', err.message);
    } else {
        console.log('Database schema created successfully.');

        // Create admin user
        try {
            const adminPassword = 'admin';
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO users (user_id, username, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
                    ['admin-uuid', 'admin', 'mohamed.hussein@example.com', 'Administrator', 'admin', hashedPassword],
                    function(err) {
                        if (err) {
                            console.error('Error creating admin user:', err.message);
                            reject(err);
                        } else {
                            console.log('✓ Admin user created successfully.');
                            resolve();
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error hashing admin password:', error);
        }
    }
    db.close();
});