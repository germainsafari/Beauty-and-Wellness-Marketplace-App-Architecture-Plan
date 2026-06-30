import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

const sql = readFileSync('./drizzle/0000_panoramic_gunslinger.sql', 'utf8');
const statements = sql.split('-->').join('').split('\n--> statement-breakpoint\n').join('\n').split(';').filter(s => s.trim().length > 0);

const conn = await mysql.createConnection(url);
console.log('Connected to database');

for (const stmt of statements) {
  const trimmed = stmt.trim();
  if (!trimmed) continue;
  try {
    await conn.execute(trimmed);
    const match = trimmed.match(/CREATE TABLE `(\w+)`/);
    if (match) console.log(`✓ Created table: ${match[1]}`);
  } catch (err) {
    if (err.code === 'ER_TABLE_EXISTS_ERROR') {
      const match = trimmed.match(/CREATE TABLE `(\w+)`/);
      if (match) console.log(`~ Table already exists: ${match[1]}`);
    } else {
      console.error('Error:', err.message.slice(0, 100));
    }
  }
}

await conn.end();
console.log('Migration complete');
