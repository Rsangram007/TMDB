process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRE = '1h';
process.env.MONGODB_URI = 'mongodb://localhost:27017/tmdb_test';
process.env.NODE_ENV = 'test';
process.env.TMDB_BEARER = 'test-tmdb-token';
process.env.TMDB_BASE = 'https://api.themoviedb.org/3';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock Redis
jest.mock('../utils/cache', () => ({
  getCachedResponse: jest.fn(() => Promise.resolve(null)),
  cacheResponse: jest.fn(() => Promise.resolve()),
  generateCacheKey: jest.fn((prefix, params) => `test:${prefix}`),
  connectRedis: jest.fn(() => Promise.resolve()),
  invalidateCache: jest.fn(() => Promise.resolve())
}));
