import { expressjwt, GetVerificationKey } from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Extended Request type with auth property
 */
export interface AuthRequest extends Request {
  auth?: {
    sub: string;
    [key: string]: any;
  };
}

/**
 * Auth0 JWT verification middleware
 * Validates JWT tokens from Auth0 and attaches user info to request
 */
export const checkJwt = expressjwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }) as GetVerificationKey,
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
});

/**
 * Error handler for JWT authentication errors
 */
export const handleAuthError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
  next(err);
};

/**
 * Extract user ID from authenticated request
 */
export function getUserId(req: AuthRequest): string {
  if (!req.auth?.sub) {
    throw new Error('User not authenticated');
  }
  return req.auth.sub;
}
