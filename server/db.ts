import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for reliable connections
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with retry logic
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3, // Allow more connections but keep reasonable
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000, // Shorter idle timeout to prevent stale connections
  allowExitOnIdle: false
});

// Add error handling for pool
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

export const db = drizzle({ client: pool, schema });

// Test database connection on startup
export async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}