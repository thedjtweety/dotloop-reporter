import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiting Middleware
 * 
 * Implements token bucket algorithm for rate limiting
 * Prevents abuse of upload and API endpoints
 */

interface RateLimitStore {
  [key: string]: {
    tokens: number;
    lastRefill: number;
  };
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      statusCode: 429,
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Cleanup old entries every 60 seconds
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get client identifier (IP address or user ID)
   */
  private getClientId(req: Request): string {
    // Try to get user ID first
    const userId = (req as any).user?.id;
    if (userId) return `user:${userId}`;

    // Fall back to IP address
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';
    return `ip:${ip}`;
  }

  /**
   * Check if request is within rate limit
   */
  isWithinLimit(clientId: string): boolean {
    const now = Date.now();
    let record = this.store[clientId];

    if (!record) {
      // First request from this client
      record = {
        tokens: this.config.maxRequests - 1,
        lastRefill: now,
      };
      this.store[clientId] = record;
      return true;
    }

    // Refill tokens based on time elapsed
    const timePassed = now - record.lastRefill;
    const tokensToAdd = (timePassed / this.config.windowMs) * this.config.maxRequests;

    record.tokens = Math.min(
      this.config.maxRequests,
      record.tokens + tokensToAdd
    );
    record.lastRefill = now;

    if (record.tokens >= 1) {
      record.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Middleware function
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = this.getClientId(req);

      if (this.isWithinLimit(clientId)) {
        next();
      } else {
        res.status(this.config.statusCode!).json({
          error: this.config.message,
          retryAfter: Math.ceil(this.config.windowMs / 1000),
        });
      }
    };
  }

  /**
   * Clean up old entries
   */
  private cleanup() {
    const now = Date.now();
    const maxAge = this.config.windowMs * 2;

    for (const [clientId, record] of Object.entries(this.store)) {
      if (now - record.lastRefill > maxAge) {
        delete this.store[clientId];
      }
    }
  }

  /**
   * Reset limit for a specific client
   */
  reset(clientId: string) {
    delete this.store[clientId];
  }

  /**
   * Reset all limits
   */
  resetAll() {
    this.store = {};
  }

  /**
   * Get current limit status for a client
   */
  getStatus(clientId: string) {
    const record = this.store[clientId];
    if (!record) {
      return {
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    return {
      remaining: Math.floor(record.tokens),
      resetTime: record.lastRefill + this.config.windowMs,
    };
  }
}

export { RateLimiter, RateLimitConfig };

/**
 * Pre-configured rate limiters
 */

// Upload endpoint: 10 requests per 15 minutes per user
export const uploadLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many uploads. Please wait before uploading again.',
});

// API endpoint: 100 requests per minute per user
export const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many API requests. Please try again later.',
});

// Authentication endpoint: 5 attempts per 15 minutes per IP
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again later.',
});
