import { Router } from 'express';
import { HealthController } from './health.controller';
import { AuthMiddleware } from '../auth/auth.middleware';

export function createHealthRoutes(
  healthController: HealthController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public health check endpoint (no authentication required)
  router.get('/', healthController.getHealth.bind(healthController));

  // Public endpoint for basic health check
  router.get('/status', healthController.getHealth.bind(healthController));

  // Protected endpoints (require authentication)
  router.get('/detailed',
    authMiddleware.authenticate,
    healthController.getHealth.bind(healthController)
  );

  router.get('/history',
    authMiddleware.authenticate,
    healthController.getHealthHistory.bind(healthController)
  );

  router.get('/metrics',
    authMiddleware.authenticate,
    healthController.getSystemMetrics.bind(healthController)
  );

  router.get('/report',
    authMiddleware.authenticate,
    healthController.getHealthReport.bind(healthController)
  );

  // Component-specific health endpoints
  router.get('/database',
    authMiddleware.authenticate,
    healthController.getDatabaseHealth.bind(healthController)
  );

  router.get('/websocket',
    authMiddleware.authenticate,
    healthController.getWebSocketHealth.bind(healthController)
  );

  router.get('/memory',
    authMiddleware.authenticate,
    healthController.getMemoryHealth.bind(healthController)
  );

  router.get('/disk',
    authMiddleware.authenticate,
    healthController.getDiskHealth.bind(healthController)
  );

  // Database performance endpoints
  router.get('/slow-queries',
    authMiddleware.authenticate,
    healthController.getSlowQueries.bind(healthController)
  );

  router.get('/database-size',
    authMiddleware.authenticate,
    healthController.getDatabaseSize.bind(healthController)
  );

  return router;
}