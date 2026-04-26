import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

/**
 * A simple storage interface that works:
 * 1. Locally with a JSON file (data/books.json)
 * 2. In production with Vercel Blob (stores books.json in the cloud)
 */
class StorageClient {
  private localPath = path.join(process.cwd(), 'data', 'books.json');
  private isDev = process.env.NODE_ENV === 'development';
  private blobName = 'books-data-v1.json';

  constructor() {
    if (this.isDev && !fs.existsSync(path.dirname(this.localPath))) {
      fs.mkdirSync(path.dirname(this.localPath), { recursive: true });
    }
  }

  async get(key: string): Promise<string | null> {
    // 1. Local Fallback (Dev Only)
    if (this.isDev && !process.env.FORCE_CLOUD) {
      if (!fs.existsSync(this.localPath)) return null;
      return fs.readFileSync(this.localPath, 'utf-8');
    }

    // 2. Vercel Blob (Cloud)
    try {
      // Use a prefix search that matches even with random suffixes
      const searchPrefix = this.blobName.split('.')[0]; 
      const { blobs } = await list({ prefix: searchPrefix });
      
      // Filter for exact matches of our filename (ignoring the random suffix part)
      const dataBlobs = blobs.filter(b => b.pathname.startsWith(searchPrefix) && b.pathname.endsWith('.json'));
      
      if (dataBlobs.length === 0) return null;
      
      // Sort by uploadedAt descending to get the latest
      const latest = dataBlobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];

      const response = await fetch(latest.url);
      if (!response.ok) return null;
      return await response.text();
    } catch (e) {
      console.error('Blob Storage Read Error:', e);
      return null;
    }
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
    if (this.isDev && !process.env.FORCE_CLOUD) {
      fs.writeFileSync(this.localPath, value, 'utf-8');
      return 'OK';
    }

    try {
      // Upload new version to Blob
      await put(this.blobName, value, {
        access: 'public',
        addRandomSuffix: true,
      });
      return 'OK';
    } catch (e) {
      console.error('Blob Storage Write Error:', e);
      throw e;
    }
  }


  async del(key: string): Promise<number> {
    if (this.isDev && !process.env.FORCE_CLOUD) {
      fs.writeFileSync(this.localPath, '[]', 'utf-8');
      return 1;
    }
    // Delete in Blob is more complex as it requires deleting all versions
    // For this simple app, we just 'set' to empty array
    await this.set(key, '[]');
    return 1;
  }
}

let storageInstance: StorageClient | null = null;

export const getRedis = () => {
  if (!storageInstance) {
    storageInstance = new StorageClient();
  }
  return storageInstance;
};



