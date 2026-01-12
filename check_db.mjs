import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dotloop_reporter',
});

try {
  const [tables] = await connection.execute("SHOW TABLES");
  console.log('Tables in database:', tables.length);
  tables.forEach(t => console.log('  -', Object.values(t)[0]));
  
  // Check if uploads table exists and has data
  if (tables.some(t => Object.values(t)[0] === 'uploads')) {
    const [uploads] = await connection.execute('SELECT COUNT(*) as count FROM uploads');
    console.log('\nUploads count:', uploads[0].count);
    
    const [recentUploads] = await connection.execute('SELECT id, fileName, recordCount, uploadedAt FROM uploads ORDER BY uploadedAt DESC LIMIT 5');
    console.log('\nRecent uploads:');
    recentUploads.forEach(u => console.log(`  - ID: ${u.id}, File: ${u.fileName}, Records: ${u.recordCount}`));
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await connection.end();
}
