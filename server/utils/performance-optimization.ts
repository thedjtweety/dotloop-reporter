/**
 * Performance Optimization Utilities
 */

export class CacheManager {
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL;
    this.startCleanup();
  }

  set(key: string, value: any, ttl = this.defaultTTL): void {
    this.cache.set(key, { value, expiry: Date.now() + ttl });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      this.cache.forEach((entry, key) => {
        if (now > entry.expiry) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
    }, 60000);
  }
}

export class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();

  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((a: number, b: number) => a + b, 0) / values.length;
  }

  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    this.metrics.forEach((values, name) => {
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
      };
    });
    return summary;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const cacheManager = new CacheManager();
export const performanceMetrics = new PerformanceMetrics();
