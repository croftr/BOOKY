import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

// Mock Redis client for development without Redis
class MockRedis {
  private dataPath = path.join(process.cwd(), 'data', 'books-mock.json');

  constructor() {
    if (!fs.existsSync(path.dirname(this.dataPath))) {
      fs.mkdirSync(path.dirname(this.dataPath), { recursive: true });
    }
    if (!fs.existsSync(this.dataPath)) {
      fs.writeFileSync(this.dataPath, '{}');
    }
  }

  async get(key: string) {
    const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
    return data[key] || null;
  }

  async set(key: string, value: string) {
    const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
    data[key] = value;
    fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    return 'OK';
  }
}

// Create Redis client
const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('REDIS_URL not set, using file-based mock');
    return new MockRedis() as unknown as Redis;
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
};

let redis: Redis | null = null;

export const getRedis = () => {
  if (!redis) {
    redis = getRedisClient();
  }
  return redis;
};
