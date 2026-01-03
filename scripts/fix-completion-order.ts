/**
 * Script to fix gaps in completionOrder sequence
 * Renumbers all books with completionOrder to sequential values (1, 2, 3, ...)
 * while preserving their relative order
 *
 * Usage: npx tsx scripts/fix-completion-order.ts
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

interface Book {
  id: string;
  title: string;
  completionOrder?: number;
  [key: string]: any;
}

async function fixCompletionOrder() {
  try {
    console.log('🔧 Starting completionOrder fix...');

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

    // Read books from Redis
    const booksData = await redis.get('books');
    if (!booksData) {
      console.error('❌ No books found in Redis');
      process.exit(1);
    }

    const books: Book[] = JSON.parse(booksData);
    console.log(`📚 Found ${books.length} books in database`);

    // Filter and sort books by completionOrder
    const booksWithOrder = books.filter(book => book.completionOrder !== undefined && book.completionOrder !== null);
    booksWithOrder.sort((a, b) => (a.completionOrder || 0) - (b.completionOrder || 0));

    console.log('\n📊 Current completion order:');
    booksWithOrder.forEach(book => {
      console.log(`  ${book.title}: ${book.completionOrder}`);
    });

    // Renumber sequentially
    booksWithOrder.forEach((book, index) => {
      const oldOrder = book.completionOrder;
      book.completionOrder = index + 1;
      console.log(`\n✏️  Updated "${book.title}": ${oldOrder} → ${book.completionOrder}`);
    });

    console.log('\n📊 New completion order:');
    booksWithOrder.forEach(book => {
      console.log(`  ${book.title}: ${book.completionOrder}`);
    });

    // Write back to Redis
    await redis.set('books', JSON.stringify(books));

    console.log('\n✅ Database updated successfully!');
    console.log(`📝 ${booksWithOrder.length} books renumbered`);

    // Verify
    const verifyData = await redis.get('books');
    const verifyBooks: Book[] = verifyData ? JSON.parse(verifyData) : [];
    const verifyOrders = verifyBooks
      .filter(b => b.completionOrder)
      .map(b => b.completionOrder)
      .sort((a, b) => (a || 0) - (b || 0));

    console.log(`🔍 Verification: completionOrder values: ${verifyOrders.join(', ')}`);

    await redis.quit();
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

fixCompletionOrder();
