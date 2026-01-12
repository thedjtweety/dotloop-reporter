import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;
let _healthCheckInterval: NodeJS.Timeout | null = null;
let _isConnected = false;

/**
 * Create a connection pool with proper configuration
 */
async function createPool(): Promise<mysql.Pool> {
  if (_pool) {
    return _pool;
  }

  try {
    const url = new URL(process.env.DATABASE_URL || "");
    
    // Create pool with proper configuration
    const poolConfig: any = {
      host: url.hostname,
      port: parseInt(url.port || "3306"),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
    };
    
    // Use SSL for secure connections if needed
    if (parseInt(url.port || "3306") > 3306 || url.hostname.includes('tidb') || url.hostname.includes('cloud')) {
      poolConfig.ssl = {};
    }
    
    _pool = mysql.createPool(poolConfig);

    // Test the connection
    const connection = await _pool.getConnection();
    await connection.ping();
    connection.release();
    
    _isConnected = true;
    console.log("[Database] Connection pool created successfully");
    
    // Start health check
    startHealthCheck();
    
    return _pool;
  } catch (error) {
    console.error("[Database] Failed to create connection pool:", error);
    _pool = null;
    _isConnected = false;
    throw error;
  }
}

/**
 * Start periodic health checks to detect connection drops
 */
function startHealthCheck() {
  if (_healthCheckInterval) {
    return; // Already running
  }

  _healthCheckInterval = setInterval(async () => {
    if (!_pool) return;

    try {
      const connection = await _pool.getConnection();
      await connection.ping();
      connection.release();
      
      if (!_isConnected) {
        _isConnected = true;
        console.log("[Database] Connection restored");
      }
    } catch (error) {
      if (_isConnected) {
        _isConnected = false;
        console.warn("[Database] Connection health check failed:", error instanceof Error ? error.message : error);
      }
      
      // Try to recreate the pool on connection failure
      _pool = null;
      _db = null;
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Stop health checks
 */
export function stopHealthCheck() {
  if (_healthCheckInterval) {
    clearInterval(_healthCheckInterval);
    _healthCheckInterval = null;
  }
}

/**
 * Get or create the drizzle database instance with connection pooling
 */
export async function getDb() {
  if (_db && _isConnected) {
    return _db;
  }

  if (!process.env.DATABASE_URL) {
    console.warn("[Database] DATABASE_URL not set");
    return null;
  }

  try {
    // Create or get the pool
    const pool = await createPool();
    
    // Create drizzle instance from the pool
    _db = drizzle(pool);
    _isConnected = true;
    
    return _db;
  } catch (error) {
    console.error("[Database] Failed to get database instance:", error);
    _db = null;
    _isConnected = false;
    return null;
  }
}

/**
 * Close the database connection pool
 */
export async function closeDb() {
  stopHealthCheck();
  
  if (_pool) {
    try {
      await _pool.end();
      console.log("[Database] Connection pool closed");
    } catch (error) {
      console.error("[Database] Error closing pool:", error);
    }
    _pool = null;
  }
  
  _db = null;
  _isConnected = false;
}

/**
 * Check if database is connected
 */
export function isDbConnected(): boolean {
  return _isConnected;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Import tenant context helper
    const { getTenantId } = await import('./lib/tenant-context');
    const tenantId = user.tenantId || await getTenantId();

    const values: InsertUser = {
      tenantId,
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
