import { Server as WebSocketServer } from 'ws';
import { Server as HTTPServer } from 'http';
import { DatabaseService } from '../database/DatabaseService';
import { AuthService } from '../auth/AuthService';

export interface ClientMessage {
  type: string;
  payload?: any;
  timestamp: number;
}

export interface ServerMessage {
  type: string;
  payload?: any;
  timestamp: number;
}

export interface AuthenticatedClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  userRole?: string;
  lastPing: number;
  ipAddress: string;
  userAgent: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedClient> = new Map();
  private databaseService: DatabaseService;
  private authService: AuthService;
  private heartbeatInterval: NodeJS.Timeout;
  private broadcastInterval: NodeJS.Timeout;

  constructor(
    server: HTTPServer,
    databaseService: DatabaseService,
    authService: AuthService
  ) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      maxPayload: 1024, // 1KB limit
      verifyClient: this.verifyClient.bind(this),
    });

    this.databaseService = databaseService;
    this.authService = authService;

    this.setupEventHandlers();
    this.startHeartbeat();
    this.startBroadcast();
  }

  private verifyClient(info: any, callback: (result: boolean) => void): void {
    // Allow all connections for now, authentication happens after connection
    callback(true);
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));
    this.wss.on('close', this.handleServerClose.bind(this));
  }

  private handleConnection(ws: WebSocket, request: any): void {
    const clientId = this.generateClientId();
    const client: AuthenticatedClient = {
      id: clientId,
      ws,
      lastPing: Date.now(),
      ipAddress: request.socket.remoteAddress || 'unknown',
      userAgent: request.headers['user-agent'] || 'unknown',
    };

    this.clients.set(clientId, client);

    console.log(`WebSocket client connected: ${clientId}`);

    // Send welcome message
    this.sendMessage(client, {
      type: 'connection_established',
      payload: {
        clientId,
        message: 'Connected to Al-Shorouk Radiology System',
      },
      timestamp: Date.now(),
    });

    // Set up client event handlers
    ws.on('message', (data) => this.handleClientMessage(clientId, data));
    ws.on('close', () => this.handleClientDisconnect(clientId));
    ws.on('error', (error) => this.handleClientError(clientId, error));
    ws.on('pong', () => this.handleClientPong(clientId));
  }

  private async handleClientMessage(clientId: string, data: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message: ClientMessage = JSON.parse(data.toString());
      message.timestamp = Date.now();

      // Validate message structure
      if (!message.type || typeof message.type !== 'string') {
        this.sendMessage(client, {
          type: 'error',
          payload: {
            message: 'Invalid message format',
          },
          timestamp: Date.now(),
        });
        return;
      }

      // Handle different message types
      switch (message.type) {
        case 'authenticate':
          await this.handleAuthentication(client, message.payload);
          break;
        case 'ping':
          this.handleClientPing(clientId);
          break;
        case 'subscribe':
          await this.handleSubscription(client, message.payload);
          break;
        case 'unsubscribe':
          await this.handleUnsubscription(client, message.payload);
          break;
        case 'system_health':
          await this.handleSystemHealthRequest(client);
          break;
        case 'get_active_users':
          await this.handleActiveUsersRequest(client);
          break;
        default:
          this.sendMessage(client, {
            type: 'error',
            payload: {
              message: `Unknown message type: ${message.type}`,
            },
            timestamp: Date.now(),
          });
      }
    } catch (error) {
      console.error('Error handling client message:', error);
      this.sendMessage(client, {
        type: 'error',
        payload: {
          message: 'Failed to process message',
        },
        timestamp: Date.now(),
      });
    }
  }

  private async handleAuthentication(
    client: AuthenticatedClient,
    payload: { token: string }
  ): Promise<void> {
    try {
      const { token } = payload;
      if (!token) {
        this.sendMessage(client, {
          type: 'authentication_failed',
          payload: {
            message: 'Token is required',
          },
          timestamp: Date.now(),
        });
        return;
      }

      const decoded = await this.authService.verifyToken(token);
      if (decoded.type !== 'access') {
        this.sendMessage(client, {
          type: 'authentication_failed',
          payload: {
            message: 'Invalid token type',
          },
          timestamp: Date.now(),
        });
        return;
      }

      // Update client with user info
      client.userId = decoded.sub;
      client.userRole = decoded.role;

      this.sendMessage(client, {
        type: 'authenticated',
        payload: {
          userId: decoded.sub,
          username: decoded.username,
          role: decoded.role,
        },
        timestamp: Date.now(),
      });

      // Broadcast user connection to other clients
      this.broadcast({
        type: 'user_connected',
        payload: {
          userId: decoded.sub,
          username: decoded.username,
          role: decoded.role,
        },
        timestamp: Date.now(),
      }, client.id);

      console.log(`WebSocket client authenticated: ${client.id} as ${decoded.username}`);
    } catch (error) {
      this.sendMessage(client, {
        type: 'authentication_failed',
        payload: {
          message: 'Invalid token',
        },
        timestamp: Date.now(),
      });
    }
  }

  private handleClientPing(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
      client.ws.pong();
    }
  }

  private handleClientPong(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
    }
  }

  private async handleSubscription(
    client: AuthenticatedClient,
    payload: { channels: string[] }
  ): Promise<void> {
    // For now, just acknowledge subscription
    this.sendMessage(client, {
      type: 'subscribed',
      payload: {
        channels: payload.channels || [],
      },
      timestamp: Date.now(),
    });
  }

  private async handleUnsubscription(
    client: AuthenticatedClient,
    payload: { channels: string[] }
  ): Promise<void> {
    this.sendMessage(client, {
      type: 'unsubscribed',
      payload: {
        channels: payload.channels || [],
      },
      timestamp: Date.now(),
    });
  }

  private async handleSystemHealthRequest(client: AuthenticatedClient): Promise<void> {
    try {
      const health = await this.databaseService.healthCheck();
      const stats = this.getConnectionStats();

      this.sendMessage(client, {
        type: 'system_health',
        payload: {
          database: health,
          websocket: stats,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.sendMessage(client, {
        type: 'error',
        payload: {
          message: 'Failed to fetch system health',
        },
        timestamp: Date.now(),
      });
    }
  }

  private async handleActiveUsersRequest(client: AuthenticatedClient): Promise<void> {
    try {
      const activeUsers = Array.from(this.clients.values())
        .filter(c => c.userId && c.userRole)
        .map(c => ({
          userId: c.userId,
          role: c.userRole,
          connectedAt: c.lastPing,
        }));

      this.sendMessage(client, {
        type: 'active_users',
        payload: {
          users: activeUsers,
          count: activeUsers.length,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.sendMessage(client, {
        type: 'error',
        payload: {
          message: 'Failed to fetch active users',
        },
        timestamp: Date.now(),
      });
    }
  }

  private handleClientDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Broadcast user disconnection
      if (client.userId) {
        this.broadcast({
          type: 'user_disconnected',
          payload: {
            userId: client.userId,
          },
          timestamp: Date.now(),
        }, client.id);
      }

      this.clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}`);
    }
  }

  private handleClientError(clientId: string, error: Error): void {
    console.error(`WebSocket client error: ${clientId}`, error);
    this.handleClientDisconnect(clientId);
  }

  private handleServerError(error: Error): void {
    console.error('WebSocket server error:', error);
  }

  private handleServerClose(): void {
    console.log('WebSocket server closed');
    this.stopHeartbeat();
    this.stopBroadcast();
  }

  private sendMessage(client: AuthenticatedClient, message: ServerMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message to client:', error);
      }
    }
  }

  private broadcast(message: ServerMessage, excludeClientId?: string): void {
    const messageString = JSON.stringify(message);

    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(messageString);
        } catch (error) {
          console.error('Failed to broadcast message to client:', error);
        }
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds

      this.clients.forEach((client, clientId) => {
        if (now - client.lastPing > timeout) {
          console.log(`WebSocket client timeout: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
        } else {
          // Send ping to check connection
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.ping();
          }
        }
      });
    }, 30000); // Check every 30 seconds
  }

  private startBroadcast(): void {
    this.broadcastInterval = setInterval(async () => {
      try {
        // Broadcast system health periodically
        const health = await this.databaseService.healthCheck();
        const stats = this.getConnectionStats();

        this.broadcast({
          type: 'system_health_update',
          payload: {
            database: health,
            websocket: stats,
          },
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Failed to broadcast system health:', error);
      }
    }, 60000); // Every minute
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  private stopBroadcast(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getConnectionStats() {
    return {
      totalConnections: this.clients.size,
      authenticatedConnections: Array.from(this.clients.values()).filter(c => c.userId).length,
      uptime: process.uptime(),
    };
  }

  // Public methods for external services to broadcast messages
  public broadcastError(error: any): void {
    this.broadcast({
      type: 'system_error',
      payload: {
        message: error.message || 'Unknown error',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  }

  public broadcastUserActivity(userId: string, activity: string): void {
    this.broadcast({
      type: 'user_activity',
      payload: {
        userId,
        activity,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  }

  public broadcastFormUpdate(formId: string, formType: string, status: string): void {
    this.broadcast({
      type: 'form_update',
      payload: {
        formId,
        formType,
        status,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  }

  public shutdown(): void {
    console.log('Shutting down WebSocket service...');

    // Close all client connections
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1001, 'Server shutting down');
      }
    });

    // Clear intervals
    this.stopHeartbeat();
    this.stopBroadcast();

    // Close server
    this.wss.close();
    console.log('WebSocket service shutdown complete');
  }
}