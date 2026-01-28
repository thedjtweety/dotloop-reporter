import { describe, it, expect, beforeEach } from 'vitest';
import {
  QueryResultCache,
  EagerLoadingManager,
  QueryOptimizer,
  BatchQueryBuilder,
  QueryPerformanceMonitor,
} from './utils/query-optimizer';

/**
 * Query Optimization Tests
 * Tests query optimization strategies including eager loading and caching
 */

describe('Query Result Cache', () => {
  let cache: QueryResultCache;

  beforeEach(() => {
    cache = new QueryResultCache();
  });

  describe('Basic Caching', () => {
    it('should cache and retrieve data', () => {
      const data = { id: 1, name: 'Test' };
      cache.set('key-1', data);

      const retrieved = cache.get('key-1');
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should clear specific cache key', () => {
      cache.set('key-1', { id: 1 });
      cache.clear('key-1');

      const result = cache.get('key-1');
      expect(result).toBeNull();
    });

    it('should clear all cache', () => {
      cache.set('key-1', { id: 1 });
      cache.set('key-2', { id: 2 });
      cache.clearAll();

      expect(cache.get('key-1')).toBeNull();
      expect(cache.get('key-2')).toBeNull();
    });
  });

  describe('Cache Expiration', () => {
    it('should expire cache after TTL', async () => {
      cache.set('key-1', { id: 1 }, 100); // 100ms TTL

      // Should be cached immediately
      expect(cache.get('key-1')).not.toBeNull();

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(cache.get('key-1')).toBeNull();
    });

    it('should use default TTL', () => {
      cache.set('key-1', { id: 1 }); // Default TTL

      expect(cache.get('key-1')).not.toBeNull();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache by pattern', () => {
      cache.set('user:1', { id: 1 });
      cache.set('user:2', { id: 2 });
      cache.set('post:1', { id: 1 });

      const invalidated = cache.invalidatePattern('^user:');

      expect(invalidated).toBe(2);
      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('post:1')).not.toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    it('should get cache statistics', () => {
      cache.set('key-1', { id: 1 });
      cache.set('key-2', { id: 2 });

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key-1');
      expect(stats.keys).toContain('key-2');
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });
});

describe('Eager Loading Manager', () => {
  let manager: EagerLoadingManager;

  beforeEach(() => {
    manager = new EagerLoadingManager();
  });

  describe('Relation Registration', () => {
    it('should register relations', () => {
      manager.registerRelation('User', ['posts', 'comments']);

      const relations = manager.getRelations('User');
      expect(relations).toContain('posts');
      expect(relations).toContain('comments');
    });

    it('should return empty array for unregistered entity', () => {
      const relations = manager.getRelations('Unknown');
      expect(relations).toEqual([]);
    });
  });

  describe('Query Building', () => {
    it('should build eager loading query', () => {
      manager.registerRelation('User', ['posts', 'comments']);

      const baseQuery = 'SELECT * FROM users';
      const eagerQuery = manager.buildEagerLoadQuery('User', baseQuery);

      expect(eagerQuery).toContain('LEFT JOIN posts');
      expect(eagerQuery).toContain('LEFT JOIN comments');
    });

    it('should handle entity with no relations', () => {
      const baseQuery = 'SELECT * FROM users';
      const eagerQuery = manager.buildEagerLoadQuery('User', baseQuery);

      expect(eagerQuery).toBe(baseQuery);
    });
  });

  describe('Batch Loading', () => {
    it('should batch load related data', async () => {
      const entities = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      const loader = async (ids: string[]) => ({
        '1': { postCount: 5 },
        '2': { postCount: 3 },
      });

      const result = await manager.batchLoadRelations(entities, 'posts', loader);

      expect(result[0]).toHaveProperty('posts');
      expect(result[0].posts.postCount).toBe(5);
    });
  });
});

describe('Query Optimizer', () => {
  let optimizer: QueryOptimizer;

  beforeEach(() => {
    optimizer = new QueryOptimizer();
  });

  describe('Query Execution with Caching', () => {
    it('should execute query and cache result', async () => {
      let callCount = 0;
      const query = async () => {
        callCount++;
        return { id: 1, name: 'Test' };
      };

      const result1 = await optimizer.executeWithCache('key-1', query);
      const result2 = await optimizer.executeWithCache('key-1', query);

      expect(result1).toEqual(result2);
      expect(callCount).toBe(1); // Query should only execute once
    });

    it('should use custom TTL', async () => {
      let callCount = 0;
      const query = async () => {
        callCount++;
        return { id: 1 };
      };

      await optimizer.executeWithCache('key-1', query, 50);
      await new Promise(resolve => setTimeout(resolve, 100));
      await optimizer.executeWithCache('key-1', query, 50);

      expect(callCount).toBe(2); // Query should execute again after expiration
    });
  });

  describe('Batch Execution', () => {
    it('should execute multiple queries in batch', async () => {
      const queries = [
        { key: 'q1', query: async () => ({ id: 1 }) },
        { key: 'q2', query: async () => ({ id: 2 }) },
        { key: 'q3', query: async () => ({ id: 3 }) },
      ];

      const results = await optimizer.batchExecute(queries);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ id: 1 });
      expect(results[1]).toEqual({ id: 2 });
    });
  });

  describe('Performance Metrics', () => {
    it('should track query metrics', async () => {
      const query = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id: 1 };
      };

      await optimizer.executeWithCache('key-1', query);
      const metrics = optimizer.getMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0].executionTime).toBeGreaterThanOrEqual(10);
    });

    it('should calculate performance statistics', async () => {
      const query = async () => ({ id: 1 });

      await optimizer.executeWithCache('key-1', query);
      await optimizer.executeWithCache('key-1', query); // Cache hit

      const stats = optimizer.getPerformanceStats();

      expect(stats.totalQueries).toBe(2);
      expect(stats.cacheHits).toBe(1);
      expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      const query = async () => ({ id: 1 });

      await optimizer.executeWithCache('key-1', query);
      optimizer.clearCache();

      const stats = optimizer.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear cache by pattern', async () => {
      const query = async () => ({ id: 1 });

      await optimizer.executeWithCache('user:1', query);
      await optimizer.executeWithCache('post:1', query);

      optimizer.clearCache('^user:');

      const stats = optimizer.getCacheStats();
      expect(stats.keys).not.toContain('user:1');
      expect(stats.keys).toContain('post:1');
    });
  });
});

describe('Batch Query Builder', () => {
  it('should build and execute batch queries', async () => {
    const optimizer = new QueryOptimizer();
    const builder = new BatchQueryBuilder();

    builder
      .add('q1', async () => ({ id: 1 }))
      .add('q2', async () => ({ id: 2 }))
      .add('q3', async () => ({ id: 3 }));

    const results = await builder.execute(optimizer);

    expect(results.q1).toEqual({ id: 1 });
    expect(results.q2).toEqual({ id: 2 });
    expect(results.q3).toEqual({ id: 3 });
  });

  it('should track query count', () => {
    const builder = new BatchQueryBuilder();

    builder.add('q1', async () => ({})).add('q2', async () => ({}));

    expect(builder.getCount()).toBe(2);
  });

  it('should clear queries', () => {
    const builder = new BatchQueryBuilder();

    builder.add('q1', async () => ({})).clear();

    expect(builder.getCount()).toBe(0);
  });
});

describe('Query Performance Monitor', () => {
  let monitor: QueryPerformanceMonitor;

  beforeEach(() => {
    monitor = new QueryPerformanceMonitor();
  });

  describe('Query Recording', () => {
    it('should record query execution', () => {
      monitor.recordQuery('q1', 'SELECT * FROM users', 50, 100);

      const report = monitor.getReport();
      expect(report.totalQueries).toBe(1);
      expect(report.totalExecutionTime).toBe(50);
    });

    it('should track cache hits', () => {
      monitor.recordQuery('q1', 'SELECT * FROM users', 50, 100, true);
      monitor.recordQuery('q2', 'SELECT * FROM posts', 100, 50, false);

      const report = monitor.getReport();
      expect(report.cacheHitRate).toBe(50);
    });
  });

  describe('Slow Query Detection', () => {
    it('should identify slow queries', () => {
      monitor.setSlowQueryThreshold(75);
      monitor.recordQuery('q1', 'SELECT * FROM users', 50, 100);
      monitor.recordQuery('q2', 'SELECT * FROM posts', 100, 50);

      const slowQueries = monitor.getSlowQueries();
      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0].query).toBe('SELECT * FROM posts');
    });
  });

  describe('Performance Report', () => {
    it('should generate performance report', () => {
      monitor.recordQuery('q1', 'SELECT * FROM users', 50, 100);
      monitor.recordQuery('q2', 'SELECT * FROM posts', 100, 50);

      const report = monitor.getReport();

      expect(report.totalQueries).toBe(2);
      expect(report.totalExecutionTime).toBe(150);
      expect(report.averageExecutionTime).toBe(75);
      expect(report.slowQueries).toBe(0);
    });
  });

  describe('Metrics Management', () => {
    it('should clear metrics', () => {
      monitor.recordQuery('q1', 'SELECT * FROM users', 50, 100);
      monitor.clear();

      const report = monitor.getReport();
      expect(report.totalQueries).toBe(0);
    });
  });
});
