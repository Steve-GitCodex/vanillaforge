/**
 * VanillaForge — TypeScript declarations.
 *
 * These types cover the full public API exported from `vanillaforge`
 * (src/framework.js). Import them the same way you import the runtime:
 *
 *   import { createApp, BaseComponent, iconsPlugin } from 'vanillaforge';
 *
 * For plain JavaScript projects, add to jsconfig.json:
 *   { "compilerOptions": { "checkJs": true } }
 * and the types will be picked up automatically via the package's
 * "types" export condition.
 */

// ---------------------------------------------------------------------------
// HTML escaping utilities
// ---------------------------------------------------------------------------

/**
 * Wraps a trusted HTML string so the `html` tagged template passes it through
 * without escaping. Returned by `raw()`, `icon()`, and `child()`.
 * Its `toString()` returns the raw string, so it is safe to use in plain
 * template literals too.
 */
export declare class RawHtml {
  constructor(value: unknown);
  toString(): string;
}

/**
 * Escape a value for safe insertion into HTML text or attribute values.
 * Escapes `& < > " '`.  Returns an empty string for null/undefined.
 */
export declare function escapeHtml(value: unknown): string;

/**
 * Mark a trusted HTML string so the `html` tagged template will not escape it.
 * Only use this on values you fully control (SVG strings, framework output, etc.)
 * — never on user-supplied data.
 */
export declare function raw(value: unknown): RawHtml;

/**
 * Tagged template literal that auto-escapes every interpolated value.
 * `RawHtml` instances (from `raw()`, `this.icon()`, `this.child()`) are passed
 * through unchanged.  Arrays are joined — each element is individually escaped.
 *
 * @example
 * getTemplate() {
 *   return html`<h1>${this.state.title}</h1>
 *     <button>${this.icon('check')} ${this.state.label}</button>`;
 * }
 */
export declare function html(strings: TemplateStringsArray, ...values: unknown[]): string;

// ---------------------------------------------------------------------------
// Signal — reactive primitive
// ---------------------------------------------------------------------------

/**
 * A reactive value. Reading `.value` returns the current value; calling
 * `.set(newValue)` updates it, notifies all subscribers, and (when the
 * signal was created via `this.signal()` inside a component) schedules a
 * single batched morph re-render for the next microtask.
 *
 * Multiple `.set()` calls within the same synchronous block collapse into
 * one render.
 */
export declare class Signal<T = unknown> {
  constructor(initialValue: T);

  /** The current value. */
  readonly value: T;

  /**
   * Update the value. Identical values (via Object.is) are ignored.
   * Notifies subscribers and schedules a component re-render.
   */
  set(newValue: T): void;

  /**
   * Subscribe to value changes.
   * Returns an unsubscribe function.
   */
  subscribe(fn: (value: T) => void): () => void;
}

/**
 * Create a derived signal whose value is recomputed whenever any dependency
 * signal changes. The returned signal is read-only by convention.
 *
 * Auto-cleanup: calling `_destroy()` on the returned signal (done automatically
 * by BaseComponent on teardown) unsubscribes from all dependencies.
 *
 * @example
 * this.firstName = this.signal('John');
 * this.lastName  = this.signal('Doe');
 * this.fullName  = computed(
 *   () => `${this.firstName.value} ${this.lastName.value}`,
 *   [this.firstName, this.lastName],
 * );
 */
export declare function computed<T>(fn: () => T, dependencies: Signal<any>[]): Signal<T>;

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type AnyRecord = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface RouterConfig {
  /** 'history' (default) or 'hash' */
  mode?: 'history' | 'hash';
  /** Route to redirect to when no match is found. Default: '/404'. */
  fallback?: string;
  /** URL prefix for all routes (e.g. '/vanillaforge' on GitHub Pages). */
  basePath?: string;
}

export interface LoggingConfig {
  level?: 'debug' | 'info' | 'warn' | 'error';
  console?: boolean;
}

export interface AppConfig {
  appName?: string;
  debug?: boolean;
  /** DOM id that route components are mounted into. Default: 'main-content'. */
  mountId?: string;
  router?: RouterConfig;
  logging?: LoggingConfig;
}

export interface InitOptions {
  /** Map of URL path → component class or route config for client-side routing. */
  routes?: Record<string, ComponentClass | RouteConfig>;
  /** Named component registry (for lookup by string in child()). */
  components?: Record<string, ComponentClass>;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export interface Plugin {
  name: string;
  install(app: FrameworkApp, options?: AnyRecord): void;
}

export type PluginFunction = (app: FrameworkApp, options?: AnyRecord) => void;

// ---------------------------------------------------------------------------
// EventBus
// ---------------------------------------------------------------------------

export declare class EventBus {
  /**
   * Subscribe to an event. Returns an unsubscribe function.
   * @param priority Higher numbers run first. Default: 0.
   */
  on(event: string, handler: (data: unknown) => void, priority?: number): () => void;
  /** Subscribe once — auto-unsubscribes after the first delivery. */
  once(event: string, handler: (data: unknown) => void): () => void;
  emit(event: string, data?: unknown): void;
  off(event: string, handler: (data: unknown) => void): void;
  cleanup(): void;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

/**
 * Context object passed to a route loader function.
 */
export interface RouteLoaderContext {
  /** Dynamic segments captured from the URL (e.g. `{ id: '42' }` for `/users/:id`). */
  params: Record<string, string>;
  /** The matched URL path (without base path). */
  path: string;
}

/**
 * Async function that fetches data before a route component mounts.
 * Its return value is available as `this.props.data` inside the component.
 */
export type RouteLoader = (context: RouteLoaderContext) => Promise<unknown>;

/**
 * Full route configuration object accepted by `Router.addRoute()`.
 * Pass a plain `ComponentClass` as a shorthand when no extra options are needed.
 */
export interface RouteConfig {
  component: ComponentClass;
  /**
   * Called before the component mounts. Its return value is available as
   * `this.props.data` on the first render. When the loader throws, the
   * component still mounts with `props.data` set to `undefined`.
   */
  loader?: RouteLoader;
  title?: string;
  protected?: boolean;
  beforeEnter?: (route: RouteMatch, path: string) => boolean | Promise<boolean>;
  afterEnter?: (route: RouteMatch, path: string) => void | Promise<void>;
}

export declare class Router {
  addRoute(path: string, component: ComponentClass | RouteConfig): void;
  navigate(path: string, options?: AnyRecord): void;
  beforeNavigation(callback: (route: RouteMatch, path: string) => boolean | Promise<boolean>): void;
  afterNavigation(callback: (route: RouteMatch, path: string) => void | Promise<void>): void;
  initialize(): Promise<void>;
  start(): Promise<void>;
  cleanup(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type ComponentClass = new (
  eventBus: EventBus,
  props?: AnyRecord
) => BaseComponent;

export interface ComponentLifecycle {
  onMount?: () => void | Promise<void>;
  onUnmount?: () => void | Promise<void>;
}

export declare class BaseComponent {
  /** Component name — used in logging and as the CSS class on the wrapper. */
  name: string;
  props: AnyRecord;
  state: AnyRecord;
  /** The outermost DOM wrapper managed by the framework. */
  element: Element | null;
  container: Element | null;
  eventBus: EventBus;
  /** The FrameworkApp instance. Set by ComponentManager on mount. */
  app: FrameworkApp | null;
  isInitialized: boolean;
  isRendered: boolean;
  isDestroyed: boolean;

  constructor(eventBus: EventBus, props?: AnyRecord);

  /**
   * Return an HTML string. Called on every render. Use `this.child()` inside
   * it to embed child components declaratively.
   */
  getTemplate(): string;

  /**
   * Return a map of action name → handler function. Handlers are wired to DOM
   * elements via data-action / data-change / data-input / data-keydown /
   * data-submit attributes — no manual addEventListener needed.
   */
  getMethods(): Record<string, (event?: Event) => void | Promise<void>>;

  /** Override to register mount/unmount hooks. */
  getLifecycle(): ComponentLifecycle;

  /** Hook called once during init, before the first render. */
  onInit(): Promise<void>;

  /**
   * Merge `patch` into state and re-render via DOM morph.
   * Pass `render = false` to update state silently (no re-render).
   */
  setState(patch: Partial<AnyRecord>, render?: boolean): void;

  /**
   * Reach a plugin service by name. Returns null when the service is absent
   * so templates degrade gracefully without needing explicit null checks.
   */
  service<T = unknown>(name: string): T | null;

  /**
   * Render an inline SVG icon by name. Shortcut for
   * `this.service('icons').render(name, options)`.
   * Returns an empty string when the icons service is absent.
   */
  icon(name: string, options?: IconOptions): string;

  /**
   * Embed a child component at the current position in getTemplate().
   * Returns a placeholder `<div data-vf-host>` that the framework replaces
   * with the mounted child after each render.
   *
   * @param Component - Class or registered name string.
   * @param props     - Props passed to the child on mount / update.
   * @param key       - Stable identity key for list reconciliation.
   */
  child(
    Component: ComponentClass | string,
    props?: AnyRecord,
    key?: string | number
  ): string;

  /**
   * Create a reactive signal linked to this component. When
   * `signal.set(newValue)` is called, the component re-renders via the DOM
   * morph (multiple calls in the same tick are batched into one render).
   * The signal is automatically destroyed when the component is destroyed.
   */
  signal<T>(initialValue: T): Signal<T>;

  /** Emit an event on the shared EventBus. */
  emit(event: string, data?: unknown): void;

  /** Subscribe to an EventBus event. Returns an unsubscribe function. */
  on(event: string, handler: (data: unknown) => void): () => void;

  init(): Promise<void>;
  render(container: Element): void;
  cleanup(): Promise<void>;
}

// ---------------------------------------------------------------------------
// FrameworkApp
// ---------------------------------------------------------------------------

export declare class FrameworkApp {
  config: AppConfig;
  router: Router | null;
  eventBus: EventBus;
  isInitialized: boolean;

  /**
   * Install a plugin. Idempotent — installing the same plugin (by name or
   * reference) a second time is a no-op. Chainable.
   */
  use(plugin: Plugin | PluginFunction, options?: AnyRecord): this;

  /**
   * Register (or replace) a named service in the registry. Call this from a
   * plugin's install() or from app-level setup code.
   */
  provide(name: string, instance: unknown): this;

  /**
   * Retrieve a service by name. Returns null when not found.
   * Common names: 'icons', 'theme', 'alerts', 'fonts', 'store', 'router', 'eventBus'.
   */
  get<T = unknown>(name: string): T | null;

  navigate(path: string, options?: AnyRecord): void;

  initialize(options?: InitOptions): Promise<void>;
  start(): Promise<void>;
  shutdown(): Promise<void>;
}

export declare function createApp(config?: AppConfig): FrameworkApp;

// ---------------------------------------------------------------------------
// Icons plugin
// ---------------------------------------------------------------------------

export interface IconOptions {
  /** Width and height in pixels. Default: 24. */
  size?: number;
  /** Extra CSS class on the <svg> element. */
  className?: string;
  /** Adds a <title> and role="img" for accessibility. */
  title?: string;
  /** Inline color override. Default: inherits currentColor. */
  color?: string;
}

export declare class IconsService {
  /** Render an icon as an inline SVG string. Returns '' for unknown names. */
  render(name: string, options?: IconOptions): string;
  /** Register a custom icon SVG path string under `name`. */
  register(name: string, svgPath: string): void;
  /** Returns all registered icon names. */
  list(): string[];
}

export declare const iconsPlugin: Plugin;

// ---------------------------------------------------------------------------
// Theme plugin
// ---------------------------------------------------------------------------

/**
 * Design token map. Keys are camelCase (e.g. 'primary', 'textMuted', 'fontSans').
 * They are injected as --vf-<kebab-case> CSS custom properties on :root.
 */
export interface ThemeTokens {
  primary?: string;
  primaryDark?: string;
  secondary?: string;
  surface?: string;
  background?: string;
  text?: string;
  textMuted?: string;
  border?: string;
  danger?: string;
  success?: string;
  warning?: string;
  radius?: string;
  radiusSm?: string;
  radiusLg?: string;
  fontSans?: string;
  fontMono?: string;
  shadowSm?: string;
  shadowMd?: string;
  shadowLg?: string;
  space?: string;
  [key: string]: string | undefined;
}

export declare class ThemeService {
  /** Live-update one or more design tokens. Changes are applied immediately to :root. */
  setTokens(tokens: Partial<ThemeTokens>): void;
  /** Read a token value by its camelCase name (e.g. 'primary', 'fontSans'). */
  getToken(name: string): string | undefined;
}

export interface ThemePluginOptions {
  /** Token overrides applied on top of the 20 defaults. */
  tokens?: Partial<ThemeTokens>;
  /** Set to false to skip the base stylesheet (.vf-card, .vf-btn, etc.). Default: true. */
  base?: boolean;
}

export declare const themePlugin: Plugin;

// ---------------------------------------------------------------------------
// Alerts plugin
// ---------------------------------------------------------------------------

export interface ToastOptions {
  /** How long (ms) before the toast auto-dismisses. */
  duration?: number;
}

export interface ConfirmOptions {
  /** Optional heading displayed above the message. */
  title?: string;
  /** Styles the confirm button as destructive (red). Default: false. */
  danger?: boolean;
  /** Confirm button label. Default: 'Confirm'. */
  confirmText?: string;
  /** Cancel button label. Default: 'Cancel'. */
  cancelText?: string;
  /** Called when the user confirms (in addition to the returned Promise). */
  onConfirm?: () => void;
  /** Called when the user cancels. */
  onCancel?: () => void;
}

export declare class AlertsService {
  success(message: string, options?: ToastOptions): void;
  error(message: string, options?: ToastOptions): void;
  warning(message: string, options?: ToastOptions): void;
  info(message: string, options?: ToastOptions): void;
  /** Shows a modal confirm dialog. Resolves true on confirm, false on cancel. */
  confirm(message: string, options?: ConfirmOptions): Promise<boolean>;
}

export declare const alertsPlugin: Plugin;

// ---------------------------------------------------------------------------
// Fonts plugin
// ---------------------------------------------------------------------------

export interface FontDescriptor {
  /** Must match a bundled family name or one registered with addFamily(). */
  name: string;
  /**
   * Weight subset. For variable fonts this sets the min/max of the
   * font-weight range (e.g. [400, 700] → font-weight: 400 700).
   */
  weights?: number[];
  styles?: ('normal' | 'italic')[];
}

export interface FontManifest {
  /** CSS font-family name used in @font-face declarations. */
  cssFamily: string;
  /** camelCase ThemeService token to update (e.g. 'fontSans'). */
  themeToken?: string;
  /** Fallback font stack appended when setting the theme token. */
  fallback: string;
  /** True when a single file covers all weights (variable font). */
  variable: boolean;
  weights: number[];
  styles: string[];
  /**
   * Returns the bundled base64 data URI for a given style, or null to fall
   * back to a URL-path source (requires the path option at install time).
   */
  dataUri?: (style: string) => string | null;
  /** Returns the filename for a given weight and style. */
  filename: (weight: number | null, style: string) => string;
}

export interface FontsPluginOptions {
  /** Font families to load. Each entry is a name string or a descriptor object. */
  families?: (string | FontDescriptor)[];
  /**
   * URL base for external font files (e.g. '/assets/fonts').
   * When omitted, bundled data URIs are used for built-in families.
   */
  path?: string;
  /** CSS font-display value. Default: 'swap'. */
  display?: string;
}

export declare class FontsService {
  constructor(options?: FontsPluginOptions);
  /** Returns CSS family names of all fonts that have been loaded. */
  getFamilies(): string[];
  /**
   * Register a custom font family and inject its @font-face block.
   * Returns this for chaining.
   */
  addFamily(name: string, manifest: FontManifest): this;
}

export declare const fontsPlugin: Plugin;

// ---------------------------------------------------------------------------
// Store plugin
// ---------------------------------------------------------------------------

export declare class StoreService {
  /**
   * Write a value. Identical values (via Object.is) are ignored — no events fired.
   */
  set(key: string, value: unknown): void;

  /**
   * Read the current value. Returns `undefined` when the key has never been written.
   */
  get(key: string): unknown;

  /**
   * Subscribe to changes for a single key.
   * The handler receives `(value, prev)` on each change.
   * Returns an unsubscribe function.
   */
  subscribe(key: string, handler: (value: unknown, prev: unknown) => void): () => void;

  /**
   * Subscribe to ALL store changes.
   * The handler receives `(key, value, prev)` on each write.
   * Returns an unsubscribe function.
   */
  subscribeAll(handler: (key: string, value: unknown, prev: unknown) => void): () => void;

  /**
   * Remove a key and fire change events with `value: undefined`.
   * No-op when the key does not exist.
   */
  delete(key: string): void;

  /** Returns all keys currently stored. */
  keys(): string[];
}

export declare const storePlugin: Plugin;

// ---------------------------------------------------------------------------
// HTTP plugin
// ---------------------------------------------------------------------------

export interface HttpInterceptor {
  /**
   * Runs before fetch(). May mutate and return the RequestInit object.
   * Use this to inject auth headers, sign requests, etc.
   */
  request?: (init: RequestInit & { headers: Record<string, string> }) => RequestInit | Promise<RequestInit>;

  /**
   * Runs after a successful (2xx) fetch. May return a replacement Response.
   * Use this to unwrap envelopes or log responses.
   */
  response?: (response: Response) => Response | Promise<Response>;

  /**
   * Runs on non-2xx responses and network errors.
   * Use this to show a global error toast or refresh a token.
   */
  error?: (err: HttpError | Error) => void | Promise<void>;
}

export interface HttpError extends Error {
  status: number;
  statusText: string;
  /** Parsed JSON body, raw text, or null when the body could not be read. */
  body: unknown;
}

export interface RequestOptions extends Omit<RequestInit, 'headers' | 'method' | 'body'> {
  /** Per-request headers merged on top of the service defaults. */
  headers?: Record<string, string>;
  /** When true, the raw Response object is returned instead of parsed data. */
  raw?: boolean;
}

export declare class HttpService {
  constructor(baseURL?: string, defaultHeaders?: Record<string, string>, interceptors?: HttpInterceptor[]);

  get(url: string, options?: RequestOptions): Promise<unknown>;
  post(url: string, body?: unknown, options?: RequestOptions): Promise<unknown>;
  put(url: string, body?: unknown, options?: RequestOptions): Promise<unknown>;
  patch(url: string, body?: unknown, options?: RequestOptions): Promise<unknown>;
  delete(url: string, options?: RequestOptions): Promise<unknown>;

  /** Set (or overwrite) a default header sent with every request. */
  setHeader(name: string, value: string): void;
  /** Remove a default header. */
  removeHeader(name: string): void;

  /** Register an interceptor. Returns `this` for chaining. */
  addInterceptor(interceptor: HttpInterceptor): this;
}

export interface HttpPluginOptions {
  /** Prepended to all relative URLs. Default: ''. */
  baseURL?: string;
  /** Default headers sent with every request. Default: {}. */
  headers?: Record<string, string>;
  /** Initial interceptors. Default: []. */
  interceptors?: HttpInterceptor[];
}

export declare const httpPlugin: Plugin;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export declare const FRAMEWORK_VERSION: string;
export declare const FRAMEWORK_NAME: string;
