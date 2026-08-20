import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_project_key_123";

/**
 * Express middleware to verify JWT and check user roles.
 * @param {string|string[]} allowedRoles Single role or array of allowed roles
 */
export const requireAuth = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No session token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Attach user info (id, email, role, profileId) to request

      if (allowedRoles) {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!roles.includes(decoded.role)) {
          return res.status(403).json({ error: "Access denied. Insufficient administrative permissions." });
        }
      }

      next();
    } catch (err) {
      console.warn("JWT verification failed:", err.message);
      return res.status(401).json({ error: "Authentication failed. Session expired or invalid." });
    }
  };
};

const rateLimitCache = new Map();
const LIMIT = 10;
const WINDOW = 60 * 1000; // 1 minute

/**
 * Sliding window IP rate limiter middleware.
 */
export const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const now = Date.now();
  
  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, [now]);
    return next();
  }
  
  const timestamps = rateLimitCache.get(ip).filter(t => now - t < WINDOW);
  timestamps.push(now);
  rateLimitCache.set(ip, timestamps);
  
  if (timestamps.length > LIMIT) {
    return res.status(429).json({ error: "Rate limit exceeded. Maximum 10 requests per minute." });
  }
  next();
};

/**
 * API Key authentication middleware for external clients.
 */
export const requireApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== "mgmu_hr_secret_key_2026") {
    return res.status(401).json({ error: "Access denied. Invalid or missing API key." });
  }
  next();
};
