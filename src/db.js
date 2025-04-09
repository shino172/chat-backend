// src/db.js
// const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
// });

// pool.on('connect', () => {
//   console.log('Connected to the database');
// });

// pool.on('error', (err) => {
//   console.error('Database error:', err.stack);
// });

// module.exports = {
//   query: (text, params) => pool.query(text, params),
// };
// chat-backend/db.js
const { Pool } = require("pg");
require("dotenv").config();

// Chuỗi kết nối đến Neon
const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_jLiasfem92WN@ep-broad-poetry-a55ul0er-pooler.us-east-2.aws.neon.tech/Chat";

// Cấu hình Pool để kết nối với Neon
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false, // Bật SSL và bỏ qua kiểm tra chứng chỉ (cần thiết cho Neon)
  },
});

module.exports = pool;