import express from 'express';
import { createServer } from 'http';
import { DatabaseService } from '../database/DatabaseService';
import { AuthService } from '../auth/AuthService';
import { WebSocketService } from './WebSocketService';

export function createWebSocketServer(port: number = 3001): void {
  const app = express();
  const server = createServer(app);

  // Initialize services
  const databaseService = new DatabaseService({
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'radiology_db',
    user: process.env.POSTGRES_USER || 'radiology_user',
    password: process.env.POSTGRES_PASSWORD || 'secure_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const authService = new AuthService(
    databaseService.getPool(),
    process.env.JWT_SECRET || 'your-secret-key',
    '15m',
    '7d'
  );

  const webSocketService = new WebSocketService(server, databaseService, authService);

  // Basic express routes for health checks
  app.get('/health', async (req, res) => {
    try {
      const dbHealth = await databaseService.healthCheck();
      const wsStats = webSocketService.getConnectionStats();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
        websocket: wsStats,
        uptime: process.uptime(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  });

  app.get('/metrics', async (req, res) => {
    try {
      const dbHealth = await databaseService.healthCheck();
      const wsStats = webSocketService.getConnectionStats();
      const dbSize = await databaseService.getDatabaseSize();

      res.json({
        timestamp: new Date().toISOString(),
        database: {
          health: dbHealth,
          size: dbSize.size,
          tableCount: dbSize.tableCount,
        },
        websocket: wsStats,
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch metrics',
        message: error.message,
      });
    }
  });

  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('WebSocket server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  });

  // Start server
  server.listen(port, () => {
    console.log(`WebSocket server running on port ${port}`);
  });

  // Handle graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received shutdown signal. Gracefully shutting down WebSocket server...');

    server.close(() => {
      console.log('WebSocket server closed');
      webSocketService.shutdown();
      databaseService.close();
      process.exit(0);
    });

    // Force close after timeout
    setTimeout(() => {
      console.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Register shutdown handlers
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    gracefulShutdown();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
  });
}