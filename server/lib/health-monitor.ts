/**
 * Health Monitor - API health checking and diagnostics
 * 
 * Monitors the health of critical API endpoints and provides diagnostics
 * for troubleshooting server issues.
 */

import { getDb } from '../db';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
  summary: HealthSummary;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  duration: number;
  details?: Record<string, any>;
}

export interface HealthSummary {
  totalChecks: number;
  passed: number;
  warnings: number;
  failed: number;
  successRate: number;
}

const startTime = Date.now();

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const db = await getDb();
    if (!db) {
      return {
        name: 'Database Connection',
        status: 'fail',
        message: 'Database connection not available',
        duration: Date.now() - start,
      };
    }

    return {
      name: 'Database Connection',
      status: 'pass',
      message: 'Database connection successful',
      duration: Date.now() - start,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      name: 'Database Connection',
      status: 'fail',
      message: `Database connection failed: ${errorMsg}`,
      duration: Date.now() - start,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const start = Date.now();
  
  try {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = 'Memory usage normal';
    
    if (heapUsedPercent > 90) {
      status = 'fail';
      message = `Critical memory usage: ${heapUsedPercent.toFixed(1)}%`;
    } else if (heapUsedPercent > 75) {
      status = 'warn';
      message = `High memory usage: ${heapUsedPercent.toFixed(1)}%`;
    }
    
    return {
      name: 'Memory Usage',
      status,
      message,
      duration: Date.now() - start,
      details: {
        heapUsedPercent: heapUsedPercent.toFixed(1),
        heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
      },
    };
  } catch (error) {
    return {
      name: 'Memory Usage',
      status: 'fail',
      message: `Memory check failed: ${error}`,
      duration: Date.now() - start,
    };
  }
}

/**
 * Check CPU usage
 */
function checkCpu(): HealthCheck {
  const start = Date.now();
  
  try {
    const cpuUsage = process.cpuUsage();
    const totalCpuTime = (cpuUsage.user + cpuUsage.system) / 1000; // Convert to ms
    
    return {
      name: 'CPU Usage',
      status: 'pass',
      message: 'CPU usage normal',
      duration: Date.now() - start,
      details: {
        userCpuMs: cpuUsage.user / 1000,
        systemCpuMs: cpuUsage.system / 1000,
        totalCpuMs: totalCpuTime,
      },
    };
  } catch (error) {
    return {
      name: 'CPU Usage',
      status: 'fail',
      message: `CPU check failed: ${error}`,
      duration: Date.now() - start,
    };
  }
}

/**
 * Check server uptime
 */
function checkUptime(): HealthCheck {
  const start = Date.now();
  const uptime = Date.now() - startTime;
  const uptimeSeconds = Math.floor(uptime / 1000);
  const uptimeMinutes = Math.floor(uptimeSeconds / 60);
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  
  return {
    name: 'Server Uptime',
    status: 'pass',
    message: `Server running for ${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`,
    duration: Date.now() - start,
    details: {
      uptimeMs: uptime,
      uptimeSeconds,
      uptimeMinutes,
      uptimeHours,
    },
  };
}

/**
 * Perform all health checks
 */
export async function performHealthChecks(): Promise<HealthStatus> {
  const timestamp = new Date().toISOString();
  const uptime = Date.now() - startTime;
  
  const checks: HealthCheck[] = [];
  
  // Run all checks
  checks.push(await checkDatabase());
  checks.push(checkMemory());
  checks.push(checkCpu());
  checks.push(checkUptime());
  
  // Calculate summary
  const summary: HealthSummary = {
    totalChecks: checks.length,
    passed: checks.filter(c => c.status === 'pass').length,
    warnings: checks.filter(c => c.status === 'warn').length,
    failed: checks.filter(c => c.status === 'fail').length,
    successRate: (checks.filter(c => c.status === 'pass').length / checks.length) * 100,
  };
  
  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (summary.failed > 0) {
    status = 'unhealthy';
  } else if (summary.warnings > 0) {
    status = 'degraded';
  }
  
  return {
    status,
    timestamp,
    uptime,
    checks,
    summary,
  };
}

/**
 * Format health status for display
 */
export function formatHealthStatus(health: HealthStatus): string {
  const lines: string[] = [];
  
  lines.push(`\n${'='.repeat(60)}`);
  lines.push(`Health Status: ${health.status.toUpperCase()}`);
  lines.push(`Timestamp: ${health.timestamp}`);
  lines.push(`Uptime: ${Math.floor(health.uptime / 1000)}s`);
  lines.push(`${'='.repeat(60)}\n`);
  
  lines.push('Checks:');
  for (const check of health.checks) {
    const statusIcon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
    lines.push(`  ${statusIcon} ${check.name} (${check.duration}ms)`);
    lines.push(`    ${check.message}`);
    
    if (check.details) {
      for (const [key, value] of Object.entries(check.details)) {
        lines.push(`    ${key}: ${value}`);
      }
    }
  }
  
  lines.push(`\nSummary:`);
  lines.push(`  Total: ${health.summary.totalChecks}`);
  lines.push(`  Passed: ${health.summary.passed}`);
  lines.push(`  Warnings: ${health.summary.warnings}`);
  lines.push(`  Failed: ${health.summary.failed}`);
  lines.push(`  Success Rate: ${health.summary.successRate.toFixed(1)}%`);
  lines.push(`${'='.repeat(60)}\n`);
  
  return lines.join('\n');
}

/**
 * Log health status
 */
export function logHealthStatus(health: HealthStatus): void {
  const formatted = formatHealthStatus(health);
  
  if (health.status === 'healthy') {
    console.log('[Health Monitor]', formatted);
  } else if (health.status === 'degraded') {
    console.warn('[Health Monitor]', formatted);
  } else {
    console.error('[Health Monitor]', formatted);
  }
}
