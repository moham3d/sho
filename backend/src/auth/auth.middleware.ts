import { Request, Response, NextFunction } from 'express';
import { AuthService } from './AuthService';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    username: string;
    email: string;
    role: string;
    type: string;
    iat: number;
    exp: number;
  };
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Bearer token is required'
        });
        return;
      }

      const token = authHeader.substring(7);
      const decoded = await this.authService.verifyToken(token);

      // Check if token is access token
      if (decoded.type !== 'access') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token type'
        });
        return;
      }

      // Set user info on request object
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
  };

  requireRole = (roles: string | string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const userRoles = Array.isArray(roles) ? roles : [roles];
      const userRole = req.user?.role;

      if (!userRole || !userRoles.includes(userRole)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };

  requireAnyRole = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const userRole = req.user?.role;

      if (!userRole || !roles.includes(userRole)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };

  optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = await this.authService.verifyToken(token);

        if (decoded.type === 'access') {
          req.user = decoded;
        }
      }

      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  };
}