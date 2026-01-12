/**
 * Seed Multi-Tenant Demo Data
 * Creates a default tenant and seeds demo transaction data
 */

import mysql from 'mysql2/promise';

async function seedData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  console.log('Connecting to database...');
  const connection = await mysql.createConnection(databaseUrl);

  try {
    // Get or create default tenant
    console.log('\n📊 Checking for existing tenant...');
    let [tenants] = await connection.query(`SELECT id FROM tenants WHERE subdomain = 'demo' LIMIT 1`);
    let tenantId;
    
    if (tenants.length > 0) {
      tenantId = tenants[0].id;
      console.log(`✓ Using existing tenant (ID: ${tenantId})`);
    } else {
      const [tenantResult] = await connection.query(`
        INSERT INTO tenants (name, subdomain, status, subscriptionTier, settings)
        VALUES ('Demo Brokerage', 'demo', 'active', 'professional', '{}')
      `);
      tenantId = tenantResult.insertId;
      console.log(`✓ Created tenant: Demo Brokerage (ID: ${tenantId})`);
    }

    // Get or create demo user
    console.log('\n👤 Checking for existing user...');
    const ownerOpenId = process.env.OWNER_OPEN_ID || 'demo-user-123';
    let [users] = await connection.query(`SELECT id FROM users WHERE tenantId = ? AND openId = ? LIMIT 1`, [tenantId, ownerOpenId]);
    let userId;
    
    if (users.length > 0) {
      userId = users[0].id;
      console.log(`✓ Using existing user (ID: ${userId})`);
    } else {
      const [userResult] = await connection.query(`
        INSERT INTO users (tenantId, openId, name, email, role, status)
        VALUES (?, ?, 'Demo User', 'demo@example.com', 'admin', 'active')
      `, [tenantId, ownerOpenId]);
      userId = userResult.insertId;
      console.log(`✓ Created user: Demo User (ID: ${userId})`);
    }

    // Create demo upload
    console.log('\n📤 Creating demo upload record...');
    const [uploadResult] = await connection.query(`
      INSERT INTO uploads (tenantId, userId, fileName, recordCount, status)
      VALUES (?, ?, 'demo-data.csv', 100, 'success')
    `, [tenantId, userId]);
    const uploadId = uploadResult.insertId;
    console.log(`✓ Created upload record (ID: ${uploadId})`);

    // Generate demo transactions
    console.log('\n📈 Generating demo transactions...');
    const statuses = ['Sold', 'Under Contract', 'Active Listing', 'Archived'];
    const propertyTypes = ['Residential', 'Condo', 'Townhouse', 'Land'];
    const cities = ['Austin', 'Round Rock', 'Cedar Park', 'Pflugerville', 'Georgetown', 'Leander', 'Liberty Hill'];
    const leadSources = ['Website', 'Referral', 'Open House', 'Social Media', 'Zillow', 'Realtor.com'];
    const agents = ['Sarah Johnson', 'Mike Davis', 'Emily Chen', 'David Martinez', 'Jessica Taylor'];

    const transactions = [];
    const numTransactions = 100;

    for (let i = 0; i < numTransactions; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const leadSource = leadSources[Math.floor(Math.random() * leadSources.length)];
      const agent = agents[Math.floor(Math.random() * agents.length)];
      
      const price = Math.floor(Math.random() * 1500000) + 200000;
      const commissionRate = 2.5 + Math.random() * 1.5;
      const commissionTotal = Math.floor(price * (commissionRate / 100));
      
      const createdDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const closingDate = new Date(createdDate);
      closingDate.setDate(closingDate.getDate() + Math.floor(Math.random() * 90));

      transactions.push([
        tenantId,
        uploadId,
        userId,
        `loop-${i + 1}`,
        `https://www.dotloop.com/loop/${i + 1}`,
        `${Math.floor(Math.random() * 9999)} ${['Oak', 'Maple', 'Pine', 'Cedar', 'Spring', 'Lake', 'River', 'Hill'][Math.floor(Math.random() * 8)]} St`,
        status,
        createdDate.toISOString().split('T')[0],
        status === 'Sold' ? closingDate.toISOString().split('T')[0] : null,
        `${Math.floor(Math.random() * 9999)} ${['Oak', 'Maple', 'Pine'][Math.floor(Math.random() * 3)]} St`,
        price,
        propertyType,
        Math.floor(Math.random() * 5) + 1,
        Math.floor(Math.random() * 4) + 1,
        Math.floor(Math.random() * 3000) + 1000,
        city,
        'TX',
        leadSource,
        agent,
        agent,
        price,
        commissionRate,
        commissionTotal,
        Math.floor(commissionTotal * 0.5),
        Math.floor(commissionTotal * 0.5),
        Math.floor(commissionTotal * 0.7)
      ]);
    }

    // Insert transactions in batches
    const batchSize = 50;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await connection.query(`
        INSERT INTO transactions (
          tenantId, uploadId, userId, loopId, loopViewUrl, loopName, loopStatus,
          createdDate, closingDate, address, price, propertyType,
          bedrooms, bathrooms, squareFootage, city, state,
          leadSource, agents, createdBy, salePrice, commissionRate,
          commissionTotal, buySideCommission, sellSideCommission, companyDollar
        ) VALUES ?
      `, [batch]);
      console.log(`✓ Inserted transactions ${i + 1}-${Math.min(i + batchSize, transactions.length)}`);
    }

    console.log(`\n✅ Seed completed successfully!`);
    console.log(`📊 Created:`);
    console.log(`   - 1 tenant (Demo Brokerage)`);
    console.log(`   - 1 user (Demo User)`);
    console.log(`   - ${numTransactions} transactions`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedData().catch(console.error);
