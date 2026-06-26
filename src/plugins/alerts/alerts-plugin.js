/**
 * VanillaForge built-in alerts plugin.
 *
 * Provides zero-dependency toasts and confirm dialogs so apps don't need
 * SweetAlert, alert(), or any other UI library for basic user feedback.
 * Folds in and replaces the old src/utils/notification.js interface so the
 * ErrorHandler automatically benefits when this plugin is installed.
 *
 * Usage:
 *   import { createApp, alertsPlugin } from './src/framework.js';
 *   const app = createApp({ ... });
 *   app.use(alertsPlugin);
 *   app.use(alertsPlugin, { duration: 3000, maxToasts: 4 });
 *
 * In any component:
 *   this.service('alerts').success('Saved!');
 *   this.service('alerts').error('Something went wrong');
 *   this.service('alerts').warning('Check your input');
 *   this.service('alerts').info('Processing...');
 *
 *   const confirmed = await this.service('alerts').confirm('Delete this item?', {
 *     title: 'Are you sure?',      // optional heading
 *     confirmText: 'Delete',       // default 'Confirm'
 *     cancelText: 'Cancel',        // default 'Cancel'
 *     danger: true,                // red confirm button
 *     onConfirm: () => { ... },    // optional callback (in addition to the Promise)
 *     onCancel:  () => { ... },    // optional callback
 *   });
 *
 * Toasts use --vf-* custom properties if the theme plugin is installed,
 * with plain-CSS fallback values so they look fine without it.
 */

import { escapeHtml } from '../../utils/html.js';

// ---------------------------------------------------------------------------
// Minimal inline SVGs for toast type indicators
// ---------------------------------------------------------------------------

const ICONS = {
  success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4,12 9,17 20,6"/></svg>',
  error:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
  info:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};

// ---------------------------------------------------------------------------
// Injected stylesheet
// ---------------------------------------------------------------------------

const ALERTS_STYLES = `
/* --- VanillaForge alerts --- */
#vf-alerts-toasts {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-width: 360px;
  width: calc(100vw - 40px);
}

.vf-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--vf-radius, 6px);
  box-shadow: var(--vf-shadow-md, 0 4px 16px rgba(0,0,0,.12));
  font-size: .9rem;
  line-height: 1.45;
  border-left: 4px solid transparent;
  animation: vf-toast-in .22s cubic-bezier(.2,.8,.3,1);
  word-break: break-word;
}

@keyframes vf-toast-in {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

.vf-toast-success { background: #f0fdf4; color: #166534; border-left-color: var(--vf-success, #10b981); }
.vf-toast-error   { background: #fef2f2; color: #991b1b; border-left-color: var(--vf-danger,  #ef4444); }
.vf-toast-warning { background: #fffbeb; color: #92400e; border-left-color: var(--vf-warning, #f59e0b); }
.vf-toast-info    { background: #eff6ff; color: #1e40af; border-left-color: var(--vf-primary, #3b82f6); }

.vf-toast-icon { flex-shrink: 0; margin-top: 1px; }
.vf-toast-body { flex: 1; }

.vf-toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  opacity: .5;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
  color: inherit;
  align-self: flex-start;
}
.vf-toast-close:hover { opacity: 1; }

/* Dialog / confirm overlay */
.vf-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: vf-fade-in .15s ease;
}

@keyframes vf-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.vf-dialog {
  background: var(--vf-surface, #fff);
  border-radius: var(--vf-radius-lg, 12px);
  box-shadow: var(--vf-shadow-lg, 0 10px 30px rgba(0,0,0,.16));
  padding: 28px;
  max-width: 400px;
  width: calc(100% - 40px);
  animation: vf-dialog-in .2s cubic-bezier(.2,.8,.3,1);
}

@keyframes vf-dialog-in {
  from { transform: scale(.92); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.vf-dialog-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--vf-text, #1f2933);
}

.vf-dialog-message {
  color: var(--vf-text-muted, #7b8794);
  font-size: .93rem;
  margin: 0 0 24px;
  line-height: 1.55;
}

.vf-dialog-details {
  margin: 0 0 20px;
  font-size: .82rem;
  color: var(--vf-text-muted, #7b8794);
}

.vf-dialog-details summary { cursor: pointer; }

.vf-dialog-details pre {
  overflow: auto;
  max-height: 180px;
  margin-top: 8px;
  padding: 8px;
  background: var(--vf-border, #e5e7eb);
  border-radius: var(--vf-radius-sm, 4px);
  white-space: pre-wrap;
  word-break: break-all;
  font-size: .8rem;
}

.vf-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
`;

// ---------------------------------------------------------------------------
// AlertsService
// ---------------------------------------------------------------------------

/**
 * Provides toasts and confirm dialogs.
 * Registered under the key 'alerts' via app.provide().
 * Also compatible with the old Notification interface (showToast / showModal)
 * so ErrorHandler picks it up automatically.
 */
export class AlertsService {
  constructor(options = {}) {
    this._duration = options.duration ?? 4000;
    this._maxToasts = options.maxToasts ?? 5;
    this._container = null;
    this._styleInjected = false;
  }

  // ---- new clean API -------------------------------------------------------

  /** Show a success toast. */
  success(message, opts = {}) { return this._toast(message, 'success', opts); }

  /** Show an error toast. */
  error(message, opts = {}) { return this._toast(message, 'error', opts); }

  /** Show a warning toast. */
  warning(message, opts = {}) { return this._toast(message, 'warning', opts); }

  /** Show an info toast. */
  info(message, opts = {}) { return this._toast(message, 'info', opts); }

  /**
   * Show a confirm dialog. Returns a Promise that resolves to true (confirm)
   * or false (cancel / backdrop click). Also calls opts.onConfirm / opts.onCancel
   * if provided.
   *
   * @param {string} message - The main question shown in the dialog body.
   * @param {Object} [opts]
   * @param {string} [opts.title]       - Optional heading above the message.
   * @param {string} [opts.confirmText] - Confirm button label (default 'Confirm').
   * @param {string} [opts.cancelText]  - Cancel button label (default 'Cancel').
   * @param {boolean} [opts.danger]     - Red confirm button (default false).
   * @param {Function} [opts.onConfirm] - Called when the user confirms.
   * @param {Function} [opts.onCancel]  - Called when the user cancels.
   * @returns {Promise<boolean>}
   */
  confirm(message, opts = {}) {
    return new Promise((resolve) => {
      this._ensureStyles();
      this._showConfirm({
        title: opts.title || '',
        message,
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        danger: opts.danger || false,
        onConfirm: opts.onConfirm,
        onCancel: opts.onCancel,
        resolve,
      });
    });
  }

  // ---- backward-compat interface (for ErrorHandler) -----------------------

  /** @deprecated Use the typed methods (success, error, …) instead. */
  showToast(message, type = 'info') {
    this._toast(message, type);
  }

  /** @deprecated Use confirm() instead. */
  showModal(title, message, options = {}) {
    this._ensureStyles();
    const buttons = options.buttons || [{ label: 'Close', action: 'close' }];
    this._showLegacyModal(title, message, options.details || null, buttons);
  }

  // ---- private ------------------------------------------------------------

  _toast(message, type, opts = {}) {
    if (typeof document === 'undefined') return null;
    this._ensureStyles();
    this._ensureContainer();

    // Enforce maxToasts by removing the oldest one first.
    while (this._container.children.length >= this._maxToasts) {
      this._container.firstElementChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = `vf-toast vf-toast-${type}`;
    toast.innerHTML = [
      `<span class="vf-toast-icon">${ICONS[type] || ''}</span>`,
      `<span class="vf-toast-body">${escapeHtml(message)}</span>`,
      `<button class="vf-toast-close" aria-label="Close">&times;</button>`,
    ].join('');

    let timer;
    const dismiss = () => {
      clearTimeout(timer);
      if (toast.parentNode) toast.remove();
    };

    toast.querySelector('.vf-toast-close').addEventListener('click', dismiss);
    timer = setTimeout(dismiss, opts.duration ?? this._duration);

    this._container.appendChild(toast);
    return toast;
  }

  _showConfirm({ title, message, confirmText, cancelText, danger, onConfirm, onCancel, resolve }) {
    const overlay = document.createElement('div');
    overlay.className = 'vf-dialog-overlay';
    overlay.innerHTML = `
      <div class="vf-dialog">
        ${title ? `<h4 class="vf-dialog-title">${escapeHtml(title)}</h4>` : ''}
        <p class="vf-dialog-message">${escapeHtml(message)}</p>
        <div class="vf-dialog-actions">
          <button class="vf-btn vf-btn-secondary vf-dialog-cancel">${escapeHtml(cancelText)}</button>
          <button class="vf-btn ${danger ? 'vf-btn-danger' : 'vf-btn-primary'} vf-dialog-confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const close = (result) => {
      overlay.remove();
      resolve(result);
      if (result && onConfirm) onConfirm();
      if (!result && onCancel) onCancel();
    };

    overlay.querySelector('.vf-dialog-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('.vf-dialog-confirm').addEventListener('click', () => close(true));
    // Backdrop click cancels.
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });

    document.body.appendChild(overlay);
    // Move focus into the dialog for keyboard accessibility.
    overlay.querySelector('.vf-dialog-confirm').focus();
  }

  _showLegacyModal(title, message, details, buttons) {
    const overlay = document.createElement('div');
    overlay.className = 'vf-dialog-overlay';

    const btnHtml = buttons.map((btn) => {
      const cls = btn.action === 'close' ? 'vf-btn-secondary' : 'vf-btn-primary';
      return `<button class="vf-btn ${cls}" data-action="${escapeHtml(String(btn.action))}">${escapeHtml(btn.label)}</button>`;
    }).join('');

    overlay.innerHTML = `
      <div class="vf-dialog">
        <h4 class="vf-dialog-title">${escapeHtml(title)}</h4>
        <p class="vf-dialog-message">${escapeHtml(message)}</p>
        ${details ? `
          <details class="vf-dialog-details">
            <summary>Technical details</summary>
            <pre>${escapeHtml(details)}</pre>
          </details>` : ''}
        <div class="vf-dialog-actions">${btnHtml}</div>
      </div>
    `;

    const close = () => overlay.remove();

    buttons.forEach((btn) => {
      const el = overlay.querySelector(`[data-action="${escapeHtml(String(btn.action))}"]`);
      if (el) {
        el.addEventListener('click', () => {
          if (btn.action !== 'close' && btn.onClick) btn.onClick();
          close();
        });
      }
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
  }

  _ensureContainer() {
    // Re-query in case the body was replaced (e.g. navigation in tests).
    if (!this._container || !document.body.contains(this._container)) {
      this._container = document.getElementById('vf-alerts-toasts');
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.id = 'vf-alerts-toasts';
        document.body.appendChild(this._container);
      }
    }
  }

  _ensureStyles() {
    if (this._styleInjected || typeof document === 'undefined') return;
    if (document.getElementById('vf-alerts-styles')) {
      this._styleInjected = true;
      return;
    }
    const style = document.createElement('style');
    style.id = 'vf-alerts-styles';
    style.textContent = ALERTS_STYLES;
    document.head.appendChild(style);
    this._styleInjected = true;
  }
}

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

/**
 * Plugin object. Install with:
 *   app.use(alertsPlugin)
 *   app.use(alertsPlugin, { duration: 3000, maxToasts: 4 })
 *
 * Options:
 *   duration  {number} - Toast auto-dismiss delay in ms (default 4000).
 *   maxToasts {number} - Maximum toasts shown at once (default 5).
 *                        Oldest toast is removed when the limit is hit.
 *
 * Side effects on install:
 *   - Registers AlertsService under 'alerts' (app.get('alerts')).
 *   - Replaces app.errorHandler.notification so framework errors use the
 *     new styled toasts/dialogs automatically.
 */
export const alertsPlugin = {
  name: 'alerts',

  install(app, options = {}) {
    const service = new AlertsService(options);
    app.provide('alerts', service);
    // Wire ErrorHandler to the new service — it expects showToast() / showModal().
    if (app.errorHandler) {
      app.errorHandler.notification = service;
    }
  },
};

// escapeHtml is imported from src/utils/html.js at the top of this file
