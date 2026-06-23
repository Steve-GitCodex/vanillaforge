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
      <div class="vf-home">
        <header class="vf-nav">
          <a class="vf-brand" href="/">
            ${this.flameIcon()}
            <span>VanillaForge</span>
          </a>
          <nav class="vf-nav-links">
            <span class="vf-version">v1.9.1</span>
            <a href="https://github.com/Steve-GitCodex/vanillaforge" target="_blank" rel="noopener">GitHub</a>
          </nav>
        </header>

        <section class="vf-hero">
          <p class="vf-eyebrow">Zero dependencies &middot; ~14.5 KB gzipped</p>
          <h1>Build SPAs with<br><span class="vf-accent">plain web standards.</span></h1>
          <p class="vf-lede">
            A small, dependency-free JavaScript framework. Components, client-side
            routing, and an event bus &mdash; with focus-preserving reactive rendering
            and no required build step.
          </p>
          <div class="vf-cta">
            <a class="vf-btn vf-btn-accent" href="#start">Get started</a>
            <a class="vf-btn vf-btn-ghost" href="https://github.com/Steve-GitCodex/vanillaforge" target="_blank" rel="noopener">View source</a>
          </div>
        </section>

        <section class="vf-features">
          ${this.featureCard(this.iconComponents(), 'Component-based', 'Class components with lifecycle hooks and local state.')}
          ${this.featureCard(this.iconRouting(), 'Client-side routing', 'History-API routes with params and a fallback route.')}
          ${this.featureCard(this.iconEvents(), 'Event-driven', 'A pub/sub event bus for decoupled communication.')}
          ${this.featureCard(this.iconReactive(), 'Reactive rendering', 'DOM morphing patches only what changed and keeps input focus.')}
        </section>

        <section class="vf-panel">
          <div class="vf-panel-head">
            <h2>Live reactivity</h2>
            <p>State updates re-render through a DOM morph &mdash; only changed nodes are touched.</p>
          </div>

          <div class="vf-counter">
            <div class="vf-counter-value">${this.state.counter}</div>
            <div class="vf-counter-actions">
              <button class="vf-btn vf-btn-line" data-action="decrement" aria-label="Decrement">&minus;</button>
              <button class="vf-btn vf-btn-line" data-action="reset">Reset</button>
              <button class="vf-btn vf-btn-line" data-action="increment" aria-label="Increment">+</button>
            </div>
            ${this.state.lastUpdated ? `<p class="vf-counter-meta">Updated ${new Date(this.state.lastUpdated).toLocaleTimeString()}</p>` : `<p class="vf-counter-meta">Use the controls to update state</p>`}
          </div>

          <div class="vf-measure">
            <button class="vf-link" data-action="testPerformance">${this.state.isLoading ? 'Measuring…' : 'Measure render performance'}</button>
            ${this.state.performanceMetrics ? `
              <dl class="vf-stats">
                <div><dt>Render time</dt><dd>${this.state.performanceMetrics.renderTime} ms</dd></div>
                <div><dt>Memory</dt><dd>${this.state.performanceMetrics.memoryUsed} MB</dd></div>
              </dl>
            ` : ''}
          </div>
        </section>

        <section class="vf-panel" id="start">
          <div class="vf-panel-head">
            <h2>Getting started</h2>
            <p>Import the framework and register a route. No build step required.</p>
          </div>
          <div class="vf-code">
            <div class="vf-code-bar">
              <span></span><span></span><span></span>
              <em>app.js</em>
            </div>
            <pre><code>import { createApp, BaseComponent } from './src/framework.js';

class MyComponent extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, props);
    this.name = 'my-component';
    this.state = { count: 0 };
  }

  getTemplate() {
    return \`&lt;button data-action="inc"&gt;Count: \${this.state.count}&lt;/button&gt;\`;
  }

  getMethods() {
    return { inc: () =&gt; this.setState({ count: this.state.count + 1 }) };
  }
}

const app = createApp();
await app.initialize({ routes: { '/': MyComponent } });
await app.start();</code></pre>
          </div>
        </section>

        <footer class="vf-footer">
          <span>VanillaForge &middot; MIT License</span>
          <a href="https://github.com/Steve-GitCodex/vanillaforge" target="_blank" rel="noopener">github.com/Steve-GitCodex/vanillaforge</a>
        </footer>
      </div>
    `;
  }

  /**
   * Render a feature card with an inline SVG icon.
   * @private
   */
  featureCard(icon, title, body) {
    return `
      <article class="vf-feature">
        <span class="vf-feature-icon">${icon}</span>
        <h3>${title}</h3>
        <p>${body}</p>
      </article>`;
  }

  // --- Inline line-art icons (no emoji) -------------------------------------

  flameIcon() {
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.5-2.2 1-3 .3 1 .8 1.5 1.5 1.8C10 7 11 4.5 12 2Z"/><path d="M8.5 14a3.5 3.5 0 0 0 7 0"/></svg>`;
  }
  iconComponents() {
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;
  }
  iconRouting() {
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 16 16 8M6 15.5V12a4 4 0 0 1 4-4h4"/></svg>`;
  }
  iconEvents() {
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M5 5a9.5 9.5 0 0 0 0 14M19 19a9.5 9.5 0 0 0 0-14"/></svg>`;
  }
  iconReactive() {
    return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/></svg>`;
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
