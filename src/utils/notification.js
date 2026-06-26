/**
 * Notification Utility
 *
 * Handles displaying messages to the user, such as toasts and modals.
 */
import { escapeHtml } from './html.js';

export class Notification {
  /**
   * Show a toast notification
   *
   * @param {string} message - The message to display
   * @param {string} type - The type of toast ('error', 'warning', 'success', 'info')
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Basic styling, can be moved to a CSS file
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: #333;
      color: #fff;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      max-width: 300px;
      font-size: 14px;
      line-height: 1.4;
    `;

    switch (type) {
      case 'error':
        toast.style.background = '#fee2e2';
        toast.style.color = '#991b1b';
        toast.style.border = '1px solid #fecaca';
        break;
      case 'warning':
        toast.style.background = '#fef3cd';
        toast.style.color = '#92400e';
        toast.style.border = '1px solid #fde68a';
        break;
      case 'success':
        toast.style.background = '#dcfce7';
        toast.style.color = '#166534';
        toast.style.border = '1px solid #bbf7d0';
        break;
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  /**
   * Show a modal dialog
   *
   * @param {string} title - The title of the modal
   * @param {string} message - The message to display in the modal body
   * @param {Object} [options={}] - Options for the modal (e.g., buttons)
   */
  showModal(title, message, options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    const buttons = options.buttons || [{ label: 'Close', action: 'close' }];
    const btnHtml = buttons.map(btn => {
      // Validate action to a safe identifier before using in a selector.
      const safeAction = String(btn.action).replace(/[^a-zA-Z0-9_-]/g, '');
      return `<button class="modal-btn-${safeAction}">${escapeHtml(btn.label)}</button>`;
    }).join('');

    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>${escapeHtml(message)}</p>
          ${options.details ? `
          <details style="margin-top: 16px;">
            <summary>Technical Details</summary>
            <pre style="font-size: 12px; margin-top: 8px;">${escapeHtml(options.details)}</pre>
          </details>
          ` : ''}
        </div>
        <div class="modal-footer">
          ${btnHtml}
        </div>
      </div>
    `;

    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    modal.querySelector('.modal-close').onclick = () => modal.remove();

    if (options.buttons) {
      options.buttons.forEach(btn => {
        const safeAction = String(btn.action).replace(/[^a-zA-Z0-9_-]/g, '');
        const el = modal.querySelector(`.modal-btn-${safeAction}`);
        if (el) {
          el.onclick = () => {
            if (btn.onClick) btn.onClick();
            modal.remove();
          };
        }
      });
    } else {
      modal.querySelector('.modal-btn-close').onclick = () => modal.remove();
    }


    document.body.appendChild(modal);
  }
}