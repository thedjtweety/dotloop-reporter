/**
 * Health Check Router - tRPC endpoints for API health monitoring
 */

import { router, publicProcedure } from './_core/trpc';
import { performHealthChecks, logHealthStatus } from './lib/health-monitor';

export const healthRouter = router({
  /**
   * Get current health status
   */
  check: publicProcedure.query(async () => {
    try {
      const health = await performHealthChecks();
      
      // Log the health status
      logHealthStatus(health);
      
      return health;
    } catch (error) {
      console.error('[Health Router] Health check failed:', error);
      
      return {
        status: 'unhealthy' as const,
        timestamp: new Date().toISOString(),
        uptime: 0,
        checks: [
          {
            name: 'Health Check System',
            status: 'fail' as const,
            message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
            duration: 0,
          },
        ],
        summary: {
          totalChecks: 1,
          passed: 0,
          warnings: 0,
          failed: 1,
          successRate: 0,
        },
      };
    }
  }),

  /**
   * Get detailed diagnostics
   */
  diagnostics: publicProcedure.query(async () => {
    try {
      const health = await performHealthChecks();
      
      return {
        health,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          env: process.env.NODE_ENV || 'development',
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
      };
    } catch (error) {
      throw new Error(`Diagnostics check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),

  /**
   * Ping endpoint for simple connectivity check
   */
  ping: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Server is running',
    };
  }),
});
