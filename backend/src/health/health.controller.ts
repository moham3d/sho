import { Request, Response } from 'express';
import { HealthService } from './HealthService';
import { DatabaseService } from '../database/DatabaseService';
import { WebSocketService } from '../websocket/WebSocketService';

export class HealthController {
  private healthService: HealthService;

  constructor(databaseService: DatabaseService, webSocketService: WebSocketService) {
    this.healthService = new HealthService(databaseService, webSocketService);
  }

  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthService.getHealthCheck();

      const statusCode = health.status === 'healthy' ? 200 :
                        health.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json({
        status: health.status,
        timestamp: health.timestamp,
        uptime: health.uptime,
        version: health.version,
        components: health.components,
        metrics: health.metrics,
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getHealthHistory(req: Request, res: Response): Promise<void> {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const history = await this.healthService.getHealthHistory(hours);

      res.json({
        status: 'success',
        data: history,
        count: history.length,
        period: `${hours} hours`,
      });
    } catch (error) {
      console.error('Failed to fetch health history:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch health history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.healthService.getSystemMetrics();

      res.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        data: metrics,
      });
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch system metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getHealthReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await this.healthService.generateHealthReport();

      res.set('Content-Type', 'text/plain');
      res.send(report);
    } catch (error) {
      console.error('Failed to generate health report:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate health report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getDatabaseHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthService.getHealthCheck();

      res.json({
        status: health.components.database.status,
        timestamp: health.components.database.lastChecked,
        responseTime: health.components.database.responseTime,
        poolSize: health.components.database.poolSize,
        availableConnections: health.components.database.availableConnections,
        waitingClients: health.components.database.waitingClients,
        details: health.components.database.details,
      });
    } catch (error) {
      console.error('Failed to fetch database health:', error);
      res.status(500).json({
        status: 'unhealthy',
        message: 'Failed to fetch database health',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getWebSocketHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthService.getHealthCheck();

      res.json({
        status: health.components.websocket.status,
        timestamp: health.components.websocket.lastBroadcast,
        activeConnections: health.components.websocket.activeConnections,
        authenticatedConnections: health.components.websocket.authenticatedConnections,
        uptime: health.components.websocket.uptime,
      });
    } catch (error) {
      console.error('Failed to fetch WebSocket health:', error);
      res.status(500).json({
        status: 'unhealthy',
        message: 'Failed to fetch WebSocket health',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getMemoryHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthService.getHealthCheck();

      res.json({
        status: health.components.memory.status,
        timestamp: new Date().toISOString(),
        total: health.components.memory.total,
        used: health.components.memory.used,
        free: health.components.memory.free,
        usagePercentage: health.components.memory.usagePercentage,
        details: health.components.memory.details,
      });
    } catch (error) {
      console.error('Failed to fetch memory health:', error);
      res.status(500).json({
        status: 'unhealthy',
        message: 'Failed to fetch memory health',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getDiskHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.healthService.getHealthCheck();

      res.json({
        status: health.components.disk.status,
        timestamp: new Date().toISOString(),
        path: health.components.disk.path,
        total: health.components.disk.total,
        used: health.components.disk.used,
        free: health.components.disk.free,
        usagePercentage: health.components.disk.usagePercentage,
      });
    } catch (error) {
      console.error('Failed to fetch disk health:', error);
      res.status(500).json({
        status: 'unhealthy',
        message: 'Failed to fetch disk health',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getSlowQueries(req: Request, res: Response): Promise<void> {
    try {
      const threshold = parseInt(req.query.threshold as string) || 1000;
      const slowQueries = await this.healthService['databaseService'].getSlowQueries(threshold);

      res.json({
        status: 'success',
        threshold: threshold,
        count: slowQueries.length,
        data: slowQueries,
      });
    } catch (error) {
      console.error('Failed to fetch slow queries:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch slow queries',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getDatabaseSize(req: Request, res: Response): Promise<void> {
    try {
      const sizeInfo = await this.healthService['databaseService'].getDatabaseSize();

      res.json({
        status: 'success',
        data: sizeInfo,
      });
    } catch (error) {
      console.error('Failed to fetch database size:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch database size',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}