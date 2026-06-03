import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

/**
 * Storage interface backed by:
 * 1. A local JSON file (data/books.json) during development
 * 2. A single versioned JSON object in AWS S3 in production
 *
 * The whole library is a small JSON document (a few hundred KB at most), so we
 * read it with one GetObject and write it with one PutObject. Bucket versioning
 * provides point-in-time recovery; a lifecycle rule expires old versions.
 *
 * NOTE: Netlify Functions run on AWS Lambda, which reserves the AWS_ACCESS_KEY_ID /
 * AWS_SECRET_ACCESS_KEY / AWS_REGION env var names. We therefore use BOOKY_-prefixed
 * vars and pass credentials explicitly so they don't collide with the runtime's own.
 */

const REGION = process.env.BOOKY_AWS_REGION || 'eu-west-2';
const BUCKET = process.env.BOOKY_S3_BUCKET || 'robs-booky-data';

// Single object that holds the entire book list.
const DATA_KEY = 'books-data-v1.json';

class StorageClient {
  private localPath = path.join(process.cwd(), 'data', 'books.json');
  private isDev = process.env.NODE_ENV === 'development';
  private s3: S3Client | null = null;

  constructor() {
    if (this.isDev && !fs.existsSync(path.dirname(this.localPath))) {
      fs.mkdirSync(path.dirname(this.localPath), { recursive: true });
    }
  }

  private client(): S3Client {
    if (!this.s3) {
      const accessKeyId = process.env.BOOKY_AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.BOOKY_AWS_SECRET_ACCESS_KEY;
      this.s3 = new S3Client({
        region: REGION,
        // If explicit keys are provided use them; otherwise fall back to the
        // default credential chain (e.g. a local `aws` profile when running scripts).
        credentials:
          accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      });
    }
    return this.s3;
  }

  // `key` is kept for call-site compatibility but ignored — the whole library
  // lives in a single object.
  async get(_key: string): Promise<string | null> {
    if (this.isDev && !process.env.FORCE_CLOUD) {
      if (!fs.existsSync(this.localPath)) return null;
      return fs.readFileSync(this.localPath, 'utf-8');
    }

    try {
      const res = await this.client().send(
        new GetObjectCommand({ Bucket: BUCKET, Key: DATA_KEY })
      );
      if (!res.Body) return null;
      return await res.Body.transformToString();
    } catch (e: any) {
      // First-ever read before the object exists.
      if (e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404) {
        return null;
      }
      console.error('S3 read error:', e);
      return null;
    }
  }

  async set(_key: string, value: string): Promise<'OK'> {
    if (this.isDev && !process.env.FORCE_CLOUD) {
      fs.writeFileSync(this.localPath, value, 'utf-8');
      return 'OK';
    }

    try {
      await this.client().send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: DATA_KEY,
          Body: value,
          ContentType: 'application/json',
        })
      );
      return 'OK';
    } catch (e) {
      console.error('S3 write error:', e);
      throw e;
    }
  }

  async del(key: string): Promise<number> {
    if (this.isDev && !process.env.FORCE_CLOUD) {
      fs.writeFileSync(this.localPath, '[]', 'utf-8');
      return 1;
    }
    // Overwrite with an empty array; previous contents remain recoverable via
    // S3 object versioning.
    await this.set(key, '[]');
    return 1;
  }
}

let storageInstance: StorageClient | null = null;

export const getStorage = () => {
  if (!storageInstance) {
    storageInstance = new StorageClient();
  }
  return storageInstance;
};
