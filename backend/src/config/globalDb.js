const { Pool } = require('pg');
require('dotenv').config();

const globalPool = new Pool({
    connectionString: process.env.GLOBAL_DB_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = globalPool;