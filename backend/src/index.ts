import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
console.log('🔧 Loading environment variables...');
const envPath = path.resolve(__dirname, '../../.env');
console.log('🔧 ENV file path:', envPath);
dotenv.config({ path: envPath });

console.log('🔧 Importing server modules...');
import { createServer } from './server';
import { createWebSocketServer } from './websocket/server';

console.log('🔧 Configuring environment...');
// Environment configuration
const PORT = parseInt(process.env.PORT || '3000');
const WS_PORT = parseInt(process.env.WS_PORT || '3001');
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🚀 Starting Al-Shorouk Radiology System in ${NODE_ENV} mode...`);
console.log(`🔧 PORT: ${PORT}, WS_PORT: ${WS_PORT}`);

// Validate required environment variables
const requiredEnvVars = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'JWT_SECRET',
];

console.log('🔧 Validating environment variables...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Error: Required environment variable ${envVar} is not set`);
    console.error(`Current value: ${process.env[envVar]}`);
    process.exit(1);
  } else {
    console.log(`✅ ${envVar} is set`);
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