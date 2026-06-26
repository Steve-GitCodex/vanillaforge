import { describe, it, expect, beforeEach } from 'vitest';
import { Notification } from '../src/utils/notification.js';

describe('Notification.showModal — XSS hardening', () => {
  let notif;

  beforeEach(() => {
    notif = new Notification();
    // Clean up any modals left behind by previous tests.
    document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
  });

  it('escapes < > in title', () => {
    notif.showModal('<img onerror="xss()">', 'msg');
    const h3 = document.querySelector('.modal h3');
    expect(h3.innerHTML).not.toContain('<img');
    expect(h3.textContent).toBe('<img onerror="xss()">');
  });

  it('escapes < > in message', () => {
    notif.showModal('title', '<script>evil()</script>');
    const p = document.querySelector('.modal-body p');
    expect(p.innerHTML).not.toContain('<script>');
    expect(p.textContent).toBe('<script>evil()</script>');
  });

  it('escapes < > in details', () => {
    notif.showModal('t', 'm', { details: '<img src=x onerror=alert(1)>' });
    const pre = document.querySelector('.modal-body pre');
    expect(pre.innerHTML).not.toContain('<img');
    expect(pre.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('escapes button labels', () => {
    notif.showModal('t', 'm', {
      buttons: [{ label: '<evil>', action: 'close' }]
    });
    const btn = document.querySelector('.modal-footer button');
    expect(btn.innerHTML).not.toContain('<evil>');
    expect(btn.textContent).toBe('<evil>');
  });

  it('sanitises button action used as CSS class', () => {
    // A crafted action must not break the querySelector.
    expect(() => {
      notif.showModal('t', 'm', {
        buttons: [{ label: 'Go', action: 'close"><script>' }]
      });
    }).not.toThrow();
  });

  it('showToast uses textContent (already safe — regression guard)', () => {
    notif.showToast('<b>xss</b>', 'info');
    const toast = document.querySelector('.toast');
    expect(toast.textContent).toBe('<b>xss</b>');
    // No actual <b> element should have been created.
    expect(toast.querySelector('b')).toBeNull();
  });
});
