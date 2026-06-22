/**
 * Not Found Component
 * 
 * 404 error page component
 * 
 * @author VanillaForge Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { BaseComponent } from './base-component.js';

export class NotFoundComponent extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, props);
    this.name = 'not-found-component';
    this.cssPath = 'src/styles/components/not-found-component.css';
  }

  /**
   * Initialize component
   */
  async init() {
    await super.init();
    
    // Load component-specific CSS
    try {
      await this.loadCSS(this.cssPath);
    } catch (error) {
      console.warn(`Failed to load CSS for ${this.name}:`, error);
    }
  }

  /**
   * Cleanup component
   */
  destroy() {
    // Unload component-specific CSS
    this.unloadCSS(this.cssPath);
    super.destroy();
  }

  /**
   * Get component template
   * 
   * @returns {string} HTML template
   */
  getTemplate() {
    return `
      <div class="nf">
        <div class="nf-content">
          <span class="nf-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.2-3.2M9 11h4"/>
            </svg>
          </span>
          <p class="nf-code">404</p>
          <h1 class="nf-title">Page not found</h1>
          <p class="nf-message">The page you're looking for doesn't exist or has moved.</p>
          <div class="nf-actions">
            <button class="nf-btn nf-btn-accent" data-action="goHome">Go home</button>
            <button class="nf-btn nf-btn-ghost" data-action="goBack">Go back</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Component methods
   */
  getMethods() {
    return {
      goHome: () => {
        this.eventBus.emit('router:navigate', '/');
      },

      goBack: () => {
        window.history.back();
      }
    };
  }

  /**
   * Component lifecycle methods
   */
  getLifecycle() {
    return {
      onMount: () => {
        this.logger?.debug('Not found component mounted');
      },

      onUnmount: () => {
        this.logger?.debug('Not found component unmounted');
      }
    };
  }
}
