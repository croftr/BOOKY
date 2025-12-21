/**
 * Migration script to transfer books from JSON file to Redis
 * Run this once to migrate your existing data
 *
 * Usage: npm run migrate
 */

import Redis from 'ioredis';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
function loadEnv() {
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
  }
}

async function migrate() {
  try {
    console.log('🚀 Starting migration from books.json to Redis...');

    // Load environment variables
    loadEnv();

    // Check for REDIS_URL
    if (!process.env.REDIS_URL) {
      console.error('❌ REDIS_URL environment variable is not set');
      console.log('Please add REDIS_URL to your .env.local file');
      process.exit(1);
    }

    // Connect to Redis
    const redis = new Redis(process.env.REDIS_URL);

    // Read existing books from JSON file
    const dataFile = join(process.cwd(), 'data', 'books.json');
    const booksData = readFileSync(dataFile, 'utf-8');
    const books = JSON.parse(booksData);

    console.log(`📚 Found ${books.length} books in books.json`);

    // Write to Redis
    await redis.set('books', JSON.stringify(books));

    console.log('✅ Migration completed successfully!');
    console.log(`📝 ${books.length} books migrated to Redis`);

    // Verify the data
    const verifyData = await redis.get('books');
    const verifyBooks = verifyData ? JSON.parse(verifyData) : [];
    console.log(`🔍 Verification: ${Array.isArray(verifyBooks) ? verifyBooks.length : 0} books in Redis`);

    await redis.quit();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
