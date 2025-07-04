import sqlite3 from 'sqlite3';

const sql3 = sqlite3.verbose();

const dbPath = path.join(__dirname, 'mydata.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error while opening databse:', err.message);
    }
    else{
        console.log('Connnected to database');
    }
});

function initializeTables(){
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating customers table:', err.message);
        }
    });
}