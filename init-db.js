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

db.exec(schema, (err) => {
    if (err) {
        console.error('Error executing schema:', err.message);
    } else {
        console.log('Database schema created successfully.');

        const users = [
            { id: 'admin-uuid', username: 'admin', email: 'admin@example.com', fullName: 'Administrator', role: 'admin', password: 'admin' },
            { id: 'nurse-uuid', username: 'nurse', email: 'nurse@example.com', fullName: 'Nurse One', role: 'nurse', password: 'nurse' },
            { id: 'physician-uuid', username: 'doctor', email: 'doctor@example.com', fullName: 'Dr. Physician', role: 'physician', password: 'doctor' }
        ];

        users.forEach(user => {
            const hash = bcrypt.hashSync(user.password, 10);
            db.run('INSERT INTO users (user_id, username, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
                [user.id, user.username, user.email, user.fullName, user.role, hash], (err) => {
                    if (err) {
                        console.error('Error inserting user:', err);
                    } else {
                        console.log(`User ${user.username} inserted successfully.`);
                    }
                });
        });
    }
    setTimeout(() => db.close(), 2000);
});