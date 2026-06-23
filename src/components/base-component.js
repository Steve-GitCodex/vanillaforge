/**
 * Base Component Class
 * 
 * This is the foundation class for all UI components in VanillaForge applications.
 * It provides common functionality for component lifecycle, event handling, and state management.
 * 
 * Features:
 * - Lifecycle methods (init, render, destroy)
 * - Event handling and cleanup
 * - State management
 * - Property validation
 * - Error boundary protection
 * 
 * @author VanillaForge Team
 * @version 1.0.0
 * @since 2025-06-15
 */

import { EventBus } from '../core/event-bus.js';
import { Logger } from '../utils/logger.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { morph } from '../core/dom-morph.js';
import { Signal } from '../core/signal.js';

/**
 * Base Component Class
 * 
 * All UI components should extend this class to inherit common functionality
 * and maintain consistency across the application.
 */
export class BaseComponent {
    /**
     * Create a new component instance
     * 
     * @param {EventBus} eventBus - The event bus for communication
     * @param {Object} props - Component properties and configuration
     * @param {string} props.name - Component name for logging and debugging
     * @param {boolean} props.autoRender - Whether to automatically render on initialization
     */
    constructor(eventBus, props = {}) {
        // Validate required parameters
        if (!eventBus) {
            throw new Error('BaseComponent requires an EventBus instance');
        }

        // Core properties
        this.eventBus = eventBus;
        this.container = null; // Will be set during rendering
        this.element = null; // Will be set during rendering
        this.name = props.name || this.constructor.name;
        this.props = props || {};
        this.state = {};

        // Component lifecycle flags
        this.isInitialized = false;
        this.isRendered = false;
        this.isDestroyed = false;

        // Event management
        this.eventListeners = new Map();
        this.eventBusSubscriptions = [];        // Configuration
        this.autoRender = props.autoRender !== false; // Default to true
        this.autoLoadCSSEnabled = props.autoLoadCSS !== false; // Default to true
        // Initialize logger with component context
        this.logger = new Logger(`Component:${this.name}`, 'info');

        // Initialize error handler
        this.errorHandler = new ErrorHandler();

        // Delegated DOM listeners attached once to the stable wrapper element.
        this._delegationBound = false;
        this._delegatedListeners = [];

        // Composition: children and per-render spec buffer.
        // _children: Map<resolvedKey, BaseComponent instance>
        // _childSpecs: Array filled by child() calls during getTemplate()
        this._children = new Map();
        this._childSpecs = [];
        this._childIndex = 0;

        // Signals: reactive primitives created by this.signal()
        this._signals = [];
        this._signalRenderPending = false;

        // Set by the framework (ComponentManager / parent component) so child()
        // calls can look up sibling components by registered name.
        this._resolveComponent = null;

        // Set by ComponentManager so components can reach plugin services.
        this.app = null;

        // Bind methods to maintain context
        this.handleError = this.handleError.bind(this);
        this.cleanup = this.cleanup.bind(this);

        this.logger.info('Component initialized', { name: this.name, props: this.props });
    }

    /**
     * Initialize the component
     * 
     * This method should be called after component construction to set up
     * event listeners, validate props, and perform initial rendering.
     * 
     * @returns {Promise<void>}
     */    async init() {
        if (this.isInitialized) {
            this.logger.warn('Component already initialized');
            return;
        }

        try {
            this.logger.debug('Initializing component');

            // Validate component properties
            await this.validateProps();            // Auto-load CSS files if enabled
            if (this.autoLoadCSSEnabled !== false) {
                await this.autoLoadCSS();
            }

            // Setup component-specific initialization
            await this.onInit();

            // Setup event listeners
            this.setupEventListeners();

            // Auto-render if enabled
            if (this.autoRender) {
                await this.render();
            }
            this.isInitialized = true;
            this.logger.info('Component initialized successfully', { name: this.name, props: this.props });

            // Emit initialization complete event
            this.emit('component:initialized', { component: this.name });

        } catch (error) {
            this.handleError(error, 'Component initialization failed');
            throw error;
        }
    }/**
     * Render the component
     * 
     * This method generates and inserts the component's HTML into the container.
     * It handles the complete rendering lifecycle including cleanup of existing content.
     * 
     * @returns {Promise<void>}
     */
    async render() {
        if (this.isDestroyed) {
            throw new Error('Cannot render destroyed component');
        }
        if (!this.container) {
            throw new Error('Component has no container to render into');
        }

        const renderStartTime = performance.now();

        try {
            this.logger.debug('Rendering component');

            // Reset per-render child spec buffer before calling getTemplate(),
            // which will refill it via this.child() calls.
            this._childSpecs = [];
            this._childIndex = 0;

            // Generate component HTML
            let html;
            if (typeof this.getHTML === 'function') {
                html = await this.getHTML();
            } else if (typeof this.getTemplate === 'function') {
                html = this.getTemplate();
            } else {
                throw new Error('Component must implement getHTML() or getTemplate() method');
            }

            if (!this.element) {
                // First render: create a stable wrapper that persists across
                // re-renders so event delegation and focus survive morphing.
                this.element = document.createElement('div');
                this.element.className = `component ${this.name}`.trim();
                this.container.innerHTML = '';
                this.container.appendChild(this.element);
                this.element.innerHTML = html;
                this.bindEventDelegation();
            } else {
                // Subsequent renders: patch only what changed.
                morph(this.element, html);
            }

            // Mount, update, or unmount child components declared via child().
            await this.reconcileChildren();

            // Post-render setup
            await this.onRender();

            this.isRendered = true;

            const renderTime = performance.now() - renderStartTime;
            this.logger.debug('Component rendered successfully', { renderTime: `${renderTime.toFixed(2)}ms` });

            // Emit render complete event with performance data
            this.emit('component:rendered', {
                component: this.name,
                renderTime
            });

        } catch (error) {
            this.handleError(error, 'Component rendering failed');
            throw error;
        }
    }

    /**
     * Update component properties and re-render if necessary
     * 
     * @param {Object} newProps - New properties to merge with existing props
     * @param {boolean} forceRender - Force re-render even if props haven't changed
     * @returns {Promise<void>}
     */
    async updateProps(newProps = {}, forceRender = false) {
        try {
            const oldProps = { ...this.props };
            this.props = { ...this.props, ...newProps };

            // Check if props actually changed
            const propsChanged = JSON.stringify(oldProps) !== JSON.stringify(this.props);

            if (propsChanged || forceRender) {
                this.logger.debug('Props updated, re-rendering', { oldProps, newProps });

                // Validate new props
                await this.validateProps();

                // Re-render component
                await this.render();

                // Emit props updated event
                this.emit('component:propsUpdated', {
                    component: this.name,
                    oldProps,
                    newProps: this.props
                });
            }

        } catch (error) {
            this.handleError(error, 'Props update failed');
            throw error;
        }
    }    /**
     * Update component state and trigger re-render if needed
     * 
     * @param {Object} newState - New state to merge with existing state
     * @param {boolean} autoRender - Whether to automatically re-render after state update
     * @returns {Promise<void>}
     */
    async setState(newState = {}, autoRender = true) {
        try {
            // Prevent concurrent state updates
            if (this._updatingState) {
                this.logger.warn('State update already in progress, queuing update');
                // Queue the state update
                if (!this._stateUpdateQueue) {
                    this._stateUpdateQueue = [];
                }
                this._stateUpdateQueue.push({ newState, autoRender });
                return;
            }

            this._updatingState = true;

            try {
                const oldState = { ...this.state };
                this.state = { ...this.state, ...newState };

                this.logger.debug('State updated', { oldState, newState: this.state });

                if (autoRender && this.isRendered && !this.isDestroyed) {
                    await this.render();
                }

                // Emit state updated event
                this.emit('component:stateUpdated', {
                    component: this.name,
                    oldState,
                    newState: this.state
                });

            } finally {
                this._updatingState = false;

                // Process queued state updates
                if (this._stateUpdateQueue && this._stateUpdateQueue.length > 0) {
                    const queuedUpdate = this._stateUpdateQueue.shift();
                    // Process next update asynchronously to avoid blocking
                    setTimeout(() => {
                        this.setState(queuedUpdate.newState, queuedUpdate.autoRender);
                    }, 0);
                }
            }

        } catch (error) {
            this._updatingState = false;
            this.handleError(error, 'State update failed');
            throw error;
        }
    }

    /**
     * Destroy the component and clean up resources
     * 
     * This method should be called when the component is no longer needed
     * to prevent memory leaks and clean up event listeners.
     */
    destroy() {
        if (this.isDestroyed) {
            this.logger.warn('Component already destroyed');
            return;
        }

        try {
            this.logger.debug('Destroying component');

            // Component-specific cleanup
            this.onDestroy();

            // Clean up event listeners and subscriptions
            this.cleanup();

            // Clear container
            if (this.container) {
                this.container.innerHTML = '';
            }

            // Mark as destroyed
            this.isDestroyed = true;
            this.isRendered = false;
            this.isInitialized = false;

            this.logger.info('Component destroyed successfully');

            // Emit destruction event
            this.emit('component:destroyed', { component: this.name });

        } catch (error) {
            this.handleError(error, 'Component destruction failed');
        }
    }    /**
     * Add event listener to an element with automatic cleanup
     * 
     * @param {HTMLElement|string} target - Element or selector to attach event to
     * @param {string} event - Event type (e.g., 'click', 'change')
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     */
    addEventListener(target, event, handler, options = {}) {
        try {
            let element = target;

            // If target is a string, find element within component container
            if (typeof target === 'string') {
                element = this.container.querySelector(target);
                if (!element) {
                    this.logger.warn('Element not found for event listener', { selector: target });
                    return;
                }
            }

            // Validate element
            if (!element || !(element instanceof HTMLElement)) {
                throw new Error('Invalid element for event listener');
            }

            // Create wrapped handler for error handling
            const wrappedHandler = (e) => {
                try {
                    handler.call(this, e);
                } catch (error) {
                    this.handleError(error, `Event handler failed for ${event}`);
                }
            };

            // Add event listener
            element.addEventListener(event, wrappedHandler, options);

            // Store for cleanup with a more unique key
            const key = `${element.tagName}-${event}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            this.eventListeners.set(key, {
                element,
                event,
                handler: wrappedHandler,
                options
            });

            this.logger.debug('Event listener added', { target: typeof target === 'string' ? target : target.tagName, event });

            return key; // Return key for manual removal if needed

        } catch (error) {
            this.handleError(error, 'Failed to add event listener');
            return null;
        }
    }

    /**
     * Subscribe to EventBus events with automatic cleanup
     * 
     * @param {string} eventName - Event name to subscribe to
     * @param {Function} handler - Event handler function
     */    subscribe(eventName, handler) {
        try {
            // Create wrapped handler for error handling
            const wrappedHandler = (data) => {
                try {
                    handler.call(this, data);
                } catch (error) {
                    this.handleError(error, `EventBus handler failed for ${eventName}`);
                }
            };

            // Subscribe to event using the eventBus instance and get unsubscribe function
            const unsubscribe = this.eventBus.on(eventName, wrappedHandler);

            // Store for cleanup
            this.eventBusSubscriptions.push({
                eventName,
                unsubscribe
            });

            this.logger.debug('EventBus subscription added', { eventName });

        } catch (error) {
            this.handleError(error, 'Failed to subscribe to EventBus event');
        }
    }

    /**
     * Emit an event through the EventBus
     * 
     * @param {string} eventName - Event name to emit
     * @param {*} data - Event data
     */    emit(eventName, data) {
        try {
            this.eventBus.emit(eventName, data);
            this.logger.debug('Event emitted', { eventName, data });
        } catch (error) {
            this.handleError(error, 'Failed to emit event');
        }
    }

    /**
     * Create a reactive signal linked to this component.
     *
     * When signal.set(newValue) is called, the component re-renders via the
     * existing DOM morph. Multiple .set() calls within the same synchronous
     * block are batched into a single render (scheduled as a microtask).
     *
     * The signal is automatically destroyed when the component is destroyed.
     *
     * @param {*} initialValue
     * @returns {Signal}
     */
    signal(initialValue) {
        const sig = new Signal(initialValue)._link(this);
        this._signals.push(sig);
        return sig;
    }

    /**
     * Schedule one morph re-render in the next microtask.
     * Idempotent: calling it multiple times before the microtask fires
     * results in exactly one render.
     * @private
     */
    _scheduleSignalRender() {
        if (this._signalRenderPending) return;
        this._signalRenderPending = true;
        Promise.resolve().then(() => {
            this._signalRenderPending = false;
            if (this.isRendered && !this.isDestroyed) {
                this.render();
            }
        });
    }

    /**
     * Find elements within the component container
     *
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null} First matching element
     */
    querySelector(selector) {
        return (this.element || this.container).querySelector(selector);
    }

    /**
     * Find all elements within the component container
     * 
     * @param {string} selector - CSS selector
     * @returns {NodeList} All matching elements
     */
    querySelectorAll(selector) {
        return (this.element || this.container).querySelectorAll(selector);
    }

    /**
     * Load CSS file dynamically
     * 
     * @param {string} cssPath - Path to the CSS file
     * @returns {Promise<void>}
     */
    async loadCSS(cssPath) {
        return new Promise((resolve, reject) => {
            // Check if CSS is already loaded
            const existingLink = document.querySelector(`link[href="${cssPath}"]`);
            if (existingLink) {
                resolve();
                return;
            }

            // Create link element
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = cssPath;

            // Handle load/error events
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${cssPath}`));

            // Add to document head
            document.head.appendChild(link);
        });
    }    /**
     * Unload CSS file
     * 
     * @param {string} cssPath - Path to the CSS file
     */
    unloadCSS(cssPath) {
        const link = document.querySelector(`link[href="${cssPath}"]`);
        if (link) {
            link.remove();
        }
    }    /**
     * Auto-load CSS for component based on naming convention
     * Looks for CSS files in: styles/components/{component-name}.css
     * 
     * @private
     * @returns {Promise<void>}
     */
    async autoLoadCSS() {
        if (!this.name || typeof window === 'undefined') return;
        
        // Generate CSS filename from component name
        const cssFileName = this.name.toLowerCase()
            .replace(/component$/, '') // Remove 'component' suffix if present
            .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
        
        // Add 'component' suffix back for CSS file naming convention
        const fullCssName = cssFileName ? `${cssFileName}-component` : this.name.toLowerCase();
        
        const cssPaths = [
            `styles/components/${fullCssName}.css`,     // For built version (primary)
            `src/styles/components/${fullCssName}.css`, // For development
            `styles/components/${this.name.toLowerCase()}.css`, // Fallback with exact name
            `src/styles/components/${this.name.toLowerCase()}.css` // Fallback development
        ];
        
        for (const cssPath of cssPaths) {
            try {
                await this.loadCSS(cssPath);
                this.logger.debug(`Auto-loaded CSS: ${cssPath}`);
                break; // Stop after first successful load
            } catch (error) {
                // Continue to next path - this is expected behavior
                continue;
            }
        }
    }

    // ===========================
    // Composition API
    // ===========================

    /**
     * Declare a child component inside a getTemplate() call.
     *
     * Returns a placeholder string that the DOM morph treats as an opaque host
     * boundary. After the morph, reconcileChildren() mounts / updates / removes
     * real child instances to match what the template declared.
     *
     * @param {Function|string} componentClassOrName - Component class or registered name
     * @param {Object} [props={}] - Props to pass to the child
     * @param {string|number|null} [key=null] - Stable key for keyed reconciliation
     * @returns {string} Host placeholder HTML string
     *
     * @example
     * getTemplate() {
     *   return `
     *     <ul>
     *       ${this.state.items.map(item =>
     *         this.child(ItemRow, { item }, item.id)
     *       ).join('')}
     *     </ul>`;
     * }
     */
    child(componentClassOrName, props = {}, key = null) {
        let ComponentClass = componentClassOrName;

        if (typeof componentClassOrName === 'string') {
            ComponentClass = this._resolveComponent
                ? this._resolveComponent(componentClassOrName)
                : null;
            if (!ComponentClass) {
                this.logger.warn(`child(): component not registered: "${componentClassOrName}"`);
                return '';
            }
        }

        const index = this._childIndex++;
        const resolvedKey = key != null ? String(key) : `__vf_${index}`;

        this._childSpecs.push({ ComponentClass, props, key: resolvedKey });

        return `<div data-vf-host="${index}" data-key="${resolvedKey}"></div>`;
    }

    /**
     * Mount, update, or unmount child components after a render.
     * Called automatically by render() — do not call this manually.
     * @private
     */
    async reconcileChildren() {
        if (this._childSpecs.length === 0 && this._children.size === 0) return;

        const hostEls = Array.from(this.element.querySelectorAll('[data-vf-host]'));
        const usedKeys = new Set();

        for (let i = 0; i < this._childSpecs.length; i++) {
            const spec = this._childSpecs[i];
            const hostEl = hostEls[i];
            if (!hostEl) continue;

            usedKeys.add(spec.key);

            if (this._children.has(spec.key)) {
                // Existing child: update props (re-renders only if they changed).
                const child = this._children.get(spec.key);
                // Re-attach the wrapper to the host in case morph moved the host.
                if (child.element && child.element.parentElement !== hostEl) {
                    hostEl.innerHTML = '';
                    hostEl.appendChild(child.element);
                }
                await child.updateProps(spec.props);
            } else {
                // New child: instantiate, wire, and mount.
                const child = new spec.ComponentClass(this.eventBus, spec.props);
                child.container = hostEl;
                // Propagate app reference and component resolver down the tree.
                child.app = this.app;
                child._resolveComponent = this._resolveComponent;
                await child.init();
                if (typeof child.getLifecycle === 'function') {
                    const lc = child.getLifecycle();
                    if (lc && typeof lc.onMount === 'function') await lc.onMount.call(child);
                }
                this._children.set(spec.key, child);
            }
        }

        // Destroy children whose host was removed from the template.
        for (const [key, child] of this._children) {
            if (!usedKeys.has(key)) {
                try {
                    if (typeof child.getLifecycle === 'function') {
                        const lc = child.getLifecycle();
                        if (lc && typeof lc.onUnmount === 'function') await lc.onUnmount.call(child);
                    }
                    child.destroy();
                } catch (err) {
                    this.logger.warn('Error destroying removed child', { key, err });
                }
                this._children.delete(key);
            }
        }
    }

    // ===========================
    // Plugin service access
    // ===========================

    /**
     * Look up a plugin service registered with app.provide().
     * Returns null when the app reference is not set or the service is absent
     * (so templates can safely fall back: `this.service('icons')?.render(...) ?? ''`).
     *
     * @param {string} name - Service name (e.g. 'icons', 'theme', 'alerts')
     * @returns {*|null} Service instance or null
     */
    service(name) {
        return this.app ? this.app.get(name) : null;
    }

    /**
     * Render an inline SVG icon from the built-in icons service.
     * Returns an empty string if the icons plugin is not installed, so templates
     * degrade gracefully without needing null checks everywhere.
     *
     * @param {string} name - Icon name (e.g. 'check', 'trash', 'menu')
     * @param {Object} [opts={}] - Options forwarded to IconsService.render()
     * @returns {string} Inline SVG string, or '' if icons service is unavailable
     */
    icon(name, opts = {}) {
        const icons = this.service('icons');
        return icons ? icons.render(name, opts) : '';
    }

    // ===========================
    // Lifecycle Hooks (Override in subclasses)
    // ===========================

    /**
     * Component-specific initialization
     * Override in subclasses for custom initialization logic
     * 
     * @returns {Promise<void>}
     */
    async onInit() {
        // Override in subclasses
    }

    /**
     * Component-specific post-render setup
     * Override in subclasses for post-render logic
     * 
     * @returns {Promise<void>}
     */
    async onRender() {
        // Override in subclasses
    }

    /**
     * Component-specific cleanup
     * Override in subclasses for custom cleanup logic
     */
    onDestroy() {
        // Override in subclasses
    }    /**
     * Generate component HTML
     * MUST be implemented in subclasses
     * 
     * @returns {Promise<string>} Component HTML string
     */
    async getHTML() {
        // Check if component has getTemplate method (new architecture)
        if (typeof this.getTemplate === 'function') {
            return this.getTemplate();
        }
        throw new Error('getHTML() or getTemplate() must be implemented in component subclass');
    }

    /**
     * Validate component properties
     * Override in subclasses for custom validation
     * 
     * @returns {Promise<void>}
     */
    async validateProps() {
        // Override in subclasses for prop validation
    }

    // ===========================
    // Private Methods
    // ===========================

    /**
     * Setup component-specific event listeners
     * Override in subclasses for one-time, non-delegated setup.
     * @private
     */
    setupEventListeners() {
        // Override in subclasses
    }

    /**
     * Bind delegated DOM listeners once to the stable wrapper element.
     *
     * Because the wrapper survives every morph, these listeners are attached a
     * single time and never need rebinding. Each event type maps to exactly one
     * declarative attribute so a given interaction fires once:
     *
     *   data-action  -> click   (buttons, links, anything clickable)
     *   data-change  -> change  (checkboxes, radios, selects)
     *   data-input   -> input   (text inputs, textareas)
     *   data-keydown -> keydown
     *   data-submit  -> submit  (forms)
     *
     * The named method is looked up on getMethods() at dispatch time and called
     * with (event, matchedElement).
     * @private
     */
    bindEventDelegation() {
        if (this._delegationBound || !this.element) return;

        const map = [
            ['click', 'data-action', true],
            ['change', 'data-change', false],
            ['input', 'data-input', false],
            ['keydown', 'data-keydown', false],
            ['submit', 'data-submit', true],
        ];

        for (const [eventType, attr, preventDefault] of map) {
            const handler = (event) => this.dispatchDelegated(event, attr, preventDefault);
            this.element.addEventListener(eventType, handler);
            this._delegatedListeners.push({ eventType, handler });
        }

        this._delegationBound = true;
        this.logger.debug('Event delegation bound');
    }

    /**
     * Resolve and invoke the method named by a delegated attribute.
     * @private
     */
    dispatchDelegated(event, attr, preventDefault) {
        const target = event.target.closest(`[${attr}]`);
        if (!target || !this.element.contains(target)) return;

        // If the event originated inside a child component's host element, that
        // child's own delegation listener handles it. Don't double-dispatch.
        const host = event.target.closest('[data-vf-host]');
        if (host && this.element.contains(host)) return;

        const action = target.getAttribute(attr);
        const methods = (typeof this.getMethods === 'function') ? this.getMethods() : {};

        if (action && typeof methods[action] === 'function') {
            if (preventDefault) event.preventDefault();
            try {
                methods[action].call(this, event, target);
                this.logger.debug(`Action executed: ${action} (${attr})`);
            } catch (error) {
                this.handleError(error, `Failed to execute action: ${action}`);
            }
        }
    }

    /**
     * Handle component errors
     * @private
     */
    handleError(error, context = 'Component error') {
        this.logger.error(context, error);
        this.errorHandler.handleError(error, {
            component: this.name,
            context,
            state: this.state,
            props: this.props
        });
    }

    /**
     * Clean up event listeners and subscriptions
     * @private
     */
    cleanup() {
        // Tear down child components first so their listeners and subtrees are
        // destroyed before we remove our own wrapper from the DOM.
        for (const child of this._children.values()) {
            try {
                if (typeof child.getLifecycle === 'function') {
                    const lc = child.getLifecycle();
                    if (lc && typeof lc.onUnmount === 'function') lc.onUnmount.call(child);
                }
                child.destroy();
            } catch (err) {
                this.logger.warn('Error destroying child component during cleanup', { err });
            }
        }
        this._children.clear();

        // Clean up DOM event listeners
        for (const [key, listener] of this.eventListeners) {
            try {
                listener.element.removeEventListener(
                    listener.event,
                    listener.handler,
                    listener.options
                );
            } catch (error) {
                this.logger.warn('Failed to remove event listener', { key, error });
            }
        }
        this.eventListeners.clear();

        // Clean up delegated listeners attached to the wrapper element
        if (this.element) {
            for (const { eventType, handler } of this._delegatedListeners) {
                this.element.removeEventListener(eventType, handler);
            }
        }
        this._delegatedListeners = [];
        this._delegationBound = false;

        // Clean up EventBus subscriptions
        for (const subscription of this.eventBusSubscriptions) {
            try {
                subscription.unsubscribe();
            } catch (error) {
                this.logger.warn('Failed to unsubscribe from event', {
                    eventName: subscription.eventName,
                    error
                });
            }
        }
        this.eventBusSubscriptions = [];

        // Destroy signals so pending renders and subscriber refs are released.
        for (const sig of this._signals) sig._destroy();
        this._signals = [];
        this._signalRenderPending = false;
    }}
