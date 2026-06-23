/**
 * Router System
 * 
 * Handles client-side routing for VanillaForge applications.
 * Manages navigation, route protection, and URL state management.
 * 
 * @author VanillaForge Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { Logger } from '../utils/logger.js';
import { ErrorHandler, ErrorType } from '../utils/error-handler.js';

/**
 * Router class for client-side navigation
 * 
 * Manages application routes, navigation, and URL state without full page reloads.
 */
export class Router {
  /**
   * Initialize the router
   * 
   * @param {EventBus} eventBus - Application event bus
   * @param {Logger} logger - Logger instance
   * @param {ErrorHandler} errorHandler - Error handler instance
   * @param {Object} config - Router configuration
   */  
  constructor(eventBus, logger, errorHandler, config = {}) {
    this.eventBus = eventBus;
    this.logger = logger || new Logger('Router');
    this.errorHandler = errorHandler || new ErrorHandler();
    this.config = {
      basePath: '',
      mode: 'history',
      fallback: '/404',
      ...config
    };
    this.routes = new Map();
    this.currentRoute = null;
    this.isInitialized = false;
    this.beforeNavigationCallbacks = [];
    this.afterNavigationCallbacks = [];
    this.isNavigating = false;

    // Normalize base path
    this.basePath = this.config.basePath.replace(/\/+$/, ''); // Remove trailing slashes

    this.handlePopState = this.handlePopState.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
  }

  /**
   * Initialize the router
   * 
   * @returns {Promise<void>}
   */
  async init() {
    try {
      this.logger.info('Initializing router...');
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Handle initial route
      await this.handleInitialRoute();
      
      this.isInitialized = true;
      this.logger.info('Router initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize router', error);
      this.errorHandler.handleError(error, ErrorType.SYSTEM);
      throw error;
    }
  }

  /**
   * Alias for init() to maintain compatibility with FrameworkApp
   */
  async initialize() {
    return this.init();
  }

  /**
   * Alias for init() to maintain compatibility with FrameworkApp
   */
  async start() {
    if (!this.isInitialized) {
      await this.init();
    }
    this.logger.info('Router started');
  }

  /**
   * Add a route to the router
   * 
   * @param {string} path - Route path
   * @param {Object|Function} config - Route configuration object or component class
   */
  addRoute(path, config) {
    // Support both object config and direct component class
    const routeConfig = typeof config === 'function' ? {
      component: config,
      protected: false,
      title: null
    } : config;

    this.routes.set(path, {
      path,
      name: routeConfig.name || path.replace('/', '') || 'home',
      component: routeConfig.component,
      loader: routeConfig.loader || null,
      protected: routeConfig.protected || false,
      requiredRole: routeConfig.requiredRole || null,
      title: routeConfig.title || 'VanillaForge App',
      beforeEnter: routeConfig.beforeEnter || null,
      afterEnter: routeConfig.afterEnter || null
    });
    
    this.logger.debug(`Route added: ${path}`, routeConfig);
  }

  /**
   * Set up event listeners
   * 
   * @private
   */
  setupEventListeners() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', this.handlePopState);

    // Handle link clicks for SPA navigation
    document.addEventListener('click', this.handleLinkClick);

    // Allow components to request navigation over the event bus
    this.eventBus.on('router:navigate', (payload) => {
      const path = typeof payload === 'string' ? payload : payload?.path;
      const options = (payload && typeof payload === 'object') ? payload.options : undefined;
      if (path) this.navigateTo(path, options);
    });

    this.logger.debug('Event listeners set up');
  }
  /**
   * Handle initial route when the app starts
   * 
   * @private
   */  
  async handleInitialRoute() {
    const currentPath = window.location.pathname;
    const resolvedPath = this.resolvePathFromBase(currentPath);
    await this.navigateTo(resolvedPath, { replace: true });
  }
  /**
   * Handle browser back/forward navigation
   * 
   * @param {PopStateEvent} event - Pop state event
   * @private
   */
  async handlePopState(event) {
    const path = window.location.pathname;
    const resolvedPath = this.resolvePathFromBase(path);
    await this.navigateTo(resolvedPath, { fromPopState: true });
  }
  /**
   * Handle link clicks for SPA navigation
   * 
   * @param {Event} event - Click event
   * @private
   */
  handleLinkClick(event) {
    const link = event.target.closest('a');
    
    if (!link || !link.href) return;
    
    // Only handle internal links
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    
    // Skip if link has download attribute or opens in new tab
    if (link.download || link.target === '_blank') return;
    
    // Skip if modifier keys are pressed
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    
    event.preventDefault();
    const resolvedPath = this.resolvePathFromBase(url.pathname);
    this.navigateTo(resolvedPath + url.search + url.hash);
  }

  /**
   * Navigate to a specific path
   * 
   * @param {string} path - Path to navigate to
   * @param {Object} options - Navigation options
   * @returns {Promise<boolean>} - Success status
   */
  async navigateTo(path, options = {}) {
    if (this.isNavigating) {
      this.logger.warn('Navigation already in progress.');
      return;
    }

    this.isNavigating = true;
    this.logger.info(`Navigating to ${path}`);

    try {
      const { route, params } = this.findRoute(path);      if (!route) {
        this.logger.warn(`No route found for path: ${path}`);
        this.eventBus.emit('router:not-found', { path });

        // Fall back to the configured route (e.g. a 404 component) so the user
        // sees something instead of a blank screen. Guard against looping when
        // the fallback itself is unregistered.
        const fallback = this.config.fallback;
        if (fallback && path !== fallback && this.findRoute(fallback).route) {
          this.logger.info(`Routing to fallback: ${fallback}`);
          this.isNavigating = false;
          return this.navigateTo(fallback, { replace: true });
        }

        this.isNavigating = false;
        return;
      }

      const canNavigate = await this.runBeforeNavigationCallbacks(route, path);
      if (!canNavigate) {
        this.isNavigating = false;
        return;
      }      if (!options.fromPopState) {
        const fullPath = this.addBasePath(path);
        const url = fullPath + (options.query ? `?${new URLSearchParams(options.query)}` : '');
        window.history[options.replace ? 'replaceState' : 'pushState']({ path }, '', url);
      }

      this.currentRoute = { ...route, params };
      document.title = route.title || 'VanillaForge App';

      let loaderData;
      if (route.loader) {
        try {
          loaderData = await route.loader({ params, path });
        } catch (err) {
          this.logger.error('Route loader failed', err);
        }
      }

      this.eventBus.emit('router:load-component', {
        component: route.component,
        route: this.currentRoute,
        loaderData,
      });

      await this.runAfterNavigationCallbacks(this.currentRoute, path);
      this.eventBus.emit('router:navigated', { route: this.currentRoute, path });
    } catch (error) {
      this.errorHandler.handleError(error, { path, options });
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Navigate (alias for navigateTo)
   */
  navigate(path, options = {}) {
    return this.navigateTo(path, options);
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Find a route that matches the given path
   * 
   * @param {string} path - Path to match
   * @returns {Object|null} - Matching route or null
   * @private
   */
  findRoute(path) {
    for (const [routePath, route] of this.routes) {
      const { isMatch, params } = this.matchesRoute(path, routePath);
      if (isMatch) {
        return { route, params };
      }
    }
    return { route: null, params: {} };
  }

  /**
   * Check if a path matches a route pattern
   * 
   * @param {string} path - Actual path
   * @param {string} routePattern - Route pattern
   * @returns {boolean} - Whether they match
   * @private
   */
  matchesRoute(path, routePattern) {
    const params = {};
    const pathParts = path.split('/').filter(p => p);
    const routeParts = routePattern.split('/').filter(p => p);

    if (routeParts.length !== pathParts.length) {
      return { isMatch: false, params };
    }

    const isMatch = routeParts.every((part, index) => {
      if (part.startsWith(':')) {
        params[part.substring(1)] = pathParts[index];
        return true;
      }
      return part === pathParts[index];
    });

    return { isMatch, params };
  }

  /**
   * Load the component for a route
   * 
   * @param {Object} route - Route object
   * @private
   */  async loadRouteComponent(route) {
    if (typeof route.component === 'string') {
      // Component name - emit event to component manager
      this.eventBus.emit('router:load-component', {
        component: route.component,
        route
      });
    } else if (typeof route.component === 'function') {
      // Component class - emit event to component manager
      this.eventBus.emit('router:load-component', {
        component: route.component,
        route
      });
    } else {
      throw new Error(`Invalid component type for route: ${route.path}`);
    }
  }

  /**
   * Run before navigation callbacks
   * 
   * @param {Object} route - Route object
   * @param {string} path - Target path
   * @returns {Promise<boolean>} - Whether navigation should continue
   * @private
   */
  async runBeforeNavigationCallbacks(route, path) {
    for (const callback of this.beforeNavigationCallbacks) {
      try {
        const result = await callback(route, path);
        if (result === false) {
          this.logger.debug('Navigation cancelled by before callback');
          return false;
        }
      } catch (error) {
        this.logger.error('Before navigation callback failed', error);
        return false;
      }
    }
    
    if (route.beforeEnter) {
      try {
        const result = await route.beforeEnter(route, path);
        if (result === false) {
          this.logger.debug('Navigation cancelled by route beforeEnter');
          return false;
        }
      } catch (error) {
        this.logger.error('Route beforeEnter failed', error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Run after navigation callbacks
   * 
   * @param {Object} route - Route object
   * @param {string} path - Current path
   * @private
   */
  async runAfterNavigationCallbacks(route, path) {
    for (const callback of this.afterNavigationCallbacks) {
      try {
        await callback(route, path);
      } catch (error) {
        this.logger.error('After navigation callback failed', error);
      }
    }
    
    if (route.afterEnter) {
      try {
        await route.afterEnter(route, path);
      } catch (error) {
        this.logger.error('Route afterEnter failed', error);
      }
    }
  }

  /**
   * Add before navigation callback
   * 
   * @param {Function} callback - Callback function
   */
  beforeNavigation(callback) {
    this.beforeNavigationCallbacks.push(callback);
  }

  /**
   * Add after navigation callback
   * 
   * @param {Function} callback - Callback function
   */
  afterNavigation(callback) {
    this.afterNavigationCallbacks.push(callback);
  }

  /**
   * Clean up router
   */
  async cleanup() {
    window.removeEventListener('popstate', this.handlePopState);
    document.removeEventListener('click', this.handleLinkClick);
    
    this.routes.clear();
    this.beforeNavigationCallbacks = [];
    this.afterNavigationCallbacks = [];
    this.currentRoute = null;
    this.isInitialized = false;
    
    this.logger.info('Router cleaned up');
  }

  /**
   * Resolve base path from current path
   * 
   * @param {string} path - Full path including base path
   * @returns {string} - Path without base path
   * @private
   */
  resolvePathFromBase(path) {
    let resolved = path;

    if (this.basePath && resolved.startsWith(this.basePath)) {
      resolved = resolved.slice(this.basePath.length) || '/';
    }

    // Treat a trailing directory entry file (index.html) as the root of its
    // directory, so serving from a subfolder still matches the '/' route.
    resolved = resolved.replace(/\/?index\.html?$/i, '/');

    if (!resolved.startsWith('/')) resolved = '/' + resolved;
    return resolved;
  }

  /**
   * Add base path to path
   * 
   * @param {string} path - Path to add base to
   * @returns {string} - Path with base path
   * @private
   */
  addBasePath(path) {
    if (!this.basePath) return path;
    
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    return this.basePath + normalizedPath;
  }

  /**
   * Get current base path
   * 
   * @returns {string} - Current base path
   */
  getBasePath() {
    return this.basePath;
  }
}
