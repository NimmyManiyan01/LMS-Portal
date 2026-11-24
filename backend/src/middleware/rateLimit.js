const buckets = new Map();

function clientKey(req) {
  if (req.auth?.sub) return `user:${req.auth.sub}`;
  if (req.session?.studentId) return `user:${req.session.studentId}`;
  if (req.session?.adminId) return `user:${req.session.adminId}`;
  const authHeader = (req.headers.authorization || "").trim();
  if (authHeader.startsWith("Bearer ") && authHeader.length > 7) {
    return `auth:${authHeader.slice(7).trim().slice(0, 32)}`;
  }
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/(?:kgs_session|kgs_admin_session)=([^;]+)/);
  if (match) {
    return `sess:${match[1].trim().slice(0, 32)}`;
  }
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? String(forwarded).split(",")[0].trim() : (req.ip || "unknown");
  return `ip:${ip}`;
}

function createRateLimiter({ windowMs, max, message }) {
  return (req, res, next) => {
    if (req.method === "OPTIONS" || req.path === "/health" || req.path === "/api/health") {
      return next();
    }
    const key = clientKey(req);
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", Math.max(0, max - bucket.count));
    res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > max) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ error: message });
    }

    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60000).unref();

module.exports = { createRateLimiter };
