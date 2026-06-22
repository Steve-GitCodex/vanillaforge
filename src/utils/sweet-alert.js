/**
 * SweetAlert2 Utility
 * 
 * Wrapper for SweetAlert2 to ensure it's available and provide consistent styling
 * 
 * @author VanillaForge Team
 * @version 3.0.0
 * @since 2025-06-14
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
