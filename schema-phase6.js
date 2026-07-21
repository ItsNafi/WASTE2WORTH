const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function runPhase6() {
  const connection = await mysql.createConnection({
    host:               process.env.DB_HOST     || 'localhost',
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'waste2worth',
    multipleStatements: true
  });

  console.log('Connected. Running Phase-6 migration...\n');

  
  try {
    const schemaSql = fs.readFileSync(
      path.join(__dirname, 'schema-phase6.sql'),
      'utf8'
    );
    await connection.query(schemaSql);
    console.log('  ✓ UpcycledCrafts table altered with rich product story columns');
  } catch (err) {
    if (err.errno === 1060) {
      console.log('  ✓ Table already contains the rich product story columns (ignoring)');
    } else {
      throw err;
    }
  }

  
  const email = 'rahim@crafts.com';
  const [userRows] = await connection.execute('SELECT id FROM Users WHERE email = ?', [email]);
  let creatorId;

  if (userRows.length > 0) {
    creatorId = userRows[0].id;
    console.log(`  ✓ Seed creator exists (ID: ${creatorId})`);
  } else {
    const hashedPassword = await bcrypt.hash('pass123', 10);
    const [insertResult] = await connection.execute(
      `INSERT INTO Users (name, email, password, role, greenPoints) 
       VALUES (?, ?, ?, ?, ?)`,
      ['Rahim Crafts', email, hashedPassword, 'Creator', 150]
    );
    creatorId = insertResult.insertId;
    console.log(`  ✓ Seed creator "Rahim Crafts" created (ID: ${creatorId})`);

    
    await connection.execute(
      `INSERT INTO CreatorProfiles (creatorId, bio, story, avatarUrl) 
       VALUES (?, ?, ?, ?)`,
      [
        creatorId, 
        'Dhaka-based artisan specializing in converting plastic and glass waste into functional home goods.', 
        'My upcycling journey began in 2024 when I witnessed the massive plastic accumulation in Dhanmondi Lake. I decided to use my background in metal and wood shaping to mold discarded plastic and cut bottles into usable artwork.',
        null
      ]
    );
    console.log(`  ✓ Creator profile seeded for Rahim Crafts`);
  }

  
  const seedCrafts = [
    {
      title: 'Upcycled Plastic Chair',
      price: 1500.00,
      inventoryCount: 5,
      storyNarrative: 'This chair is a solid statement piece made from post-consumer plastic bottles. Every chair prevents trash from entering our oceans.',
      careInstructions: 'Wipe with a damp cloth. Keep away from extreme direct heat.',
      creationDate: '2026-06-15',
      origin: 'Dhanmondi Cleanup Campaign',
      materialsUsed: 'Plastic Bottles',
      transformation: 'Plastic bottles were cleaned, shredded, melted, and molded into this durable, comfortable chair.',
      unitsRecycled: 48,
      wasteKgDiverted: 12.00,
      environmentalNote: 'Saves landfill space and prevents marine pollution.'
    },
    {
      title: 'Denim Patchwork Tote Bag',
      price: 450.00,
      inventoryCount: 10,
      storyNarrative: 'A rugged, stylish tote bag made entirely from discarded blue jeans collected during textile waste drives.',
      careInstructions: 'Machine washable in cold water. Air dry.',
      creationDate: '2026-07-01',
      origin: 'Mirpur Textile Waste Drive',
      materialsUsed: 'Discarded Blue Jeans',
      transformation: 'Discarded denim jeans were washed, cut into patches, and hand-sewn with reinforced lining into a sturdy tote bag.',
      unitsRecycled: 2,
      wasteKgDiverted: 1.50,
      environmentalNote: 'Reduces water footprint and chemical waste associated with new denim production.'
    },
    {
      title: 'Glass Bottle Pendant Lamp',
      price: 850.00,
      inventoryCount: 3,
      storyNarrative: 'An elegant, warm-toned hanging lamp made from recycled glass beverage bottles collected from local food carts.',
      careInstructions: 'Dust with a dry microfibre cloth. Turn off electricity before cleaning.',
      creationDate: '2026-07-10',
      origin: 'Gulshan Food Cart Sourcing',
      materialsUsed: 'Glass Beverage Bottles',
      transformation: 'Glass bottles were cut, flame-polished, and wired with a standard bulb socket and vintage fabric cord.',
      unitsRecycled: 5,
      wasteKgDiverted: 2.20,
      environmentalNote: 'Reduces carbon emissions associated with melting new glass.'
    }
  ];

  for (const craft of seedCrafts) {
    const [existing] = await connection.execute(
      'SELECT craftId FROM UpcycledCrafts WHERE creatorId = ? AND title = ?',
      [creatorId, craft.title]
    );

    if (existing.length === 0) {
      await connection.execute(
        `INSERT INTO UpcycledCrafts (
          creatorId, title, price, inventoryCount, storyNarrative, careInstructions, 
          creationDate, origin, materialsUsed, transformation, unitsRecycled, wasteKgDiverted, environmentalNote
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          creatorId, craft.title, craft.price, craft.inventoryCount, craft.storyNarrative, craft.careInstructions,
          craft.creationDate, craft.origin, craft.materialsUsed, craft.transformation, craft.unitsRecycled,
          craft.wasteKgDiverted, craft.environmentalNote
        ]
      );
      console.log(`  ✓ Seeded craft: "${craft.title}"`);
    } else {
      console.log(`  ✓ Craft: "${craft.title}" already exists (skipping seed)`);
    }
  }

  await connection.end();
  console.log('\n✅ Phase-6 migration and seeding complete.\n');
  process.exit(0);
}

runPhase6().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
