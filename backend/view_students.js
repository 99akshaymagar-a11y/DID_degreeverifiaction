import sqlite3 from "sqlite3";
const dbPath = "./db/database.sqlite";
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM Student LIMIT 5;", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("First 5 Students:", rows);
  }
  db.close();
});
