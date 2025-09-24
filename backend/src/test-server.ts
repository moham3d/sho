import 'dotenv/config';

console.log('Starting Al-Shorouk Radiology System in development mode...');

// Environment configuration
const PORT = parseInt(process.env.PORT || '3000');
const WS_PORT = parseInt(process.env.WS_PORT || '3001');
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`Environment: ${NODE_ENV}`);
console.log(`Main Port: ${PORT}`);
console.log(`WebSocket Port: ${WS_PORT}`);

// Validate required environment variables
const requiredEnvVars = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'JWT_SECRET',
];

console.log('Checking required environment variables...');

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Required environment variable ${envVar} is not set`);
    process.exit(1);
  } else {
    console.log(`✓ ${envVar} is set`);
  }
}

console.log('All environment variables are set!');
console.log('Environment variables validation passed.');