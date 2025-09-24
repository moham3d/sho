import { DatabaseService } from '../database/DatabaseService';
import { WebSocketService } from '../websocket/WebSocketService';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  components: {
    database: DatabaseHealth;
    websocket: WebSocketHealth;
    memory: MemoryHealth;
    disk: DiskHealth;
  };
  metrics: {
    activeConnections: number;
    responseTime: number;
    errorRate: number;
  };
}

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  poolSize: number;
  availableConnections: number;
  waitingClients: number;
  lastChecked: string;
  details?: {
    maxConnections: number;
    activeConnections: number;
    idleConnections: number;
  };
}

export interface WebSocketHealth {
  status: 'healthy' | 'unhealthy';
  activeConnections: number;
  authenticatedConnections: number;
  uptime: number;
  lastBroadcast: string;
}

export interface MemoryHealth {
  status: 'healthy' | 'warning' | 'critical';
  total: number;
  used: number;
  free: number;
  usagePercentage: number;
  details?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

export interface DiskHealth {
  status: 'healthy' | 'warning' | 'critical';
  total: number;
  used: number;
  free: number;
  usagePercentage: number;
  path: string;
}

export class HealthService {
  private databaseService: DatabaseService;
  private webSocketService: WebSocketService;
  private version: string;
  private startTime: number;
  private healthHistory: HealthCheck[] = [];

  constructor(
    databaseService: DatabaseService,
    webSocketService: WebSocketService,
    version: string = '1.0.0'
  ) {
    this.databaseService = databaseService;
    this.webSocketService = webSocketService;
    this.version = version;
    this.startTime = Date.now();
  }

  async getHealthCheck(): Promise<HealthCheck> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    const [database, memory, disk] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    const websocket = this.checkWebSocket();

    // Determine overall status
    const componentStatuses = [
      database.status,
      websocket.status,
      memory.status,
      disk.status,
    ];

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (componentStatuses.includes('unhealthy')) {
      status = 'unhealthy';
    } else if (componentStatuses.includes('warning') || componentStatuses.includes('degraded')) {
      status = 'degraded';
    }

    const healthCheck: HealthCheck = {
      status,
      timestamp,
      uptime,
      version: this.version,
      components: {
        database,
        websocket,
        memory,
        disk,
      },
      metrics: {
        activeConnections: websocket.activeConnections,
        responseTime: database.responseTime,
        errorRate: this.calculateErrorRate(),
      },
    };

    // Store in history (keep last 100 checks)
    this.healthHistory.push(healthCheck);
    if (this.healthHistory.length > 100) {
      this.healthHistory.shift();
    }

    return healthCheck;
  }

  private async checkDatabase(): Promise<DatabaseHealth> {
    try {
      const result = await this.databaseService.healthCheck();
      const poolStats = this.databaseService.getPoolStats();

      const status = result.status === 'healthy' ? 'healthy' : 'unhealthy';

      return {
        status,
        responseTime: result.responseTime,
        poolSize: poolStats.totalCount,
        availableConnections: poolStats.idleCount,
        waitingClients: poolStats.waitingCount,
        lastChecked: new Date().toISOString(),
        details: {
          maxConnections: 20, // Based on pool configuration
          activeConnections: poolStats.totalCount - poolStats.idleCount,
          idleConnections: poolStats.idleCount,
        },
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: 0,
        poolSize: 0,
        availableConnections: 0,
        waitingClients: 0,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private checkWebSocket(): WebSocketHealth {
    try {
      const stats = this.webSocketService.getConnectionStats();

      return {
        status: 'healthy',
        activeConnections: stats.totalConnections,
        authenticatedConnections: stats.authenticatedConnections,
        uptime: stats.uptime,
        lastBroadcast: new Date().toISOString(),
      };
    } catch (error) {
      console.error('WebSocket health check failed:', error);
      return {
        status: 'unhealthy',
        activeConnections: 0,
        authenticatedConnections: 0,
        uptime: 0,
        lastBroadcast: new Date().toISOString(),
      };
    }
  }

  private checkMemory(): MemoryHealth {
    const memoryUsage = process.memoryUsage();
    const total = require('os').totalmem();
    const free = require('os').freemem();
    const used = total - free;
    const usagePercentage = (used / total) * 100;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (usagePercentage > 90) {
      status = 'critical';
    } else if (usagePercentage > 75) {
      status = 'warning';
    }

    return {
      status,
      total,
      used,
      free,
      usagePercentage,
      details: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
    };
  }

  private async checkDisk(): Promise<DiskHealth> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const diskPath = process.cwd();

      const stats = await fs.statfs(diskPath);
      const total = stats.blocks * stats.bsize;
      const free = stats.bavail * stats.bsize;
      const used = total - free;
      const usagePercentage = (used / total) * 100;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (usagePercentage > 90) {
        status = 'critical';
      } else if (usagePercentage > 80) {
        status = 'warning';
      }

      return {
        status,
        total,
        used,
        free,
        usagePercentage,
        path: diskPath,
      };
    } catch (error) {
      console.error('Disk health check failed:', error);
      return {
        status: 'unhealthy',
        total: 0,
        used: 0,
        free: 0,
        usagePercentage: 100,
        path: 'unknown',
      };
    }
  }

  private calculateErrorRate(): number {
    // For now, return a mock error rate
    // In a real implementation, this would track actual errors
    return 0.01; // 1% error rate
  }

  async getHealthHistory(hours: number = 24): Promise<HealthCheck[]> {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.healthHistory.filter(check =>
      new Date(check.timestamp).getTime() > cutoff
    );
  }

  async getSystemMetrics(): Promise<{
    cpu: CpuMetrics;
    memory: MemoryMetrics;
    disk: DiskMetrics;
    network: NetworkMetrics;
  }> {
    const os = require('os');

    return {
      cpu: {
        usage: await this.getCpuUsage(),
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      disk: await this.getDiskMetrics(),
      network: await this.getNetworkMetrics(),
    };
  }

  private async getCpuUsage(): Promise<number> {
    const startMeasure = this.cpuAverage();

    // Wait 100ms for CPU usage measurement
    await new Promise(resolve => setTimeout(resolve, 100));

    const endMeasure = this.cpuAverage();

    const idleDiff = endMeasure.idle - startMeasure.idle;
    const totalDiff = endMeasure.total - startMeasure.total;

    return 100 - (idleDiff / totalDiff) * 100;
  }

  private cpuAverage() {
    const os = require('os');
    const cpus = os.cpus();

    let idle = 0;
    let total = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    });

    return { idle, total };
  }

  private async getDiskMetrics(): Promise<{
    readBytes: number;
    writeBytes: number;
    readOps: number;
    writeOps: number;
  }> {
    try {
      const fs = require('fs');
      const stats = fs.readFileSync('/proc/diskstats', 'utf8');

      // Simple disk metrics (Linux only)
      const lines = stats.trim().split('\n');
      const diskLine = lines[lines.length - 1];
      const parts = diskLine.split(/\s+/);

      return {
        readBytes: parseInt(parts[5]) * 512, // Convert sectors to bytes
        writeBytes: parseInt(parts[9]) * 512,
        readOps: parseInt(parts[3]),
        writeOps: parseInt(parts[7]),
      };
    } catch (error) {
      // Return default metrics if disk stats are not available
      return {
        readBytes: 0,
        writeBytes: 0,
        readOps: 0,
        writeOps: 0,
      };
    }
  }

  private async getNetworkMetrics(): Promise<{
    bytesReceived: number;
    bytesTransmitted: number;
    packetsReceived: number;
    packetsTransmitted: number;
  }> {
    try {
      const fs = require('fs');
      const stats = fs.readFileSync('/proc/net/dev', 'utf8');

      const lines = stats.trim().split('\n');
      const interfaceLine = lines.find(line => line.startsWith('eth0')) || lines[lines.length - 1];
      const parts = interfaceLine.trim().split(/\s+/);

      return {
        bytesReceived: parseInt(parts[1]),
        bytesTransmitted: parseInt(parts[9]),
        packetsReceived: parseInt(parts[2]),
        packetsTransmitted: parseInt(parts[10]),
      };
    } catch (error) {
      // Return default metrics if network stats are not available
      return {
        bytesReceived: 0,
        bytesTransmitted: 0,
        packetsReceived: 0,
        packetsTransmitted: 0,
      };
    }
  }

  async generateHealthReport(): Promise<string> {
    const health = await this.getHealthCheck();
    const metrics = await this.getSystemMetrics();

    const report = `
System Health Report - ${health.timestamp}
==============================================

Overall Status: ${health.status.toUpperCase()}
Uptime: ${Math.floor(health.uptime / 1000 / 60)} minutes
Version: ${health.version}

Components:
- Database: ${health.components.database.status} (${health.components.database.responseTime}ms)
- WebSocket: ${health.components.websocket.status} (${health.components.websocket.activeConnections} connections)
- Memory: ${health.components.memory.status} (${health.components.memory.usagePercentage.toFixed(1)}% used)
- Disk: ${health.components.disk.status} (${health.components.disk.usagePercentage.toFixed(1)}% used)

System Metrics:
- CPU: ${metrics.cpu.usage.toFixed(1)}% (${metrics.cpu.cores} cores)
- Memory: ${metrics.memory.usagePercentage.toFixed(1)}% used
- Load Average: ${metrics.cpu.loadAverage.map(avg => avg.toFixed(2)).join(', ')}
    `.trim();

    return report;
  }
}

interface CpuMetrics {
  usage: number;
  cores: number;
  loadAverage: number[];
}

interface MemoryMetrics {
  total: number;
  free: number;
  used: number;
  usagePercentage: number;
}

interface DiskMetrics {
  readBytes: number;
  writeBytes: number;
  readOps: number;
  writeOps: number;
}

interface NetworkMetrics {
  bytesReceived: number;
  bytesTransmitted: number;
  packetsReceived: number;
  packetsTransmitted: number;
}