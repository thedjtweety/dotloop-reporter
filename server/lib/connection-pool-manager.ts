/**
 * Connection Pool Manager
 * 
 * Manages database connection lifecycle and prevents memory leaks
 * from unclosed connections or connection pool exhaustion.
 */

import { getDb } from '../db';

/**
 * Graceful shutdown handler for database connections
 * Called when the server is shutting down to ensure all connections are closed
 */
export async function closeDbConnection(): Promise<void> {
  try {
    const db = await getDb();
    if (db && '$client' in db) {
      // Drizzle exposes the underlying mysql2 client
      const client = (db as any).$client;
      if (client && typeof client.end === 'function') {
        await client.end();
        console.log('[Database] Connection pool closed gracefully');
      }
    }
  } catch (error) {
    console.error('[Database] Error closing connection pool:', error);
  }
}

/**
 * Setup graceful shutdown handlers
 * Ensures database connections are properly closed on process termination
 */
export function setupGracefulShutdown(): void {
  const handleShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}, closing connections...`);
    
    try {
      await closeDbConnection();
      console.log('[Server] All connections closed');
      process.exit(0);
    } catch (error) {
      console.error('[Server] Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle SIGTERM (Docker, systemd, etc.)
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('[Server] Uncaught exception:', error);
    await closeDbConnection();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('[Server] Unhandled rejection at:', promise, 'reason:', reason);
    await closeDbConnection();
    process.exit(1);
  });
}

/**
 * Connection pool health check
 * Monitors connection pool status and logs warnings if issues detected
 */
export async function checkConnectionPoolHealth(): Promise<{
  healthy: boolean;
  connectionCount?: number;
  message: string;
}> {
  try {
    const db = await getDb();
    
    if (!db) {
      return {
        healthy: false,
        message: 'Database connection not available',
      };
    }

    // Try a simple query to verify connection is working
    const result = await (db as any).execute('SELECT 1');
    
    return {
      healthy: true,
      message: 'Connection pool is healthy',
    };
  } catch (error) {
    console.error('[Database] Connection pool health check failed:', error);
    return {
      healthy: false,
      message: `Connection pool health check failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Periodic health check interval
 * Runs connection pool health checks every 5 minutes
 */
let healthCheckInterval: NodeJS.Timeout | null = null;

export function startConnectionPoolHealthCheck(intervalMs: number = 5 * 60 * 1000): void {
  if (healthCheckInterval) {
    console.warn('[Database] Health check already running');
    return;
  }

  healthCheckInterval = setInterval(async () => {
    const health = await checkConnectionPoolHealth();
    if (!health.healthy) {
      console.warn(`[Database] Health check warning: ${health.message}`);
    }
  }, intervalMs);

  console.log(`[Database] Connection pool health check started (every ${intervalMs}ms)`);
}

export function stopConnectionPoolHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('[Database] Connection pool health check stopped');
  }
}
