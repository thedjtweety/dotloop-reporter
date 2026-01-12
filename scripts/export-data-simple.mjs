/**
 * Simple Database Export Script
 * Uses environment variables for database connection
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function exportData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(__dirname, '..', 'backups', `pre-multitenant-${timestamp}`);
  
  console.log(`Creating backup directory: ${backupDir}`);
  await fs.mkdir(backupDir, { recursive: true });

  // Use DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  console.log('Connecting to database...');
  const connection = await mysql.createConnection(databaseUrl);

  try {
    // Export users
    console.log('Exporting users...');
    const [users] = await connection.query('SELECT * FROM users');
    await fs.writeFile(
      path.join(backupDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`✓ Exported ${users.length} users`);

    // Export uploads
    console.log('Exporting uploads...');
    const [uploads] = await connection.query('SELECT * FROM uploads');
    await fs.writeFile(
      path.join(backupDir, 'uploads.json'),
      JSON.stringify(uploads, null, 2)
    );
    console.log(`✓ Exported ${uploads.length} uploads`);

    // Export transactions
    console.log('Exporting transactions...');
    const [transactions] = await connection.query('SELECT * FROM transactions');
    await fs.writeFile(
      path.join(backupDir, 'transactions.json'),
      JSON.stringify(transactions, null, 2)
    );
    console.log(`✓ Exported ${transactions.length} transactions`);

    // Export audit logs
    console.log('Exporting audit logs...');
    const [auditLogs] = await connection.query('SELECT * FROM audit_logs');
    await fs.writeFile(
      path.join(backupDir, 'audit_logs.json'),
      JSON.stringify(auditLogs, null, 2)
    );
    console.log(`✓ Exported ${auditLogs.length} audit logs`);

    // Export dotloop integrations (may not exist)
    try {
      console.log('Exporting dotloop integrations...');
      const [integrations] = await connection.query('SELECT * FROM dotloop_integrations');
      await fs.writeFile(
        path.join(backupDir, 'dotloop_integrations.json'),
        JSON.stringify(integrations, null, 2)
      );
      console.log(`✓ Exported ${integrations.length} dotloop integrations`);
    } catch (error) {
      console.log('⚠ dotloop_integrations table does not exist (skipping)');
    }

    // Create metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      backup_dir: backupDir,
      tables_exported: ['users', 'uploads', 'transactions', 'audit_logs'],
      record_counts: {
        users: users.length,
        uploads: uploads.length,
        transactions: transactions.length,
        audit_logs: auditLogs.length,
      },
    };

    await fs.writeFile(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('\n✅ Export completed successfully!');
    console.log(`📁 Backup location: ${backupDir}`);
    console.log(`📊 Total records: ${users.length + uploads.length + transactions.length + auditLogs.length}`);

    return backupDir;

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

exportData().catch(console.error);
