// Authentication Middleware
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { query } from '../config/database.js';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.auth = payload;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Token is invalid or expired' },
    });
  }
}

// Optional auth — sets req.auth if token present but doesn't require it
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      req.auth = jwt.verify(token, config.jwt.secret) as AuthPayload;
    } catch {
      // Token invalid — continue without auth
    }
  }
  next();
}

// Generate tokens
export function generateTokens(payload: AuthPayload): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
}
