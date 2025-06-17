// Performance monitoring utility for Electron app
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private timers: Map<string, number> = new Map();
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // End timing and record the duration
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);

    return duration;
  }

  // Get average time for an operation
  getAverageTime(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  // Get performance statistics
  getStats(): Record<string, { average: number; count: number; total: number }> {
    const stats: Record<string, { average: number; count: number; total: number }> = {};
    
    this.metrics.forEach((times, name) => {
      const total = times.reduce((sum, time) => sum + time, 0);
      stats[name] = {
        average: total / times.length,
        count: times.length,
        total
      };
    });

    return stats;
  }

  // Clear metrics
  clear(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  // Log performance stats to console
  logStats(): void {
    const stats = this.getStats();
    console.group('Performance Statistics');
    Object.entries(stats).forEach(([name, stat]) => {
      console.log(`${name}:`, {
        average: `${stat.average.toFixed(2)}ms`,
        count: stat.count,
        total: `${stat.total.toFixed(2)}ms`
      });
    });
    console.groupEnd();
  }

  // Memory usage monitoring
  getMemoryUsage(): NodeJS.MemoryUsage | { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number } | null {
    if (typeof window !== 'undefined' && window.electronAPI?.performance?.getMemoryUsage) {
      return window.electronAPI.performance.getMemoryUsage();
    }
    
    // Fallback for web environment
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as { memory: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory;
    }
    
    return null;
  }

  // Trigger garbage collection
  async cleanupMemory(): Promise<void> {
    if (typeof window !== 'undefined' && window.electronAPI?.performance?.cleanupMemory) {
      await window.electronAPI.performance.cleanupMemory();
    }
  }
}

// Convenience functions
export const perfMonitor = PerformanceMonitor.getInstance();

// Decorator for timing functions
export function timeFunction(name?: string) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const timerName = name || `${(target as { constructor: { name: string } }).constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      perfMonitor.startTimer(timerName);
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = perfMonitor.endTimer(timerName);
        
        if (duration > 1000) { // Log slow operations (>1s)
          console.warn(`Slow operation detected: ${timerName} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
      } catch (error) {
        perfMonitor.endTimer(timerName);
        throw error;
      }
    };
  };
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    startTimer: (name: string) => perfMonitor.startTimer(name),
    endTimer: (name: string) => perfMonitor.endTimer(name),
    getStats: () => perfMonitor.getStats(),
    logStats: () => perfMonitor.logStats(),
    getMemoryUsage: () => perfMonitor.getMemoryUsage(),
    cleanupMemory: () => perfMonitor.cleanupMemory(),
  };
} 