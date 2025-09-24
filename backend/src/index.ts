import { createServer } from './server';
import { createWebSocketServer } from './websocket/server';

// Environment configuration
const PORT = parseInt(process.env.PORT || '3000');
const WS_PORT = parseInt(process.env.WS_PORT || '3001');
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`Starting Al-Shorouk Radiology System in ${NODE_ENV} mode...`);

// Validate required environment variables
const requiredEnvVars = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Required environment variable ${envVar} is not set`);
    process.exit(1);
  }
}

// Start servers
try {
  // Start the main Express server
  createServer(PORT);

  // Start the WebSocket server
  createWebSocketServer(WS_PORT);

  console.log('✅ All services started successfully');
  console.log(`🌐 Main API server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server: ws://localhost:${WS_PORT}`);
  console.log(`🏥 Al-Shorouk Radiology System is operational`);
} catch (error) {
  console.error('❌ Failed to start services:', error);
  process.exit(1);
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});