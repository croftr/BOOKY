import Redis from 'ioredis';
import { put } from '@vercel/blob';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface Book {
  id: string;
  title: string;
  image: string;
  rating: number;
  review: string;
  category: string;
  dateCompleted: string;
  completionOrder: number;
}

function base64ToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string; filename: string } {
  // Extract base64 data from data URL
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Determine file extension from MIME type
  const ext = mimeType.split('/')[1] || 'jpg';
  const filename = `book-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

  return { buffer, mimeType, filename };
}

async function migrateImagesToBlob() {
  try {
    console.log('🚀 Starting image migration from Redis to Vercel Blob...\n');

    // Check for required environment variable
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is not set');
      console.log('ℹ️  Get your token from: https://vercel.com/dashboard/stores');
      process.exit(1);
    }

    // Get all books from Redis
    const booksData = await redis.get('books');
    if (!booksData) {
      console.log('❌ No books found in Redis');
      process.exit(1);
    }

    const books: Book[] = JSON.parse(booksData);
    console.log(`📚 Found ${books.length} books in database`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each book
    for (const book of books) {
      if (!book.image) {
        console.log(`⏭️  Skipping "${book.title}" - no image`);
        skippedCount++;
        continue;
      }

      // Skip if already a blob URL
      if (book.image.startsWith('https://') && book.image.includes('vercel-storage.com')) {
        console.log(`✅ Skipping "${book.title}" - already in Blob storage`);
        skippedCount++;
        continue;
      }

      // Skip if it's a file path (shouldn't happen but just in case)
      if (book.image.startsWith('/uploads/')) {
        console.log(`⏭️  Skipping "${book.title}" - old file path format`);
        skippedCount++;
        continue;
      }

      // Process base64 images
      if (book.image.startsWith('data:')) {
        try {
          const { buffer, mimeType, filename } = base64ToBuffer(book.image);

          // Upload to Vercel Blob
          const blob = await put(filename, buffer, {
            access: 'public',
            contentType: mimeType,
          });

          // Update book image URL
          book.image = blob.url;

          console.log(`✅ Migrated "${book.title}" to ${blob.url} - ${Math.round(buffer.length / 1024)}KB`);
          migratedCount++;
        } catch (error) {
          console.error(`❌ Error processing "${book.title}":`, error instanceof Error ? error.message : error);
          errorCount++;
        }
      } else {
        console.log(`⏭️  Skipping "${book.title}" - unknown image format: ${book.image.substring(0, 50)}...`);
        skippedCount++;
      }
    }

    // Save updated books back to Redis
    if (migratedCount > 0) {
      await redis.set('books', JSON.stringify(books));
      console.log(`\n💾 Saved updated books to Redis`);

      // Get Redis memory info
      const info = await redis.info('memory');
      const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim();
      console.log(`📊 Redis memory usage: ${usedMemory || 'unknown'}`);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    if (migratedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('✅ Images are now stored in Vercel Blob');
      console.log('✅ Redis memory has been freed up');
    } else {
      console.log('\n⚠️  No images were migrated');
    }

    await redis.quit();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await redis.quit();
    process.exit(1);
  }
}

// Run migration
migrateImagesToBlob();
