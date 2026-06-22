/**
 * Home Component - Enhanced Version
 * 
 * Enhanced home page component demonstrating VanillaForge capabilities
 * with performance monitoring and improved features
 * 
 * @author VanillaForge Team
 * @version 1.1.0
 * @since 2025-06-16
 */

import { BaseComponent } from './base-component.js';

export class HomeComponent extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, props);
    this.name = 'home-component';
    this.state = {
      message: 'Welcome to VanillaForge!',
      counter: 0,
      lastUpdated: null,
      performanceMetrics: null,
      isLoading: false
    };
  }

  /**
   * Initialize component
   */
  async init() {
    await super.init();
    this.logger.info('Home component initialized');
  }

  /**
   * Get component template
   * 
   * @returns {string} HTML template
   */
  getTemplate() {
    return `
      <div class="home-container">
        <div class="home-content">
          <div class="hero-section">
            <h1 class="hero-title">🔥 ${this.state.message}</h1>
            <p class="hero-subtitle">
              A modern, lightweight framework for forging Single Page Applications with vanilla JavaScript.
            </p>
            <div class="hero-features">
              <div class="feature">
                <span class="feature-icon">🏗️</span>
                <span>Component-Based Architecture</span>
              </div>
              <div class="feature">
                <span class="feature-icon">🛣️</span>
                <span>Client-Side Routing</span>
              </div>
              <div class="feature">
                <span class="feature-icon">📡</span>
                <span>Event-Driven Communication</span>
              </div>
              <div class="feature">
                <span class="feature-icon">⚡</span>
                <span>Zero Dependencies</span>
              </div>
            </div>
          </div>
            <div class="demo-section">
            <h2>🎮 Interactive Demo</h2>
            <div class="counter-demo">
              <div class="counter-display">
                <div class="counter-value">${this.state.counter}</div>
                <div class="counter-label">Counter Value</div>
                ${this.state.lastUpdated ? `<div class="last-updated">Last updated: ${new Date(this.state.lastUpdated).toLocaleTimeString()}</div>` : ''}
              </div>
              
              <div class="counter-buttons">
                <button class="btn btn-primary" data-action="increment">➕ Increment</button>
                <button class="btn btn-secondary" data-action="decrement">➖ Decrement</button>
                <button class="btn btn-outline" data-action="reset">🔄 Reset</button>
              </div>

              <div class="demo-actions">
                <button class="btn btn-info" data-action="testPerformance">📊 Test Performance</button>
                <button class="btn btn-success" data-action="showAlert">🎉 Show Alert</button>
              </div>
              
              ${this.state.performanceMetrics ? `
                <div class="performance-metrics">
                  <h4>Performance Metrics</h4>
                  <div class="metrics-grid">
                    <div class="metric">
                      <span class="metric-label">Render Time:</span>
                      <span class="metric-value">${this.state.performanceMetrics.renderTime}ms</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Memory Used:</span>
                      <span class="metric-value">${this.state.performanceMetrics.memoryUsed}MB</span>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div class="status-indicator ${this.state.isLoading ? 'loading' : 'ready'}">
              <div class="status-icon">${this.state.isLoading ? '⏳' : '✅'}</div>
              <div class="status-text">${this.state.isLoading ? 'Loading...' : 'Ready'}</div>
            </div>
          </div>
          
          <div class="info-section">
            <h2>Getting Started</h2>
            <div class="code-example">
              <pre><code>import { createApp, BaseComponent } from './src/framework.js';

class MyComponent extends BaseComponent {
    constructor(eventBus, props) {
        super(eventBus, props);
        this.name = 'my-component';
    }
    
    getTemplate() {
        return \`&lt;div&gt;Hello VanillaForge!&lt;/div&gt;\`;
    }
}

const app = createApp({ debug: true });
await app.initialize({
    routes: { '/': MyComponent },
    components: { 'my-component': MyComponent }
});
await app.start();</code></pre>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Declarative action handlers, wired to the template via `data-action`.
   * @returns {Object} Map of action name to handler
   */
  getMethods() {
    return {
      increment: () => this.increment(),
      decrement: () => this.decrement(),
      reset: () => this.reset(),
      testPerformance: () => this.testPerformance(),
      showAlert: () => this.showAlert(),
    };
  }

  increment() {
    const startTime = performance.now();
    this.setState({ 
      counter: this.state.counter + 1,
      lastUpdated: Date.now()
    });
    this.measurePerformance(startTime);
  }
  
  decrement() {
    const startTime = performance.now();
    this.setState({ 
      counter: this.state.counter - 1,
      lastUpdated: Date.now()
    });
    this.measurePerformance(startTime);
  }
  
  reset() {
    const startTime = performance.now();
    this.setState({ 
      counter: 0,
      lastUpdated: Date.now(),
      performanceMetrics: null
    });
    this.measurePerformance(startTime);
  }
  
  testPerformance() {
    this.setState({ isLoading: true });
    
    // Simulate some work
    setTimeout(() => {
      const memoryInfo = performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      } : { used: 'N/A', total: 'N/A' };
      
      this.setState({
        isLoading: false,
        performanceMetrics: {
          renderTime: Math.random() * 5 + 1, // Simulated
          memoryUsed: memoryInfo.used
        }
      });
    }, 1000);
  }
  
  async showAlert() {
    try {
      // Import SweetAlert dynamically
      const { SweetAlert } = await import('../utils/sweet-alert.js');
      
      await SweetAlert.fire({
        title: '🎉 VanillaForge!',
        text: 'This alert was triggered using the VanillaForge SweetAlert utility!',
        icon: 'success',
        confirmButtonText: 'Awesome!'
      });
    } catch (error) {
      // Fallback to regular alert
      alert('🎉 VanillaForge!\nThis is a fallback alert.');
    }
  }
  
  /**
   * Measure and update performance metrics
   * @param {number} startTime - Performance start time
   */
  measurePerformance(startTime) {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Only update if we don't already have metrics or if the render time is significant
    if (!this.state.performanceMetrics || renderTime > 1) {
      const memoryInfo = performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
      } : { used: 'N/A' };
      
      this.setState({
        performanceMetrics: {
          renderTime: Math.round(renderTime * 100) / 100,
          memoryUsed: memoryInfo.used
        }
      });
    }
  }
  /**
   * Component lifecycle methods
   */  getLifecycle() {
    return {
      onMount: async () => {
        this.logger.info('Enhanced home component mounted');

        // Emit component ready event
        if (this.eventBus) {
          this.eventBus.emit('component:ready', {
            name: this.name,
            timestamp: Date.now()
          });
        }
        
        // Start with a welcome state
        this.setState({
          lastUpdated: Date.now()
        });
      },
      
      onUnmount: () => {
        this.logger.info('Enhanced home component unmounted');

        // Emit component cleanup event
        if (this.eventBus) {
          this.eventBus.emit('component:cleanup', {
            name: this.name,
            timestamp: Date.now()
          });
        }
      }
    };
  }
}
