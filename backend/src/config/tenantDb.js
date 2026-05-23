const { Pool } = require('pg');
require('dotenv').config();

const tenantPool = new Pool({
    connectionString: process.env.TENANT_BURGERCO_DB_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = tenantPool; 

