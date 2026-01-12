/**
 * Database Backup Script
 * Exports all data to JSON before migrating to multi-tenant schema
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

// Import old schema
import * as oldSchema from '../drizzle/schema-backup-single-tenant.js';

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', `pre-multitenant-${timestamp}`);
  
  console.log(`Creating backup directory: ${backupDir}`);
  await fs.mkdir(backupDir, { recursive: true });

  // Connect to database
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'dotloop_reporter',
  });

  const db = drizzle(connection, { schema: oldSchema, mode: 'default' });

  try {
    // Backup users
    console.log('Backing up users...');
    const users = await db.select().from(oldSchema.users);
    await fs.writeFile(
      path.join(backupDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`✓ Backed up ${users.length} users`);

    // Backup uploads
    console.log('Backing up uploads...');
    const uploads = await db.select().from(oldSchema.uploads);
    await fs.writeFile(
      path.join(backupDir, 'uploads.json'),
      JSON.stringify(uploads, null, 2)
    );
    console.log(`✓ Backed up ${uploads.length} uploads`);

    // Backup transactions
    console.log('Backing up transactions...');
    const transactions = await db.select().from(oldSchema.transactions);
    await fs.writeFile(
      path.join(backupDir, 'transactions.json'),
      JSON.stringify(transactions, null, 2)
    );
    console.log(`✓ Backed up ${transactions.length} transactions`);

    // Backup audit logs
    console.log('Backing up audit logs...');
    const auditLogs = await db.select().from(oldSchema.auditLogs);
    await fs.writeFile(
      path.join(backupDir, 'audit_logs.json'),
      JSON.stringify(auditLogs, null, 2)
    );
    console.log(`✓ Backed up ${auditLogs.length} audit logs`);

    // Backup dotloop integrations
    console.log('Backing up dotloop integrations...');
    const integrations = await db.select().from(oldSchema.dotloopIntegrations);
    await fs.writeFile(
      path.join(backupDir, 'dotloop_integrations.json'),
      JSON.stringify(integrations, null, 2)
    );
    console.log(`✓ Backed up ${integrations.length} dotloop integrations`);

    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      tables: {
        users: users.length,
        uploads: uploads.length,
        transactions: transactions.length,
        audit_logs: auditLogs.length,
        dotloop_integrations: integrations.length,
      },
      total_records: users.length + uploads.length + transactions.length + auditLogs.length + integrations.length,
    };

    await fs.writeFile(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('\n✓ Backup completed successfully!');
    console.log(`Backup location: ${backupDir}`);
    console.log(`Total records backed up: ${metadata.total_records}`);

  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

backupDatabase().catch(console.error);
