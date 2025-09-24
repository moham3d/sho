import dotenv from 'dotenv';
import path from 'path';

console.log('Debug: Starting environment variable loading...');
console.log('Debug: Current working directory:', process.cwd());
console.log('Debug: __dirname:', __dirname);

// Load environment variables from the root .env file
const envPath = path.resolve(__dirname, '../../.env');
console.log('Debug: Trying to load .env from:', envPath);

const result = dotenv.config({ path: envPath });
console.log('Debug: dotenv result:', result);

console.log('Debug: Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
console.log('POSTGRES_PORT:', process.env.POSTGRES_PORT);
console.log('POSTGRES_DB:', process.env.POSTGRES_DB);
console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');

// Test validation
const requiredEnvVars = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'JWT_SECRET',
];

console.log('Debug: Checking required environment variables...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Required environment variable ${envVar} is not set`);
  } else {
    console.log(`✅ ${envVar} is set`);
  }
}

console.log('Debug: Environment validation complete.');