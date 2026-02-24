const { Pool } = require("pg");
require("dotenv").config();


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to PostgreSQL:", err.message);
  } else {
    console.log("PostgreSQL connected successfully");
    release();
  }
});

module.exports = pool;
