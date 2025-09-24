import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { DatabaseService } from './database/DatabaseService';
import { AuthService } from './auth/AuthService';
import { WebSocketService } from './websocket/WebSocketService';
import { AuthController } from './auth/auth.controller';
import { AuthMiddleware } from './auth/auth.middleware';
import { HealthController } from './health/health.controller';
import { createAuthRoutes } from './auth/auth.routes';
import { createHealthRoutes } from './health/health.routes';

export function createServer(port: number = 3000): void {
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

  const authController = new AuthController(databaseService, authService);
  const authMiddleware = new AuthMiddleware(authService);
  const healthController = new HealthController(databaseService, null);

  // WebSocket service
  const webSocketService = new WebSocketService(server, databaseService, authService);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://alshorouk-radiology.com', 'https://www.alshorouk-radiology.com']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to all routes
  app.use(limiter);

  // Additional rate limiting for auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression middleware
  app.use(compression());

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const method = req.method;
      const url = req.originalUrl;
      const ip = req.ip || req.connection.remoteAddress;

      console.log(`${method} ${url} ${status} ${duration}ms - ${ip}`);
    });

    next();
  });

  // Health check endpoint (before auth middleware)
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
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Routes
  app.use('/api/auth', authLimiter, createAuthRoutes(authController, authMiddleware));
  app.use('/api/health', createHealthRoutes(healthController, authMiddleware));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Global error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express error:', err);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(500).json({
      error: 'Internal Server Error',
      message: isDevelopment ? err.message : 'Something went wrong',
      ...(isDevelopment && { stack: err.stack }),
    });
  });

  // Start server
  server.listen(port, () => {
    console.log(`Express server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${databaseService.getPool().options.host}:${databaseService.getPool().options.port}/${databaseService.getPool().options.database}`);
  });

  // Handle graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received shutdown signal. Gracefully shutting down server...');

    server.close(async () => {
      console.log('Express server closed');

      // Shutdown services
      webSocketService.shutdown();
      await databaseService.close();

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