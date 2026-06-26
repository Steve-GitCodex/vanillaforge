/**
 * SweetAlert2 Utility
 *
 * @deprecated Use the built-in alertsPlugin instead:
 *   app.use(alertsPlugin);
 *   this.service('alerts').confirm('Are you sure?');
 * This class wraps an external SweetAlert2 dependency that is not included in
 * VanillaForge. It will be removed in v2.0.0.
 */

export class SweetAlert {
  constructor(swalInstance) {
    if (!swalInstance) {
      throw new Error('SweetAlert2 instance is required.');
    }
    this.swal = swalInstance;
  }

  fire(options) {
    const defaultOptions = {
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        content: 'swal-custom-content',
        confirmButton: 'swal-custom-confirm',
        cancelButton: 'swal-custom-cancel'
      },
      buttonsStyling: false
    };

    return this.swal.fire({
      ...defaultOptions,
      ...options
    });
  }

  success(title, text = '', options = {}) {
    return this.fire({
      icon: 'success',
      title,
      text,
      ...options
    });
  }

  error(title, text = '', options = {}) {
    return this.fire({
      icon: 'error',
      title,
      text,
      ...options
    });
  }

  warning(title, text = '', options = {}) {
    return this.fire({
      icon: 'warning',
      title,
      text,
      ...options
    });
  }

  info(title, text = '', options = {}) {
    return this.fire({
      icon: 'info',
      title,
      text,
      ...options
    });
  }

  confirm(title, text = '', options = {}) {
    return this.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      ...options
    });
  }
}
