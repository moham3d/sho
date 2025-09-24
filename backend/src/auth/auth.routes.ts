import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthMiddleware } from './auth.middleware';

export function createAuthRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public routes
  router.post('/login', authController.login);
  router.post('/refresh', authController.refreshToken);

  // Protected routes
  router.post('/logout', authMiddleware.authenticate, authController.logout);
  router.get('/profile', authMiddleware.authenticate, authController.getProfile);
  router.post('/change-password', authMiddleware.authenticate, authController.changePassword);

  return router;
}