const pool = require('../config/db');

async function check() {
  try {
    const [rows] = await pool.query("SELECT id, name, role FROM Users WHERE role='Creator'");
    console.log('Creators in DB:', rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
