/**
 * VanillaForge Framework
 * 
 * A modern, lightweight framework for forging Single Page Applications
 * with vanilla JavaScript. No external dependencies required.
 * 
 * Features:
 * - Component-based architecture
 * - Client-side routing
 * - Event-driven communication
 * - State management
 * - Error handling and logging
 * - Build system
 * 
 * @author Stephen Musyoka - VanillaForge Creator
 * @version 1.0.0
 * @since 2025-06-15
 */

// Core Framework Components
export { ComponentManager } from './core/component-manager.js';
export { Router } from './core/router.js';
export { EventBus } from './core/event-bus.js';

// Base Classes
export { BaseComponent } from './components/base-component.js';

// Utilities
export { Logger } from './utils/logger.js';
export { ErrorHandler, ErrorType } from './utils/error-handler.js';
export { FrameworkDebug } from './utils/framework-debug.js';
export { SweetAlert } from './utils/sweet-alert.js';
export { ValidationUtils } from './utils/validation.js';
export { PerformanceUtils, performanceUtils } from './utils/performance.js';
export { perf, cache } from './utils/decorators.js';
export { optimizeImage, batchDOMOperations } from './utils/dom.js';

// Core reactive primitive
export { Signal } from './core/signal.js';

// First-party plugins
export { iconsPlugin } from './plugins/icons/icons-plugin.js';
export { themePlugin } from './plugins/theme/theme-plugin.js';
export { alertsPlugin } from './plugins/alerts/alerts-plugin.js';
export { fontsPlugin } from './plugins/fonts/fonts-plugin.js';
export { storePlugin, StoreService } from './plugins/store/store-plugin.js';

// Import classes for internal use
import { ComponentManager } from './core/component-manager.js';
import { Router } from './core/router.js';
import { EventBus } from './core/event-bus.js';
import { Logger } from './utils/logger.js';
import { ErrorHandler } from './utils/error-handler.js';
import { Notification } from './utils/notification.js';
import { LocalStorageAdapter } from './utils/storage.js';
import { ValidationUtils } from './utils/validation.js';
import { FrameworkDebug } from './utils/framework-debug.js';
import { performanceUtils } from './utils/performance.js';

/**
 * Framework Application Class
 *
 * Main application class that initializes and manages VanillaForge
 */
export class FrameworkApp {
    constructor(config = {}) {
        this.config = {
            appName: 'VanillaForge App',
            debug: false,
            // DOM id that route components are mounted into.
            mountId: 'main-content',
            router: {
                mode: 'history',
                fallback: '/404'
            },
            logging: {
                level: 'info',
                console: true
            },
            ...config
        };

        // Service registry: all framework and plugin services live here.
        // Keys are string names; values are service instances.
        this._services = new Map();
        // Track installed plugin names to prevent double-installation.
        this._installedPlugins = new Set();

        const storageAdapter = new LocalStorageAdapter();
        this.logger = new Logger('FrameworkApp', this.config.logging.level, storageAdapter);
        this.eventBus = new EventBus(this.logger.child('EventBus'));
        this.notification = new Notification();
        this.errorHandler = new ErrorHandler(this.notification);
        this.validation = new ValidationUtils(this.logger.child('Validation'));
        this.componentManager = new ComponentManager(this.eventBus, this.logger.child('ComponentManager'), this.errorHandler, { mountId: this.config.mountId });
        // Give the component manager a reference back to the app so it can
        // wire instance.app on each mounted component.
        this.componentManager.app = this;
        this.router = null;
        this.isInitialized = false;
        this.performanceUtils = performanceUtils;

        // Register built-in services so plugins and components can find them.
        this._services.set('eventBus', this.eventBus);
        this._services.set('logger', this.logger);
        this._services.set('errorHandler', this.errorHandler);
        this._services.set('notification', this.notification);
        this._services.set('validation', this.validation);
        this._services.set('componentManager', this.componentManager);
        this._services.set('performanceUtils', this.performanceUtils);

        // Enable debug mode if configured
        if (this.config.debug) {
            this.frameworkDebug = new FrameworkDebug(this);
            this.frameworkDebug.enable();
        }

        this.logger.info('VanillaForge application created', this.config);
    }

    /**
     * Register (or replace) a named service in the registry.
     * Call this from a plugin's install() or from app-level setup code.
     *
     * @param {string} name - Service name, e.g. 'icons', 'theme', 'alerts'
     * @param {*} instance - The service instance
     * @returns {FrameworkApp} this, for chaining
     */
    provide(name, instance) {
        this._services.set(name, instance);
        this.logger.debug(`Service provided: ${name}`);
        return this;
    }

    /**
     * Install a plugin. A plugin is either:
     *   - a function:  (app, options) => void
     *   - an object:   { name: string, install(app, options): void }
     *
     * The same plugin (identified by name or reference) is never installed twice.
     * Plugins may call app.provide(), app.componentManager.registerComponent(), or
     * subscribe to events. Plugins installed before app.initialize() run first.
     *
     * @param {Function|Object} plugin - Plugin function or object
     * @param {Object} options - Options passed to the plugin's install function
     * @returns {FrameworkApp} this, for chaining
     */
    use(plugin, options = {}) {
        const pluginName = typeof plugin === 'object' ? plugin.name : plugin;
        const pluginKey = pluginName || plugin;

        if (this._installedPlugins.has(pluginKey)) {
            this.logger.warn(`Plugin already installed, skipping: ${pluginName || '(anonymous)'}`);
            return this;
        }

        if (typeof plugin === 'function') {
            plugin(this, options);
        } else if (plugin && typeof plugin.install === 'function') {
            plugin.install(this, options);
        } else {
            throw new Error('VanillaForge plugin must be a function or an object with an install() method');
        }

        this._installedPlugins.add(pluginKey);
        this.logger.debug(`Plugin installed: ${pluginName || '(anonymous)'}`);
        return this;
    }
    
    /**
     * Initialize the framework application
     * @param {Object} options - Initialization options
     */
    async initialize(options = {}) {
        if (this.isInitialized) {
            this.logger.warn('Application already initialized');
            return;
        }
          try {
            this.logger.info('Initializing framework application...');
            
            // Initialize component manager first (to set up event listeners)
            await this.componentManager.initialize();
            
            // Register components
            if (options.components) {
                Object.entries(options.components).forEach(([name, component]) => {
                    this.componentManager.registerComponent(name, component);
                });
                this.logger.info('Components registered', Object.keys(options.components));
            }
              // Initialize router if routing is enabled (after ComponentManager is ready)
            if (options.routes) {
                this.router = new Router(this.eventBus, this.logger.child('Router'), this.errorHandler, this.config.router);
                // Make the router discoverable via app.get('router')
                this._services.set('router', this.router);

                // Register routes
                Object.entries(options.routes).forEach(([path, component]) => {
                    this.router.addRoute(path, component);
                });

                await this.router.initialize();
                this.logger.info('Router initialized with routes', Object.keys(options.routes));
            }
            
            this.isInitialized = true;
            this.eventBus.emit('framework:initialized', { app: this });
            this.logger.info('Framework application initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize framework application', error);
            this.errorHandler.handleError(error, 'APP_INIT_ERROR');
            throw error;
        }
    }
    
    /**
     * Start the application
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error('Application must be initialized before starting');
        }
        
        try {
            this.logger.info('Starting framework application...');
            
            // Start router if available
            if (this.router) {
                await this.router.start();
            }
            
            this.eventBus.emit('framework:started', { app: this });
            this.logger.info('Framework application started successfully');
            
        } catch (error) {
            this.logger.error('Failed to start framework application', error);
            this.errorHandler.handleError(error, 'APP_START_ERROR');
            throw error;
        }
    }
    
    /**
     * Navigate to a route
     * @param {string} path - Route path
     * @param {Object} options - Navigation options
     */
    navigate(path, options = {}) {
        if (this.router) {
            return this.router.navigate(path, options);
        } else {
            this.logger.warn('Router not initialized, cannot navigate');
        }
    }
      /**
     * Retrieve a service by name.
     * Checks the service registry first, then falls back to registered
     * component classes (for backward-compatibility with existing app.get() calls).
     *
     * @param {string} name - Service name (e.g. 'router', 'icons', 'eventBus')
     * @returns {*} Service instance, or null if not found
     */
    get(name) {
        // Named service in the registry (covers both built-ins and plugins).
        if (this._services.has(name)) {
            return this._services.get(name);
        }
        // Router is registered lazily after initialize().
        if (name === 'router') {
            return this.router;
        }
        // Fall back to looking up a registered component class.
        if (this.componentManager.components.has(name)) {
            return this.componentManager.components.get(name);
        }
        return null;
    }
    
    /**
     * Shutdown the application
     */
    async shutdown() {
        try {
            this.logger.info('Shutting down framework application...');
            
            this.eventBus.emit('framework:shutdown', { app: this });
            
            if (this.router) {
                await this.router.cleanup();
            }
              await this.componentManager.cleanup();
            this.eventBus.cleanup();
            
            if (this.frameworkDebug) {
                this.frameworkDebug.disable();
            }
            
            // Cleanup performance utilities
            this.performanceUtils.cleanup();
            
            this.isInitialized = false;
            this.logger.info('Framework application shutdown complete');
            
        } catch (error) {
            this.logger.error('Error during application shutdown', error);
            throw error;
        }
    }
}

/**
 * Create a new framework application instance
 * @param {Object} config - Application configuration
 * @returns {FrameworkApp} Framework application instance
 */
export function createApp(config = {}) {
    return new FrameworkApp(config);
}

// Framework metadata
export const FRAMEWORK_VERSION = '1.8.0';
export const FRAMEWORK_NAME = 'VanillaForge';
