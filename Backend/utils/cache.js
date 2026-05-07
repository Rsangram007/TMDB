const { createClient } = require('redis');

let client = null;
let isConnected = false;

const getRedisClient = () => {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('Redis client connected');
      isConnected = true;
    });

    client.on('disconnect', () => {
      console.log('Redis client disconnected');
      isConnected = false;
    });
  }
  return client;
};

const connectRedis = async () => {
  const redis = getRedisClient();
  if (!isConnected) {
    try {
      await redis.connect();
    } catch (err) {
      console.warn('Redis connection failed - caching disabled:', err.message);
    }
  }
  return redis;
};

const cacheResponse = async (key, data, ttlSeconds = 300) => {
  try {
    const redis = getRedisClient();
    if (!isConnected) return;
    await redis.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.error('Redis cache set error:', err.message);
  }
};

const getCachedResponse = async (key) => {
  try {
    const redis = getRedisClient();
    if (!isConnected) return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis cache get error:', err.message);
    return null;
  }
};

const invalidateCache = async (pattern) => {
  try {
    const redis = getRedisClient();
    if (!isConnected) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (err) {
    console.error('Redis cache invalidate error:', err.message);
  }
};

// Generate cache key from request
const generateCacheKey = (prefix, params) => {
  const sortedParams = Object.keys(params || {})
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return sortedParams ? `tmdb:${prefix}:${sortedParams}` : `tmdb:${prefix}`;
};

module.exports = {
  getRedisClient,
  connectRedis,
  cacheResponse,
  getCachedResponse,
  invalidateCache,
  generateCacheKey
};
