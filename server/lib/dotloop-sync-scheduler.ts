/**
 * Dotloop Auto-Sync Scheduler
 * Handles automated syncing of Dotloop data
 */

/**
 * Sync Configuration
 */
export interface SyncConfig {
  enabled: boolean;
  scheduleTime: string; // HH:mm format (e.g., "02:00")
  timezone: string; // e.g., "America/New_York"
  retryAttempts: number;
  retryDelayMs: number;
}

/**
 * Sync Job
 */
export interface SyncJob {
  jobId: string;
  userId: string;
  profileId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  recordCount: number;
  error?: string;
}

/**
 * Dotloop Sync Scheduler
 * Manages automated syncing of Dotloop data
 */
export class DotloopSyncScheduler {
  private config: SyncConfig;
  private jobs: Map<string, SyncJob> = new Map();
  private isRunning = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      scheduleTime: config.scheduleTime ?? '02:00',
      timezone: config.timezone ?? 'UTC',
      retryAttempts: config.retryAttempts ?? 3,
      retryDelayMs: config.retryDelayMs ?? 5000,
    };
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Dotloop sync scheduler started');

    // In a real implementation, this would set up cron jobs
    // For now, we just log that it's running
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isRunning = false;
    console.log('Dotloop sync scheduler stopped');
  }

  /**
   * Trigger a manual sync
   */
  async triggerSync(userId: string, profileId: string): Promise<SyncJob> {
    const jobId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job: SyncJob = {
      jobId,
      userId,
      profileId,
      status: 'pending',
      startTime: new Date(),
      recordCount: 0,
    };

    this.jobs.set(jobId, job);

    try {
      // In a real implementation, this would:
      // 1. Retrieve user's Dotloop token
      // 2. Create DotloopAPIClient
      // 3. Fetch loops from Dotloop
      // 4. Transform and save to database
      // 5. Update job status

      job.status = 'completed';
      job.endTime = new Date();
      job.recordCount = 0;
    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.error = String(error);
    }

    return job;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): SyncJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a user
   */
  getUserJobs(userId: string): SyncJob[] {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId);
  }

  /**
   * Get recent jobs
   */
  getRecentJobs(limit: number = 10): SyncJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Update sync configuration
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Sync configuration updated', this.config);
  }

  /**
   * Get sync configuration
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    config: SyncConfig;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
  } {
    const allJobs = Array.from(this.jobs.values());
    const completedJobs = allJobs.filter(j => j.status === 'completed').length;
    const failedJobs = allJobs.filter(j => j.status === 'failed').length;

    return {
      isRunning: this.isRunning,
      config: this.getConfig(),
      totalJobs: allJobs.length,
      completedJobs,
      failedJobs,
    };
  }

  /**
   * Clear old jobs (for memory management)
   */
  clearOldJobs(olderThanDays: number = 7): number {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    let cleared = 0;
    const jobsToDelete: string[] = [];

    this.jobs.forEach((job, jobId) => {
      if (job.startTime.getTime() < cutoffTime) {
        jobsToDelete.push(jobId);
        cleared++;
      }
    });

    jobsToDelete.forEach(jobId => this.jobs.delete(jobId));
    return cleared;
  }

  /**
   * Get sync statistics
   */
  getStats(): {
    totalRecordsSynced: number;
    averageRecordsPerSync: number;
    successRate: number;
    lastSyncTime?: Date;
  } {
    const allJobs = Array.from(this.jobs.values());
    const completedJobs = allJobs.filter(j => j.status === 'completed');
    const totalRecords = completedJobs.reduce((sum, j) => sum + j.recordCount, 0);
    const successRate = allJobs.length > 0 ? (completedJobs.length / allJobs.length) * 100 : 0;

    const lastJob = allJobs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

    return {
      totalRecordsSynced: totalRecords,
      averageRecordsPerSync: completedJobs.length > 0 ? totalRecords / completedJobs.length : 0,
      successRate,
      lastSyncTime: lastJob?.endTime,
    };
  }
}

/**
 * Global scheduler instance
 */
let schedulerInstance: DotloopSyncScheduler | null = null;

/**
 * Get or create scheduler instance
 */
export function getScheduler(config?: Partial<SyncConfig>): DotloopSyncScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new DotloopSyncScheduler(config);
  }
  return schedulerInstance;
}

/**
 * Initialize scheduler
 */
export function initializeScheduler(config: Partial<SyncConfig> = {}): DotloopSyncScheduler {
  schedulerInstance = new DotloopSyncScheduler(config);
  if (config.enabled) {
    schedulerInstance.start();
  }
  return schedulerInstance;
}
