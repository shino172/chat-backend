// src/db.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: "neondb_owner",
  host: "ep-broad-poetry-a55ul0er-pooler.us-east-2.aws.neon.tech",
  database: "Chat",
  password: "npg_jLiasfem92WN",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});
pool.on("connect", () => {
  console.log("Connected to the database");
});

pool.on("error", (err) => {
  console.error("Database error:", err.stack);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
