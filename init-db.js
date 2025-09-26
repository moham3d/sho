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
    }
    db.close();
});