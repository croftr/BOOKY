/**
 * Sync script to push local books.json to Vercel Blob or pull from it.
 * Usage: 
 *   npx tsx scripts/sync.ts push  - Uploads local books.json to Cloud (Blob)
 *   npx tsx scripts/sync.ts pull  - Downloads Cloud books (Blob) to local books.json
 */

import { put, list } from '@vercel/blob';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

const DATA_FILE = join(process.cwd(), 'data', 'books.json');
const BLOB_NAME = 'books-data-v1.json';

async function sync() {
  const action = process.argv[2];

  if (!action || !['push', 'pull'].includes(action)) {
    console.log('❌ Usage: npx tsx scripts/sync.ts [push|pull]');
    process.exit(1);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not set in .env.local');
    process.exit(1);
  }

  try {
    if (action === 'push') {
      console.log('🚀 Pushing local books.json to Vercel Blob...');
      if (!existsSync(DATA_FILE)) {
        console.error('❌ local books.json not found');
        process.exit(1);
      }
      const localData = readFileSync(DATA_FILE, 'utf-8');
      const books = JSON.parse(localData);
      
      await put(BLOB_NAME, localData, {
        access: 'public',
        addRandomSuffix: true,
      });
      
      console.log(`✅ Success! Uploaded ${books.length} books to Vercel Blob.`);
    } else {
      console.log('☁️ Pulling books from Vercel Blob to local books.json...');
      const searchPrefix = BLOB_NAME.split('.')[0];
      const { blobs } = await list({ prefix: searchPrefix });
      
      const dataBlobs = blobs.filter(b => b.pathname.startsWith(searchPrefix) && b.pathname.endsWith('.json'));
      
      if (dataBlobs.length === 0) {
        console.error('❌ No data found in Vercel Blob');
        process.exit(1);
      }
      
      // Get the latest blob
      const latest = dataBlobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];

      const response = await fetch(latest.url);
      const books = await response.json();
      
      writeFileSync(DATA_FILE, JSON.stringify(books, null, 2), 'utf-8');
      console.log(`✅ Success! Downloaded ${books.length} books to local data/books.json.`);
    }
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

sync();
