/**
 * Tests for the built-in alerts plugin.
 *
 * Covers: AlertsService toasts (creation, type classes, auto-dismiss, close button,
 * maxToasts trimming, backward-compat showToast), confirm dialogs (Promise
 * resolution, onConfirm/onCancel callbacks, backdrop click, DOM cleanup,
 * backward-compat showModal), and alertsPlugin integration (registration,
 * ErrorHandler wiring, options pass-through).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlertsService, alertsPlugin } from '../src/plugins/alerts/alerts-plugin.js';
import { createApp } from '../src/framework.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService(opts = {}) {
  return new AlertsService({ duration: 4000, ...opts });
}

function cleanup() {
  document.getElementById('vf-alerts-toasts')?.remove();
  document.getElementById('vf-alerts-styles')?.remove();
  document.querySelectorAll('.vf-dialog-overlay').forEach((el) => el.remove());
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

describe('AlertsService — toasts', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); cleanup(); });

  it('creates #vf-alerts-toasts container on first toast', () => {
    makeService().success('hello');
    expect(document.getElementById('vf-alerts-toasts')).toBeTruthy();
  });

  it('injects <style id="vf-alerts-styles"> into head on first use', () => {
    makeService().info('test');
    expect(document.getElementById('vf-alerts-styles')).toBeTruthy();
  });

  it('does not inject duplicate style elements on repeated toasts', () => {
    const svc = makeService();
    svc.success('a'); svc.error('b');
    expect(document.querySelectorAll('#vf-alerts-styles').length).toBe(1);
  });

  it('adds a toast with the correct type class — success', () => {
    makeService().success('ok');
    expect(document.querySelector('.vf-toast-success')).toBeTruthy();
  });

  it('adds a toast with the correct type class — error', () => {
    makeService().error('bad');
    expect(document.querySelector('.vf-toast-error')).toBeTruthy();
  });

  it('adds a toast with the correct type class — warning', () => {
    makeService().warning('careful');
    expect(document.querySelector('.vf-toast-warning')).toBeTruthy();
  });

  it('adds a toast with the correct type class — info', () => {
    makeService().info('fyi');
    expect(document.querySelector('.vf-toast-info')).toBeTruthy();
  });

  it('renders the message text inside the toast body', () => {
    makeService().error('Something failed');
    expect(document.querySelector('.vf-toast-body').textContent).toContain('Something failed');
  });

  it('auto-removes the toast after the configured duration', () => {
    makeService({ duration: 1000 }).warning('watch out');
    expect(document.querySelector('.vf-toast')).toBeTruthy();
    vi.advanceTimersByTime(1001);
    expect(document.querySelector('.vf-toast')).toBeNull();
  });

  it('close button removes the toast immediately', () => {
    makeService().info('closeable');
    document.querySelector('.vf-toast-close').click();
    expect(document.querySelector('.vf-toast')).toBeNull();
  });

  it('trims the oldest toast when maxToasts is exceeded', () => {
    const svc = makeService({ maxToasts: 2 });
    const t1 = svc.success('first');
    const t2 = svc.success('second');
    const t3 = svc.success('third');
    const container = document.getElementById('vf-alerts-toasts');
    expect(container.children.length).toBe(2);
    expect(t1.parentNode).toBeNull();
    expect(t2.parentNode).toBe(container);
    expect(t3.parentNode).toBe(container);
  });

  it('showToast() backward-compat creates a toast with the right type class', () => {
    makeService().showToast('legacy error', 'error');
    expect(document.querySelector('.vf-toast-error')).toBeTruthy();
    expect(document.querySelector('.vf-toast-body').textContent).toContain('legacy error');
  });
});

// ---------------------------------------------------------------------------
// Confirm dialog
// ---------------------------------------------------------------------------

describe('AlertsService — confirm dialog', () => {
  afterEach(cleanup);

  it('confirm() returns a Promise', () => {
    const p = makeService().confirm('Sure?');
    expect(p).toBeInstanceOf(Promise);
    // Clean up the open overlay so it doesn't leak into the next test.
    document.querySelector('.vf-dialog-overlay')?.remove();
  });

  it('clicking Confirm resolves the Promise with true', async () => {
    const p = makeService().confirm('Delete?');
    document.querySelector('.vf-dialog-confirm').click();
    expect(await p).toBe(true);
  });

  it('clicking Cancel resolves the Promise with false', async () => {
    const p = makeService().confirm('Delete?');
    document.querySelector('.vf-dialog-cancel').click();
    expect(await p).toBe(false);
  });

  it('backdrop click resolves the Promise with false', async () => {
    const p = makeService().confirm('Proceed?');
    document.querySelector('.vf-dialog-overlay').click();
    expect(await p).toBe(false);
  });

  it('dialog is removed from the DOM after confirmation', async () => {
    const p = makeService().confirm('Sure?');
    document.querySelector('.vf-dialog-confirm').click();
    await p;
    expect(document.querySelector('.vf-dialog-overlay')).toBeNull();
  });

  it('dialog is removed from the DOM after cancellation', async () => {
    const p = makeService().confirm('Sure?');
    document.querySelector('.vf-dialog-cancel').click();
    await p;
    expect(document.querySelector('.vf-dialog-overlay')).toBeNull();
  });

  it('calls opts.onConfirm when the user confirms', async () => {
    const cb = vi.fn();
    const p = makeService().confirm('Proceed?', { onConfirm: cb });
    document.querySelector('.vf-dialog-confirm').click();
    await p;
    expect(cb).toHaveBeenCalledOnce();
  });

  it('does not call opts.onConfirm when the user cancels', async () => {
    const cb = vi.fn();
    const p = makeService().confirm('Proceed?', { onConfirm: cb });
    document.querySelector('.vf-dialog-cancel').click();
    await p;
    expect(cb).not.toHaveBeenCalled();
  });

  it('calls opts.onCancel when the user cancels', async () => {
    const cb = vi.fn();
    const p = makeService().confirm('Proceed?', { onCancel: cb });
    document.querySelector('.vf-dialog-cancel').click();
    await p;
    expect(cb).toHaveBeenCalledOnce();
  });

  it('renders the optional title heading', () => {
    const p = makeService().confirm('Are you sure?', { title: 'Confirm deletion' });
    expect(document.querySelector('.vf-dialog-title').textContent).toContain('Confirm deletion');
    document.querySelector('.vf-dialog-overlay')?.remove();
  });

  it('uses danger class on confirm button when opts.danger is true', () => {
    const p = makeService().confirm('Delete forever?', { danger: true });
    expect(document.querySelector('.vf-dialog-confirm').classList.contains('vf-btn-danger')).toBe(true);
    document.querySelector('.vf-dialog-overlay')?.remove();
  });

  it('showModal() backward-compat renders title and message in a dialog', () => {
    makeService().showModal('Error', 'Something broke');
    expect(document.querySelector('.vf-dialog-title').textContent).toContain('Error');
    expect(document.querySelector('.vf-dialog-message').textContent).toContain('Something broke');
  });

  it('showModal() close button removes the dialog', () => {
    makeService().showModal('Error', 'Oops');
    document.querySelector('[data-action="close"]').click();
    expect(document.querySelector('.vf-dialog-overlay')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Plugin integration
// ---------------------------------------------------------------------------

describe('alertsPlugin', () => {
  afterEach(cleanup);

  it('registers AlertsService under "alerts"', () => {
    const app = createApp({ debug: false });
    app.use(alertsPlugin);
    expect(app.get('alerts')).toBeInstanceOf(AlertsService);
  });

  it('wires app.errorHandler.notification to the alerts service', () => {
    const app = createApp({ debug: false });
    app.use(alertsPlugin);
    expect(app.errorHandler.notification).toBe(app.get('alerts'));
  });

  it('passes duration and maxToasts options to the service', () => {
    const app = createApp({ debug: false });
    app.use(alertsPlugin, { duration: 999, maxToasts: 2 });
    const svc = app.get('alerts');
    expect(svc._duration).toBe(999);
    expect(svc._maxToasts).toBe(2);
  });

  it('is idempotent — second use() call is a no-op', () => {
    const app = createApp({ debug: false });
    app.use(alertsPlugin, { duration: 111 });
    app.use(alertsPlugin, { duration: 222 });
    expect(app.get('alerts')._duration).toBe(111);
  });

  it('is exported from src/framework.js', async () => {
    const { alertsPlugin: imported } = await import('../src/framework.js');
    expect(imported).toBeTruthy();
    expect(typeof imported.install).toBe('function');
  });
});
