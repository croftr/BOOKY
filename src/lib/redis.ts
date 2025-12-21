import Redis from 'ioredis';

// Create Redis client
const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
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
