/**
 * Unified Cache Service for KGS LMS
 * Supports Redis (Azure Cache for Redis, local Redis) with an automatic high-performance
 * in-memory TTL Map fallback when Redis is not configured or during local development/testing.
 */

let redisClient = null;
const memoryStore = new Map();

// Check if REDIS_URL is configured
const redisUrl = process.env.REDIS_URL || process.env.AZURE_REDIS_URL;

if (redisUrl) {
  try {
    const Redis = require("ioredis");
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("[Cache] Redis connection failed after 3 attempts, falling back to memory cache.");
          return null; // Stop retrying, use memory
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.connect().then(() => {
      console.log("[Cache] Connected to Redis successfully");
    }).catch((err) => {
      console.warn("[Cache] Could not connect to Redis, using in-memory cache fallback:", err.message);
      redisClient = null;
    });

    redisClient.on("error", (err) => {
      console.warn("[Cache] Redis error, operating with in-memory fallback:", err.message);
    });
  } catch (err) {
    console.warn("[Cache] Failed to initialize Redis client, falling back to in-memory:", err.message);
    redisClient = null;
  }
}

// Background cleanup for in-memory cache every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (item.expiresAt && item.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 60000).unref();

const cacheService = {
  isRedisActive() {
    return Boolean(redisClient && redisClient.status === "ready");
  },

  async get(key) {
    try {
      if (this.isRedisActive()) {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      }
    } catch {
      // Fall through to memory
    }

    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      if (this.isRedisActive()) {
        const str = JSON.stringify(value);
        if (ttlSeconds > 0) {
          await redisClient.set(key, str, "EX", ttlSeconds);
        } else {
          await redisClient.set(key, str);
        }
        return true;
      }
    } catch {
      // Fall through to memory
    }

    memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    });
    return true;
  },

  async del(key) {
    try {
      if (this.isRedisActive()) {
        await redisClient.del(key);
      }
    } catch {
      // Ignore
    }
    memoryStore.delete(key);
    return true;
  },

  async delPrefix(prefix) {
    try {
      if (this.isRedisActive()) {
        const stream = redisClient.scanStream({ match: `${prefix}*`, count: 100 });
        stream.on("data", (keys) => {
          if (keys.length) {
            const pipeline = redisClient.pipeline();
            keys.forEach((k) => pipeline.del(k));
            pipeline.exec();
          }
        });
      }
    } catch {
      // Ignore
    }

    for (const key of memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        memoryStore.delete(key);
      }
    }
    return true;
  },
};

module.exports = cacheService;
