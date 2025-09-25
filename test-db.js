const sqlite3 = require('sqlite3').verbose();

console.log('Testing database connection...');

const db = new sqlite3.Database('./radiology_backup.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database.');
        db.close();
        console.log('Database connection test successful.');
    }
});