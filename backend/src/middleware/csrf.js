const crypto = require("node:crypto");
const { isProduction } = require("../config/env");

function parseCookies(value = "") {
  return Object.fromEntries(
    value.split(";").flatMap((part) => {
      const index = part.indexOf("=");
      return index > 0
        ? [[part.slice(0, index).trim(), part.slice(index + 1).trim()]]
        : [];
    }),
  );
}

function csrfCookie(token, maxAge = 8 * 60 * 60) {
  return `kgs_csrf=${token}; Path=/; Max-Age=${maxAge}; SameSite=${isProduction ? "None; Secure; Partitioned" : "Lax"}; Priority=High`;
}

function setCsrfCookie(res, token = crypto.randomBytes(32).toString("hex")) {
  res.append("Set-Cookie", csrfCookie(token));
  return token;
}

function csrfProtection(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.kgs_csrf) setCsrfCookie(res);

  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.headers.authorization?.startsWith("Bearer ")) return next();

  // Public unauthenticated authentication endpoints do not use or require session CSRF tokens
  const path = (req.originalUrl || req.path || "").split("?")[0];
  if (
    path === "/api/auth/register" ||
    path === "/api/auth/request-otp" ||
    path === "/api/auth/resend-otp" ||
    path === "/api/auth/verify-otp" ||
    path === "/api/auth/admin/login" ||
    path === "/api/auth/admin/request-otp" ||
    path === "/api/auth/admin/verify-otp"
  ) {
    return next();
  }

  const sessionCookie = cookies.kgs_session || cookies.kgs_admin_session;
  if (!sessionCookie) return next();

  const expected = cookies.kgs_csrf;
  const supplied = String(req.headers["x-csrf-token"] || "");
  if (!expected || !supplied || supplied.length !== expected.length) {
    return res.status(403).json({ error: "CSRF validation failed" });
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(supplied),
    Buffer.from(expected),
  );
  if (!valid) return res.status(403).json({ error: "CSRF validation failed" });
  next();
}

module.exports = { csrfProtection, setCsrfCookie, csrfCookie };
