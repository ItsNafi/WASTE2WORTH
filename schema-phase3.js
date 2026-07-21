const fs   = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();


async function runPhase3() {
  const connection = await mysql.createConnection({
    host:               process.env.DB_HOST     || 'localhost',
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'waste2worth',
    multipleStatements: true
  });

  console.log('Connected. Running Phase-3 migration...\n');

  
  const alterStatements = [
    {
      sql:  'ALTER TABLE CleanupCampaigns ADD COLUMN organizerId INT NULL AFTER campaignId',
      desc: 'Add organizerId to CleanupCampaigns'
    },
    {
      sql:  'ALTER TABLE CleanupCampaigns ADD COLUMN location VARCHAR(255) NULL AFTER boundaryZone',
      desc: 'Add location to CleanupCampaigns'
    },
    {
      sql:  'ALTER TABLE CleanupCampaigns ADD CONSTRAINT fk_campaign_organizer FOREIGN KEY (organizerId) REFERENCES Users(id) ON DELETE SET NULL',
      desc: 'Add FK fk_campaign_organizer'
    }
  ];

  for (const { sql, desc } of alterStatements) {
    try {
      await connection.query(sql);
      console.log(`  ✓ ${desc}`);
    } catch (err) {
      
      if ([1060, 1061, 1826, 121, 1022, 1005].includes(err.errno)) {
        console.log(`  ↷ SKIP (already exists): ${desc}`);
      } else {
        await connection.end();
        throw err;
      }
    }
  }

  
  const schemaSql = fs.readFileSync(
    path.join(__dirname, 'schema-phase3.sql'),
    'utf8'
  );
  await connection.query(schemaSql);
  console.log('\n  ✓ WasteLogs table created / verified');
  console.log('  ✓ WasteRequests table created / verified');

  await connection.end();
  console.log('\n✅ Phase-3 migration complete.\n');
  process.exit(0);
}

runPhase3().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
