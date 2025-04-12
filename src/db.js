
// chat-backend/db.js
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_jLiasfem92WN@ep-broad-poetry-a55ul0er-pooler.us-east-2.aws.neon.tech/Chat";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false, 
  },
});

module.exports = pool;