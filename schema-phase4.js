const fs   = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();


async function runPhase4() {
  const connection = await mysql.createConnection({
    host:               process.env.DB_HOST     || 'localhost',
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'waste2worth',
    multipleStatements: true
  });

  console.log('Connected. Running Phase-4 migration...\n');

  const schemaSql = fs.readFileSync(
    path.join(__dirname, 'schema-phase4.sql'),
    'utf8'
  );
  await connection.query(schemaSql);
  console.log('  ✓ CreatorProfiles table created / verified');

  await connection.end();
  console.log('\n✅ Phase-4 migration complete.\n');
  process.exit(0);
}

runPhase4().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
