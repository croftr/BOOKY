/**
 * Migration script to transfer books from JSON file to Vercel KV
 * Run this once after setting up Vercel KV to migrate your existing data
 *
 * Usage: npx tsx scripts/migrate-to-kv.ts
 */

import { kv } from '@vercel/kv';
import { readFileSync } from 'fs';
import { join } from 'path';

async function migrate() {
  try {
    console.log('🚀 Starting migration from books.json to Vercel KV...');

    // Read existing books from JSON file
    const dataFile = join(process.cwd(), 'data', 'books.json');
    const booksData = readFileSync(dataFile, 'utf-8');
    const books = JSON.parse(booksData);

    console.log(`📚 Found ${books.length} books in books.json`);

    // Write to Vercel KV
    await kv.set('books', books);

    console.log('✅ Migration completed successfully!');
    console.log(`📝 ${books.length} books migrated to Vercel KV`);

    // Verify the data
    const verifyBooks = await kv.get('books');
    console.log(`🔍 Verification: ${Array.isArray(verifyBooks) ? verifyBooks.length : 0} books in KV`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
