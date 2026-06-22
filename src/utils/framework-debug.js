/**
 * Framework Debug Utility
 * 
 * Debugging utilities for the VanillaForge framework.
 * Provides insights into component state, event bus activity, and performance.
 * 
 * @author VanillaForge Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { Logger } from './logger.js';

/**
 * Framework Debug class for development debugging
 */
export class FrameworkDebug {
  constructor(app) {
    this.app = app;
    this.logger = new Logger('FrameworkDebug');
    this.isEnabled = false;
    this.performanceMarks = new Map();
    
    this.logger.info('Framework debug utility initialized');
  }

  /**
   * Enable debug mode
   */  enable() {
    this.isEnabled = true;
    
    // Enable event bus debug mode
    if (this.app.eventBus) {
      this.app.eventBus.setDebugMode(true);
    }
      // Add debug tools to window for console access
    window.VanillaForgeDebug = this;
    
    this.logger.info('Framework debug mode enabled');
    
    // Only show console message in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('VanillaForge Debug mode enabled. Access via window.VanillaForgeDebug');
    }
  }

  /**
   * Disable debug mode
   */
  disable() {
    this.isEnabled = false;
    
    // Disable event bus debug mode
    if (this.app.eventBus) {
      this.app.eventBus.setDebugMode(false);
    }
      // Remove debug tools from window
    delete window.VanillaForgeDebug;
    
    this.logger.info('Framework debug mode disabled');
  }

  /**
   * Get component manager statistics
   */
  getComponentStats() {
    if (!this.app.componentManager) {
      return { error: 'Component manager not available' };
    }

    const activeComponents = this.app.componentManager.getActiveComponents();
    const registeredComponents = this.app.componentManager.getRegisteredComponents();

    return {
      registeredComponents: registeredComponents,
      activeComponents: Array.from(activeComponents.keys()),
      totalRegistered: registeredComponents.length,
      totalActive: activeComponents.size,
      components: Array.from(activeComponents.entries()).map(([id, instance]) => ({
        id,
        name: instance.name,
        isInitialized: instance.isInitialized,
        isRendered: instance.isRendered,
        isDestroyed: instance.isDestroyed,
        state: instance.state,
        props: instance.props
      }))
    };
  }

  /**
   * Get event bus statistics
   */
  getEventBusStats() {
    if (!this.app.eventBus) {
      return { error: 'Event bus not available' };
    }

    return {
      ...this.app.eventBus.getStats(),
      recentEvents: this.app.eventBus.getHistory(20)
    };
  }

  /**
   * Get router information
   */
  getRouterInfo() {
    if (!this.app.router) {
      return { error: 'Router not available' };
    }

    return {
      currentRoute: this.app.router.getCurrentRoute(),
      isNavigating: this.app.router.isNavigating,
      targetPath: this.app.router.targetPath
    };
  }

  /**
   * Get error handler statistics
   */
  getErrorStats() {
    if (!this.app.errorHandler) {
      return { error: 'Error handler not available' };
    }

    return this.app.errorHandler.getErrorStats();
  }

  /**
   * Get performance information
   */
  getPerformanceInfo() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    return {
      navigation: navigation ? {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
      } : null,
      marks: marks.map(mark => ({
        name: mark.name,
        startTime: mark.startTime
      })),
      measures: measures.map(measure => ({
        name: measure.name,
        duration: measure.duration,
        startTime: measure.startTime
      })),
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }

  /**
   * Mark performance milestone
   */
  markPerformance(name) {
    try {
      performance.mark(name);
      this.performanceMarks.set(name, performance.now());
      this.logger.debug(`Performance mark: ${name}`);
    } catch (error) {
      this.logger.warn(`Failed to mark performance: ${name}`, error);
    }
  }

  /**
   * Measure performance between two marks
   */
  measurePerformance(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark);
      this.logger.debug(`Performance measure: ${name}`);
    } catch (error) {
      this.logger.warn(`Failed to measure performance: ${name}`, error);
    }
  }
  /**
   * Log detailed framework state
   */
  logFrameworkState() {
    const stats = {
      components: this.getComponentStats(),
      eventBus: this.getEventBusStats(),
      router: this.getRouterInfo(),
      errors: this.getErrorStats(),
      performance: this.getPerformanceInfo()
    };
    
    console.group('VanillaForge Framework State');
    console.table(stats);
    console.groupEnd();
    
    return stats;
  }
  /**
   * Simulate component stress test
   */  async stressTestComponents(iterations = 10, componentName = null) {
    if (!this.isEnabled) {
      console.warn('Debug mode must be enabled for stress testing');
      return;
    }

    // Auto-detect a registered component if none specified
    if (!componentName) {
      const registeredComponents = this.app.componentManager?.getRegisteredComponents() || [];
      if (registeredComponents.length === 0) {
        console.warn('No registered components found for stress testing');
        return { error: 'No components registered' };
      }
      componentName = registeredComponents[0]; // Use first registered component
    }

    this.logger.info(`Starting component stress test (${iterations} iterations) on component: ${componentName}`);
    
    const startTime = performance.now();
    const results = {
      iterations,
      componentName,
      successes: 0,
      failures: 0,
      errors: []
    };

    for (let i = 0; i < iterations; i++) {
      try {
        // Check if component is registered before trying to load it
        if (!this.app.componentManager.components.has(componentName)) {
          throw new Error(`Component '${componentName}' is not registered`);
        }
        
        // Simulate rapid component loading/unloading
        await this.app.componentManager.loadComponent(componentName, {}, 'main-content');
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
        
        results.successes++;
      } catch (error) {
        results.failures++;
        results.errors.push(error.message);
      }
    }

    const endTime = performance.now();
    results.duration = endTime - startTime;
    results.averageTime = results.duration / iterations;

    console.log('Stress test results:', results);
    return results;
  }

  /**
   * Test event bus performance
   */  testEventBusPerformance(eventCount = 1000) {
    if (!this.isEnabled) {
      console.warn('Debug mode must be enabled for performance testing');
      return;
    }

    this.logger.info(`Testing event bus performance (${eventCount} events)`);
    
    const startTime = performance.now();
    
    // Create multiple listeners
    const listeners = [];
    for (let i = 0; i < 10; i++) {
      const unsubscribe = this.app.eventBus.on(`test-event-${i}`, () => {});
      listeners.push(unsubscribe);
    }

    // Emit events
    for (let i = 0; i < eventCount; i++) {
      this.app.eventBus.emit(`test-event-${i % 10}`, { data: i });
    }

    const endTime = performance.now();
    
    // Clean up listeners
    listeners.forEach(unsubscribe => unsubscribe());

    const results = {
      eventCount,
      duration: endTime - startTime,
      eventsPerSecond: eventCount / ((endTime - startTime) / 1000)
    };

    console.log('Event bus performance results:', results);
    return results;
  }

  /**
   * Monitor memory usage over time
   */  startMemoryMonitoring(interval = 5000) {
    if (!this.isEnabled) {
      console.warn('Debug mode must be enabled for memory monitoring');
      return;
    }

    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }

    this.logger.info(`Starting memory monitoring (${interval}ms interval)`);
    
    this.memoryMonitor = setInterval(() => {
      const memory = this.getPerformanceInfo().memory;
      if (memory) {
        this.logger.debug('Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
        });
      }
    }, interval);

    return this.memoryMonitor;
  }

  /**
   * Stop memory monitoring
   */
  stopMemoryMonitoring() {
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
      this.memoryMonitor = null;
      this.logger.info('Memory monitoring stopped');
    }
  }

  /**
   * Get framework health check
   */  healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      framework: {
        initialized: !!this.app.isInitialized,
        version: '1.0.0'
      },
      components: {
        managerInitialized: !!this.app.componentManager?.isInitialized,
        activeCount: this.app.componentManager?.getActiveComponents().size || 0
      },
      eventBus: {
        available: !!this.app.eventBus,
        stats: this.app.eventBus ? this.app.eventBus.getStats() : null
      },
      router: {
        initialized: !!this.app.router?.isInitialized,
        currentRoute: this.app.router?.getCurrentRoute()?.name || null
      },
      memory: this.getPerformanceInfo().memory,
      errors: this.getErrorStats()
    };

    // Only log to console in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Framework Health Check:', health);
    }
    
    return health;
  }
}

// Auto-expose in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  window.VanillaForgeDebug = FrameworkDebug;
}
