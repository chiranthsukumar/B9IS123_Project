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