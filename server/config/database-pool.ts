import { Pool, PoolOptions } from 'mysql2/promise';
import mysql from 'mysql2/promise';

/**
 * Database Connection Pool Configuration
 * 
 * Optimizes database connections for production use
 * Implements connection pooling for better performance
 */

interface PoolConfig extends PoolOptions {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}

class DatabasePoolManager {
  private pool: Pool | null = null;
  private config: PoolConfig;

  constructor(config: PoolConfig) {
    this.config = {
      port: 3306,
      ...config,
      // Pool configuration
      waitForConnections: true,
      connectionLimit: 10, // Max connections in pool
      queueLimit: 0, // Unlimited queue
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    try {
      this.pool = await mysql.createPool(this.config);
      console.log('Database connection pool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database connection pool:', error);
      throw error;
    }
  }

  /**
   * Get a connection from the pool
   */
  async getConnection() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    return this.pool.getConnection();
  }

  /**
   * Execute a query
   */
  async query(sql: string, values?: any[]) {
    const connection = await this.getConnection();
    try {
      const [results] = await connection.execute(sql, values);
      return results;
    } finally {
      connection.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback: (connection: any) => Promise<void>) {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      await callback(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      connectionLimit: this.config.connectionLimit,
      queueLimit: this.config.queueLimit,
      // Note: mysql2 doesn't expose detailed pool stats directly
      // You may need to implement custom tracking
    };
  }

  /**
   * Close the pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

/**
 * Create and export a singleton instance
 */
let poolManager: DatabasePoolManager | null = null;

export async function initializeDatabase(config: PoolConfig): Promise<DatabasePoolManager> {
  if (!poolManager) {
    poolManager = new DatabasePoolManager(config);
    await poolManager.initialize();
  }
  return poolManager;
}

export function getDatabasePool(): DatabasePoolManager {
  if (!poolManager) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return poolManager;
}

/**
 * Production-optimized pool configuration
 */
export const productionPoolConfig: Partial<PoolConfig> = {
  connectionLimit: 20, // More connections for production
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  waitForConnections: true,
};

/**
 * Development pool configuration
 */
export const developmentPoolConfig: Partial<PoolConfig> = {
  connectionLimit: 5, // Fewer connections for development
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  waitForConnections: true,
};

/**
 * Testing pool configuration
 */
export const testingPoolConfig: Partial<PoolConfig> = {
  connectionLimit: 2, // Minimal connections for testing
  queueLimit: 0,
  enableKeepAlive: false,
  waitForConnections: true,
};

export { DatabasePoolManager };
