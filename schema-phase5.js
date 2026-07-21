const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runPhase5() {
  const connection = await mysql.createConnection({
    host:               process.env.DB_HOST     || 'localhost',
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'waste2worth',
    multipleStatements: true
  });

  console.log('Connected. Running Phase-5 migration...\n');

  try {
    const schemaSql = fs.readFileSync(
      path.join(__dirname, 'schema-phase5.sql'),
      'utf8'
    );
    await connection.query(schemaSql);
    console.log('  ✓ UpcycledCrafts table extended with creationDate and careInstructions');
  } catch (err) {
    if (err.errno === 1060) {
      console.log('  ✓ UpcycledCrafts table already has the new columns');
    } else {
      throw err;
    }
  }

  await connection.end();
  console.log('\n✅ Phase-5 migration complete.\n');
  process.exit(0);
}

runPhase5().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
