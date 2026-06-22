/**
 * Event Bus System
 * 
 * Centralized event management system for the VanillaForge.
 * Provides publish-subscribe functionality for loose coupling between components.
 * 
 * @author VanillaForge Team
 * @version 3.0.0
 * @since 2025-06-14
 */

import { Logger } from '../utils/logger.js';

/**
 * Event Bus class for application-wide event management
 * 
 * Implements the publish-subscribe pattern for decoupled communication
 * between different parts of the application.
 */
export class EventBus {
  /**
   * Initialize the event bus
   */
  constructor(logger) {
    this.logger = logger || new Logger('EventBus');
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Subscribe to an event
   * 
   * @param {string} event - Event name to listen for
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} [options={}] - Subscription options
   * @param {number} [options.priority=0] - Event handler priority (higher = called first)
   * @param {Object} [options.context] - Context object for the callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function.');
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listeners = this.listeners.get(event);
    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
    };

    listeners.push(listener);
    listeners.sort((a, b) => b.priority - a.priority);

    return () => this.off(event, callback);
  }

  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }

  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }

    const listeners = this.listeners.get(event);
    const index = listeners.findIndex(l => l.callback === callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }


  emit(event, data = null) {
    if (!this.listeners.has(event)) {
      return;
    }

    const listeners = this.listeners.get(event).slice();
    this.addToHistory({ event, data, timestamp: new Date().toISOString() });

    for (const listener of listeners) {
      try {
        listener.callback(data);
      } catch (error) {
        this.logger.error(`Error in event listener for ${event}`, error);
      }

      if (listener.once) {
        this.off(event, listener.callback);
      }
    }
  }


  /**
   * Add event to history
   * 
   * @private
   * @param {Object} eventData - Event data to add to history
   */
  addToHistory(eventData) {
    this.eventHistory.unshift(eventData);
    
    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }
  }


  /**
   * Get all listeners for an event
   * 
   * @param {string} event - Event name
   * @returns {Array} Array of listener objects
   */
  getListeners(event) {
    const regular = this.listeners.get(event) || [];
    const once = this.onceListeners.get(event) || [];
    
    return {
      regular: regular.map(l => ({
        id: l.id,
        priority: l.priority,
        createdAt: l.createdAt
      })),
      once: once.map(l => ({
        id: l.id,
        priority: l.priority,
        createdAt: l.createdAt
      }))
    };
  }

  /**
   * Get event statistics
   * 
   * @returns {Object} Event bus statistics
   */
  getStats() {
    const allEvents = new Set([
      ...this.listeners.keys(),
      ...this.onceListeners.keys()
    ]);
    
    const eventStats = {};
    for (const event of allEvents) {
      const regular = this.listeners.get(event) || [];
      const once = this.onceListeners.get(event) || [];
      
      eventStats[event] = {
        regularListeners: regular.length,
        onceListeners: once.length,
        total: regular.length + once.length
      };
    }
    
    return {
      totalEvents: allEvents.size,
      totalListeners: Array.from(allEvents).reduce((sum, event) => {
        return sum + eventStats[event].total;
      }, 0),
      eventStats,
      historySize: this.eventHistory.length
    };
  }

  /**
   * Get recent event history
   * 
   * @param {number} [limit=10] - Maximum number of events to return
   * @returns {Array} Recent events
   */
  getHistory(limit = 10) {
    return this.eventHistory.slice(0, limit);
  }
  /**
   * Remove all listeners
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Clear event history
   */
  clearHistory() {
    const historySize = this.eventHistory.length;
    this.eventHistory = [];
    
    this.logger.debug('Event history cleared', { historySize });
  }

  /**
   * Cleanup event bus - remove all listeners and clear history
   */
  cleanup() {
    this.removeAllListeners();
    this.clearHistory();
    this.logger.info('Event bus cleaned up');
  }

  /**
   * Set debug mode for enhanced logging
   * 
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      this.logger.info('Event bus debug mode enabled');
    } else {
      this.logger.info('Event bus debug mode disabled');
    }
  }

}
