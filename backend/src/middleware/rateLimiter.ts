import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  const store: RateLimitStore = {};

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + options.windowMs
      };
      return next();
    }

    store[ip].count++;

    if (store[ip].count > options.max) {
      const retrySecs = Math.ceil((store[ip].resetTime - now) / 1000);
      res.setHeader('Retry-After', retrySecs);
      return res.status(429).json({
        success: false,
        error: options.message || 'Too many requests. Please try again later.',
        retryAfterSeconds: retrySecs
      });
    }

    next();
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // 30 attempts per 15 min window
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 min
  max: 300,
  message: 'API rate limit exceeded. Please throttle requests.'
});
