// Performance optimization utilities
import { ExchangeRate } from "@/lib/types/invoice";

// Cache management for API calls
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlMs: number = 3600000): void { // Default 1 hour TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const globalCache = new CacheManager();

// Debounce utility for API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), waitMs);
  };
}

// Throttle utility for frequent operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limitMs);
    }
  };
}

// Batch API requests to reduce network calls
export class BatchRequestManager {
  private pendingRequests = new Map<string, Promise<any>>();
  private batchQueue: Array<{ key: string; request: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  async request<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create new request promise
    const promise = new Promise<T>((resolve, reject) => {
      this.batchQueue.push({ key, request: requestFn, resolve, reject });
      
      // Schedule batch execution
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.executeBatch(), 50); // 50ms batch window
      }
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  private async executeBatch(): Promise<void> {
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    // Execute all requests in parallel
    const results = await Promise.allSettled(
      batch.map(async ({ key, request, resolve, reject }) => {
        try {
          const result = await request();
          resolve(result);
          return { key, result };
        } catch (error) {
          reject(error);
          throw error;
        } finally {
          this.pendingRequests.delete(key);
        }
      })
    );

    // Log any failures for monitoring
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Batch request failed for key: ${batch[index].key}`, result.reason);
      }
    });
  }
}

// Global batch manager instance
export const batchRequestManager = new BatchRequestManager();

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  startTimer(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, duration: number): void {
    const existing = this.metrics.get(operation) || { count: 0, totalTime: 0, avgTime: 0 };
    const newCount = existing.count + 1;
    const newTotalTime = existing.totalTime + duration;
    const newAvgTime = newTotalTime / newCount;

    this.metrics.set(operation, {
      count: newCount,
      totalTime: newTotalTime,
      avgTime: newAvgTime
    });

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  getMetrics(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Optimized currency rate fetching with caching and batching
export async function fetchExchangeRatesOptimized(
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<ExchangeRate[]> {
  const cacheKey = `exchange-rates-${baseCurrency}-${targetCurrencies.sort().join(',')}`;
  
  // Check cache first
  const cached = globalCache.get<ExchangeRate[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Use batch manager to avoid duplicate requests
  return batchRequestManager.request(cacheKey, async () => {
    const stopTimer = performanceMonitor.startTimer('fetchExchangeRates');
    
    try {
      // This would be replaced with actual API call
      const response = await fetch(`/api/exchange-rates?base=${baseCurrency}&targets=${targetCurrencies.join(',')}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
      }
      
      const rates: ExchangeRate[] = await response.json();
      
      // Cache the results
      globalCache.set(cacheKey, rates, 3600000); // 1 hour cache
      
      return rates;
    } finally {
      stopTimer();
    }
  });
}

// Database query optimization utilities
export class QueryOptimizer {
  // Batch database operations to reduce round trips
  static batchQueries<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(queries.map(query => query()));
  }

  // Paginate large result sets
  static paginate<T>(
    items: T[],
    page: number = 1,
    pageSize: number = 50
  ): { items: T[]; totalPages: number; currentPage: number; totalItems: number } {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      totalPages: Math.ceil(items.length / pageSize),
      currentPage: page,
      totalItems: items.length
    };
  }

  // Optimize search queries with indexing hints
  static buildOptimizedSearchQuery(
    searchTerm: string,
    fields: string[],
    options: { caseSensitive?: boolean; exactMatch?: boolean } = {}
  ): { query: string; params: any[] } {
    const { caseSensitive = false, exactMatch = false } = options;
    
    if (exactMatch) {
      const conditions = fields.map((field, index) => 
        caseSensitive ? `${field} = $${index + 1}` : `LOWER(${field}) = LOWER($${index + 1})`
      );
      return {
        query: conditions.join(' OR '),
        params: fields.map(() => searchTerm)
      };
    } else {
      const conditions = fields.map((field, index) => 
        caseSensitive 
          ? `${field} LIKE $${index + 1}` 
          : `LOWER(${field}) LIKE LOWER($${index + 1})`
      );
      return {
        query: conditions.join(' OR '),
        params: fields.map(() => `%${searchTerm}%`)
      };
    }
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  static getMemoryUsage(): { used: number; total: number; percentage: number } {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    
    // Fallback for environments without memory API
    return { used: 0, total: 0, percentage: 0 };
  }

  static logMemoryUsage(operation: string): void {
    const usage = this.getMemoryUsage();
    if (usage.percentage > 80) {
      console.warn(`High memory usage after ${operation}: ${usage.percentage.toFixed(2)}%`);
    }
  }
}

// All classes and utilities are already exported above