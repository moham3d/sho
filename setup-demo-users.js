const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./radiology.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

async function createDemoUsers() {
    const demoUsers = [
        {
            user_id: 'user-admin-001',
            username: 'admin',
            email: 'admin@alshorouk.com',
            full_name: 'System Administrator',
            role: 'admin',
            password: 'admin'
        },
        {
            user_id: 'user-nurse-001',
            username: 'nurse',
            email: 'nurse@alshorouk.com',
            full_name: 'Head Nurse',
            role: 'nurse',
            password: 'nurse'
        },
        {
            user_id: 'user-doctor-001',
            username: 'doctor',
            email: 'doctor@alshorouk.com',
            full_name: 'Chief Physician',
            role: 'physician',
            password: 'doctor'
        }
    ];

    for (const user of demoUsers) {
        try {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            db.run(
                'INSERT OR REPLACE INTO users (user_id, username, email, full_name, role, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [user.user_id, user.username, user.email, user.full_name, user.role, hashedPassword, 1],
                function(err) {
                    if (err) {
                        console.error(`Error creating user ${user.username}:`, err.message);
                    } else {
                        console.log(`Demo user ${user.username} created/updated successfully.`);
                    }
                }
            );
        } catch (error) {
            console.error(`Error hashing password for ${user.username}:`, error);
        }
    }

    // Close database after a short delay to allow async operations to complete
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
                console.log('Demo users setup complete!');
                console.log('You can now login with:');
                console.log('- Username: admin, Password: admin');
                console.log('- Username: nurse, Password: nurse');
                console.log('- Username: doctor, Password: doctor');
            }
        });
    }, 1000);
}

createDemoUsers();