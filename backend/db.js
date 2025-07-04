import sqlite3 from 'sqlite3';

const sql3 = sqlite3.verbose();

const DB = new sql3.Database('./mydata.db', sqlite3.OPEN_READWRITE, connected);

function connected(err){
    if(err){
        ?
        console.log(err.message);
        return
    }
    console.log('Database connected.');
}

export {DB};