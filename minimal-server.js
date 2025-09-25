const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

console.log('Starting minimal server...');

// Database setup
const db = new sqlite3.Database('c:\\Users\\Mohamed\\Desktop\\sho\\test.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database.');
    }
});

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});