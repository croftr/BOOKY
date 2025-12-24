import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import Redis from 'ioredis';
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

async function migrateImagesToBase64() {
  try {
    console.log('🚀 Starting image migration to base64...\n');

    // Get all books from Redis
    const booksData = await redis.get('books');
    if (!booksData) {
      console.log('❌ No books found in Redis');
      process.exit(1);
    }

    const books: Book[] = JSON.parse(booksData);
    console.log(`📚 Found ${books.length} books in database`);

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
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

      // Skip if already base64
      if (book.image.startsWith('data:')) {
        console.log(`✅ Skipping "${book.title}" - already base64`);
        skippedCount++;
        continue;
      }

      // Check if it's a file path
      if (book.image.startsWith('/uploads/')) {
        const filename = book.image.replace('/uploads/', '');
        const filepath = join(uploadsDir, filename);

        try {
          // Check if file exists
          statSync(filepath);

          // Read the file
          const buffer = readFileSync(filepath);

          // Determine MIME type from file extension
          const ext = filename.split('.').pop()?.toLowerCase();
          let mimeType = 'image/jpeg'; // default
          if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'gif') mimeType = 'image/gif';
          else if (ext === 'webp') mimeType = 'image/webp';

          // Convert to base64
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${mimeType};base64,${base64}`;

          // Update book image
          book.image = dataUrl;

          console.log(`✅ Migrated "${book.title}" (${filename}) - ${Math.round(buffer.length / 1024)}KB`);
          migratedCount++;
        } catch (error) {
          console.error(`❌ Error processing "${book.title}" (${filename}):`, error instanceof Error ? error.message : error);
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
      console.log('ℹ️  You can now safely delete the public/uploads directory');
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
migrateImagesToBase64();
