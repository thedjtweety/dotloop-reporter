/**
 * Query Optimization Utilities
 * 
 * Implements query optimization strategies:
 * - Eager loading to prevent N+1 queries
 * - Query result caching
 * - Batch operations
 * - Query performance tracking
 */

export interface QueryCache {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
}

export interface QueryMetrics {
  queryId: string;
  query: string;
  executionTime: number;
  rowsAffected: number;
  cacheHit: boolean;
  timestamp: Date;
}

/**
 * Query Result Cache
 * Implements TTL-based caching for query results
 */
export class QueryResultCache {
  private cache: Map<string, QueryCache> = new Map();
  private metrics: QueryMetrics[] = [];

  /**
   * Get cached result
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache value
   */
  set(key: string, data: any, ttl: number = 60000): void {
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear specific cache key
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    });

    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    let memoryUsage = 0;
    const keys: string[] = [];

    this.cache.forEach((cache, key) => {
      keys.push(key);
      memoryUsage += JSON.stringify(cache.data).length;
    });

    return {
      size: this.cache.size,
      keys,
      memoryUsage,
    };
  }
}

/**
 * Eager Loading Manager
 * Prevents N+1 query problems
 */
export class EagerLoadingManager {
  private relations: Map<string, string[]> = new Map();

  /**
   * Register relation for eager loading
   */
  registerRelation(entity: string, relations: string[]): void {
    this.relations.set(entity, relations);
  }

  /**
   * Get relations to eager load
   */
  getRelations(entity: string): string[] {
    return this.relations.get(entity) || [];
  }

  /**
   * Build eager loading query
   */
  buildEagerLoadQuery(entity: string, baseQuery: string): string {
    const relations = this.getRelations(entity);

    if (relations.length === 0) {
      return baseQuery;
    }

    // Add JOIN clauses for each relation
    let query = baseQuery;
    relations.forEach(relation => {
      query += ` LEFT JOIN ${relation} ON ${entity}.${relation}_id = ${relation}.id`;
    });

    return query;
  }

  /**
   * Batch load related data
   */
  async batchLoadRelations<T extends { id: string }>(
    entities: T[],
    relation: string,
    loader: (ids: string[]) => Promise<Record<string, any>>
  ): Promise<T[]> {
    const ids = entities.map(e => e.id);
    const relatedData = await loader(ids);

    return entities.map(entity => ({
      ...entity,
      [relation]: relatedData[entity.id],
    }));
  }
}

/**
 * Query Optimizer
 * Main class for query optimization
 */
export class QueryOptimizer {
  private cache: QueryResultCache;
  private eagerLoader: EagerLoadingManager;
  private metrics: QueryMetrics[] = [];

  constructor() {
    this.cache = new QueryResultCache();
    this.eagerLoader = new EagerLoadingManager();
  }

  /**
   * Execute query with caching
   */
  async executeWithCache<T>(
    queryKey: string,
    query: () => Promise<T>,
    ttl: number = 60000
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(queryKey);
    if (cached !== null) {
      this.recordMetric(queryKey, 'cached', 0, 1, true);
      return cached;
    }

    // Execute query
    const start = performance.now();
    const result = await query();
    const duration = performance.now() - start;

    // Cache result
    this.cache.set(queryKey, result, ttl);
    this.recordMetric(queryKey, 'executed', duration, 1, false);

    return result;
  }

  /**
   * Batch execute queries
   */
  async batchExecute<T>(
    queries: Array<{ key: string; query: () => Promise<T> }>
  ): Promise<T[]> {
    return Promise.all(
      queries.map(({ key, query }) =>
        this.executeWithCache(key, query)
      )
    );
  }

  /**
   * Execute query with eager loading
   */
  async executeWithEagerLoading<T extends { id: string }>(
    entity: string,
    query: () => Promise<T[]>,
    relations: string[]
  ): Promise<T[]> {
    // Register relations
    this.eagerLoader.registerRelation(entity, relations);

    // Execute query
    const results = await query();

    // Load related data for each relation
    for (const relation of relations) {
      // In a real implementation, this would load related data
      // For now, we just track that eager loading was used
    }

    return results;
  }

  /**
   * Record query metric
   */
  private recordMetric(
    queryId: string,
    query: string,
    executionTime: number,
    rowsAffected: number,
    cacheHit: boolean
  ): void {
    this.metrics.push({
      queryId,
      query,
      executionTime,
      rowsAffected,
      cacheHit,
      timestamp: new Date(),
    });
  }

  /**
   * Get query metrics
   */
  getMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number;
    cacheHits: number;
    averageExecutionTime: number;
    totalExecutionTime: number;
  } {
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const totalExecutionTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0);
    const averageExecutionTime = this.metrics.length > 0 ? totalExecutionTime / this.metrics.length : 0;

    return {
      totalQueries: this.metrics.length,
      cacheHits,
      averageExecutionTime,
      totalExecutionTime,
    };
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      this.cache.invalidatePattern(pattern);
    } else {
      this.cache.clearAll();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

/**
 * Batch Query Builder
 * Helps construct efficient batch queries
 */
export class BatchQueryBuilder {
  private queries: Array<{ key: string; query: () => Promise<any> }> = [];

  /**
   * Add query to batch
   */
  add(key: string, query: () => Promise<any>): this {
    this.queries.push({ key, query });
    return this;
  }

  /**
   * Execute batch with optimizer
   */
  async execute(optimizer: QueryOptimizer): Promise<Record<string, any>> {
    const results = await optimizer.batchExecute(this.queries);

    const resultMap: Record<string, any> = {};
    this.queries.forEach((q, index) => {
      resultMap[q.key] = results[index];
    });

    return resultMap;
  }

  /**
   * Clear queries
   */
  clear(): this {
    this.queries = [];
    return this;
  }

  /**
   * Get query count
   */
  getCount(): number {
    return this.queries.length;
  }
}

/**
 * Query Performance Monitor
 * Tracks and reports query performance
 */
export class QueryPerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold: number = 100; // ms

  /**
   * Record query execution
   */
  recordQuery(
    queryId: string,
    query: string,
    executionTime: number,
    rowsAffected: number,
    cacheHit: boolean = false
  ): void {
    this.metrics.push({
      queryId,
      query,
      executionTime,
      rowsAffected,
      cacheHit,
      timestamp: new Date(),
    });
  }

  /**
   * Get slow queries
   */
  getSlowQueries(): QueryMetrics[] {
    return this.metrics.filter(m => m.executionTime > this.slowQueryThreshold);
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(ms: number): void {
    this.slowQueryThreshold = ms;
  }

  /**
   * Get performance report
   */
  getReport(): {
    totalQueries: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    slowQueries: number;
    cacheHitRate: number;
  } {
    const totalExecutionTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0);
    const averageExecutionTime = this.metrics.length > 0 ? totalExecutionTime / this.metrics.length : 0;
    const slowQueries = this.getSlowQueries().length;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const cacheHitRate = this.metrics.length > 0 ? (cacheHits / this.metrics.length) * 100 : 0;

    return {
      totalQueries: this.metrics.length,
      totalExecutionTime,
      averageExecutionTime,
      slowQueries,
      cacheHitRate,
    };
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }
}
