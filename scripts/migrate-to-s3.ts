/**
 * One-off migration: Vercel Blob -> AWS S3.
 *
 * 1. Reads the current book list from Vercel Blob (production source of truth).
 * 2. Copies every cover / review image hosted on Vercel Blob into S3 (images/ prefix)
 *    and rewrites the URLs on each book.
 * 3. Writes the final book list to S3 as books-data-v1.json.
 *
 * Usage:  npx tsx scripts/migrate-to-s3.ts
 *
 * Requires in .env.local:
 *   BLOB_READ_WRITE_TOKEN          (to locate the current Vercel Blob data file)
 *   BOOKY_S3_BUCKET                (default: robs-booky-data)
 *   BOOKY_AWS_REGION               (default: eu-west-2)
 *   BOOKY_AWS_ACCESS_KEY_ID / BOOKY_AWS_SECRET_ACCESS_KEY
 *     (or a configured local `aws` profile / default credential chain)
 */

import { list } from '@vercel/blob';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const REGION = process.env.BOOKY_AWS_REGION || 'eu-west-2';
const BUCKET = process.env.BOOKY_S3_BUCKET || 'robs-booky-data';
const DATA_KEY = 'books-data-v1.json';
const BLOB_NAME = 'books-data-v1.json';

interface Book {
  id: string;
  title: string;
  image: string;
  reviewImages?: string[];
  [k: string]: unknown;
}

const s3 = new S3Client({
  region: REGION,
  credentials:
    process.env.BOOKY_AWS_ACCESS_KEY_ID && process.env.BOOKY_AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.BOOKY_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.BOOKY_AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const publicUrl = (key: string) => `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
const isVercelBlob = (url: string) =>
  typeof url === 'string' && url.startsWith('https://') && url.includes('vercel-storage.com');

// download a Vercel Blob image and re-upload to S3, returning the new public URL
const imageCache = new Map<string, string>();

async function moveImage(url: string): Promise<string> {
  if (!isVercelBlob(url)) return url; // already migrated or external — leave alone
  if (imageCache.has(url)) return imageCache.get(url)!;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ⚠️  Could not fetch image (${res.status}): ${url}`);
    return url;
  }
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const bytes = Buffer.from(await res.arrayBuffer());

  const original = url.split('/').pop()?.split('?')[0] || 'image';
  const safeName = original.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `images/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;

  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: bytes, ContentType: contentType })
  );

  const newUrl = publicUrl(key);
  imageCache.set(url, newUrl);
  console.log(`  ✅ image -> ${newUrl} (${Math.round(bytes.length / 1024)}KB)`);
  return newUrl;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not set in .env.local');
    process.exit(1);
  }

  console.log('☁️  Reading current data from Vercel Blob...');
  const prefix = BLOB_NAME.split('.')[0];
  const { blobs } = await list({ prefix });
  const dataBlobs = blobs.filter(
    (b) => b.pathname.startsWith(prefix) && b.pathname.endsWith('.json')
  );
  if (dataBlobs.length === 0) {
    console.error('❌ No data file found in Vercel Blob');
    process.exit(1);
  }
  const latest = dataBlobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
  const books: Book[] = await (await fetch(latest.url)).json();
  console.log(`📚 Found ${books.length} books\n`);

  let movedCovers = 0;
  let movedReviewImages = 0;

  for (const book of books) {
    if (isVercelBlob(book.image)) {
      console.log(`📖 ${book.title}`);
      book.image = await moveImage(book.image);
      movedCovers++;
    }
    if (Array.isArray(book.reviewImages) && book.reviewImages.length > 0) {
      const updated: string[] = [];
      for (const img of book.reviewImages) {
        if (isVercelBlob(img)) {
          if (movedCovers === 0) console.log(`📖 ${book.title}`);
          updated.push(await moveImage(img));
          movedReviewImages++;
        } else {
          updated.push(img);
        }
      }
      book.reviewImages = updated;
    }
  }

  console.log('\n💾 Writing book list to S3...');
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: DATA_KEY,
      Body: JSON.stringify(books),
      ContentType: 'application/json',
    })
  );

  console.log('\n' + '='.repeat(50));
  console.log('✅ Migration complete');
  console.log(`   Books written to S3:   ${books.length}`);
  console.log(`   Cover images moved:    ${movedCovers}`);
  console.log(`   Review images moved:   ${movedReviewImages}`);
  console.log(`   Bucket:                ${BUCKET} (${REGION})`);
  console.log('='.repeat(50));
}

main().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
