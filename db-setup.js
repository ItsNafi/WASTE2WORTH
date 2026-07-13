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
    
    const schema = fs.readFileSync('schema-phase2.sql', 'utf8');
    console.log('Executing schema...');
    await connection.query(schema);
    console.log('Schema executed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}
runSchema();
