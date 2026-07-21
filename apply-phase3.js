const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    
    const schema = fs.readFileSync('schema-phase3.sql', 'utf8');
    console.log('Executing phase 3 schema...');
    await connection.query(schema);
    console.log('Phase 3 schema executed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to execute phase 3 schema:', err);
    process.exit(1);
  }
}
runSchema();
