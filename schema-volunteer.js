/**
 * Apply the Volunteer Registration System schema migration.
 * Run: node schema-volunteer.js
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('./config/db');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema-volunteer.sql'), 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      await pool.execute(stmt);
      console.log('✔ Executed:', stmt.substring(0, 60).replace(/\n/g, ' '), '...');
    }

    console.log('\n✅ Volunteer schema migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
