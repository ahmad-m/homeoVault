/**
 * HomeoVault - Frontend Core Application Library
 * Exposes core API Client, Validators, and UI Managers under window.core.
 */

(function () {
  'use strict';

  const core = {};

  /* =========================================================================
   * 1. THEME MANAGER
   * ========================================================================= */
  class ThemeManager {
    constructor() {
      this.currentTheme = localStorage.getItem('theme') || 'dark';
      this.applyTheme(this.currentTheme);
    }

    applyTheme(theme) {
      if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
      }
      this.currentTheme = theme;
      localStorage.setItem('theme', theme);
    }

    toggle() {
      const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      this.applyTheme(nextTheme);
    }
  }
  core.theme = new ThemeManager();

  /* =========================================================================
   * 2. LOADING MANAGER (SPINNER)
   * ========================================================================= */
  class LoadingManager {
    constructor() {
      this.spinner = null;
      this.activeRequests = 0;
    }

    show() {
      this.activeRequests++;
      if (this.spinner) return;
      
      this.spinner = document.createElement('div');
      this.spinner.id = 'core-global-spinner';
      this.spinner.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(11, 15, 25, 0.7);
        backdrop-filter: blur(2px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      this.spinner.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(this.spinner);
    }

    hide() {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      if (this.activeRequests === 0 && this.spinner) {
        this.spinner.remove();
        this.spinner = null;
      }
    }
  }
  core.loader = new LoadingManager();

  /* =========================================================================
   * 3. TOAST NOTIFICATION MANAGER
   * ========================================================================= */
  class ToastManager {
    constructor() {
      this.container = null;
    }

    _ensureContainer() {
      this.container = document.getElementById('core-toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'core-toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    }

    show(title, message, type = 'info', duration = 4000) {
      this._ensureContainer();

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      let icon = '';
      if (type === 'success') icon = '✓';
      else if (type === 'danger') icon = '✕';
      else if (type === 'warning') icon = '⚠';
      else icon = 'ℹ';

      toast.innerHTML = `
        <div class="toast-icon" style="font-weight:bold; font-size:1.2rem;">${icon}</div>
        <div class="toast-content">
          <div class="toast-title" style="font-weight:600;">${title}</div>
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
      `;

      this.container.appendChild(toast);

      toast.querySelector('.toast-close').addEventListener('click', () => this.dismiss(toast));

      if (duration > 0) {
        setTimeout(() => this.dismiss(toast), duration);
      }
    }

    success(title, message) { this.show(title, message, 'success'); }
    error(title, message) { this.show(title, message, 'danger'); }
    warn(title, message) { this.show(title, message, 'warning'); }
    info(title, message) { this.show(title, message, 'info'); }

    dismiss(toast) {
      if (toast.parentNode) {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove());
      }
    }
  }
  core.toast = new ToastManager();

  /* =========================================================================
   * 4. API CLIENT (HTTP WRAPPER)
   * ========================================================================= */
  class ApiClient {
    async request(url, options = {}, showLoader = true) {
      if (showLoader) core.loader.show();

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
          }
        });

        const data = await response.json();
        
        if (showLoader) core.loader.hide();

        if (!response.ok) {
          // Trigger automatic error toasts
          const errMsg = data.message || `Request failed with status ${response.status}`;
          core.toast.error('API Error', errMsg);
          throw { status: response.status, data };
        }

        return data;
      } catch (err) {
        if (showLoader) core.loader.hide();
        if (!err.status) {
          core.toast.error('Network Error', 'Cannot establish connection to server.');
          throw { status: 500, message: err.message };
        }
        throw err;
      }
    }

    get(url, params = {}, showLoader = true) {
      const queryStr = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      const targetUrl = queryStr ? `${url}?${queryStr}` : url;
      return this.request(targetUrl, { method: 'GET' }, showLoader);
    }

    post(url, body = {}, showLoader = true) {
      return this.request(url, {
        method: 'POST',
        body: JSON.stringify(body)
      }, showLoader);
    }

    put(url, body = {}, showLoader = true) {
      return this.request(url, {
        method: 'PUT',
        body: JSON.stringify(body)
      }, showLoader);
    }

    patch(url, body = {}, showLoader = true) {
      return this.request(url, {
        method: 'PATCH',
        body: JSON.stringify(body)
      }, showLoader);
    }

    delete(url, showLoader = true) {
      return this.request(url, { method: 'DELETE' }, showLoader);
    }
  }
  core.api = new ApiClient();

  /* =========================================================================
   * 5. VALIDATION LIBRARY
   * ========================================================================= */
  core.validate = {
    required: val => val !== undefined && val !== null && String(val).trim() !== '',
    email: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim()),
    phone: val => /^\+?[0-9]{10,15}$/.test(String(val).trim()),
    length: (val, min, max) => {
      const len = String(val).length;
      return len >= min && len <= max;
    },
    number: val => !isNaN(val) && val !== '',
    date: val => !isNaN(Date.parse(val)),
    uuid: val => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val)
  };

  /* =========================================================================
   * 6. DIALOG & CONFIRMATION MANAGER
   * ========================================================================= */
  class DialogManager {
    constructor() {
      this.overlay = null;
    }

    _ensureOverlay() {
      this.overlay = document.getElementById('core-dialog-overlay');
      if (!this.overlay) {
        this.overlay = document.createElement('div');
        this.overlay.id = 'core-dialog-overlay';
        this.overlay.className = 'dialog-overlay';
        document.body.appendChild(this.overlay);
      }
    }

    /**
     * Show a confirmation modal dialog with confirm/cancel triggers.
     */
    confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
      this._ensureOverlay();
      
      this.overlay.innerHTML = `
        <div class="dialog-box">
          <div class="dialog-header">
            <h3 style="font-family:var(--font-heading);font-weight:600;font-size:1.15rem;">${title}</h3>
            <button class="dialog-close-btn" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-secondary);">&times;</button>
          </div>
          <div class="dialog-body">${message}</div>
          <div class="dialog-footer">
            <button class="reusable-btn reusable-btn-secondary" id="dialog-cancel-btn">${cancelText}</button>
            <button class="reusable-btn reusable-btn-primary" id="dialog-confirm-btn" style="background-color:var(--danger);">${confirmText}</button>
          </div>
        </div>
      `;

      this.overlay.classList.add('active');

      const cleanup = () => {
        this.overlay.classList.remove('active');
        this.overlay.innerHTML = '';
      };

      const handleConfirm = async () => {
        // Read DOM values BEFORE cleanup wipes the dialog HTML
        if (typeof onConfirm === 'function') await onConfirm();
        cleanup();
      };

      const handleCancel = () => {
        cleanup();
        if (typeof onCancel === 'function') onCancel();
      };

      this.overlay.querySelector('#dialog-confirm-btn').addEventListener('click', handleConfirm);
      this.overlay.querySelector('#dialog-cancel-btn').addEventListener('click', handleCancel);
      this.overlay.querySelector('.dialog-close-btn').addEventListener('click', handleCancel);
    }
  }
  core.dialog = new DialogManager();

  /* =========================================================================
   * 7. DYNAMIC COMPONENT FACTORIES (Tables, States, Paginations)
   * ========================================================================= */
  core.ui = {
    /**
     * Render empty states dynamically inside a target element.
     */
    renderEmptyState(targetId, title = 'No Data Found', desc = 'Add a record to populate this table.') {
      const container = document.getElementById(targetId);
      if (!container) return;
      
      container.innerHTML = `
        <div class="empty-state">
          <div class="state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </div>
          <div class="state-title">${title}</div>
          <div class="state-desc">${desc}</div>
        </div>
      `;
    },

    /**
     * Render error states dynamically inside a target element.
     */
    renderErrorState(targetId, title = 'Connection Failure', desc = 'Unable to download details from the server.', onRetry = null) {
      const container = document.getElementById(targetId);
      if (!container) return;

      container.innerHTML = `
        <div class="error-state">
          <div class="state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div class="state-title">${title}</div>
          <div class="state-desc">${desc}</div>
          ${onRetry ? '<button class="reusable-btn reusable-btn-secondary" id="error-retry-btn">Retry Fetch</button>' : ''}
        </div>
      `;

      if (onRetry) {
        container.querySelector('#error-retry-btn').addEventListener('click', onRetry);
      }
    },

    /**
     * Dynamically build pagination control UI footer.
     */
    renderPagination(targetId, { page, totalPages, totalRecords, onPageChange }) {
      const container = document.getElementById(targetId);
      if (!container) return;

      container.innerHTML = `
        <div class="reusable-pagination">
          <div>Showing page ${page} of ${totalPages} (Total: ${totalRecords} records)</div>
          <div class="pagination-btn-group">
            <button class="reusable-btn reusable-btn-secondary" id="page-prev-btn" style="padding:4px 10px;" ${page <= 1 ? 'disabled' : ''}>&larr; Prev</button>
            <button class="reusable-btn reusable-btn-secondary" id="page-next-btn" style="padding:4px 10px;" ${page >= totalPages ? 'disabled' : ''}>Next &rarr;</button>
          </div>
        </div>
      `;

      container.querySelector('#page-prev-btn').addEventListener('click', () => {
        if (page > 1) onPageChange(page - 1);
      });

      container.querySelector('#page-next-btn').addEventListener('click', () => {
        if (page < totalPages) onPageChange(page + 1);
      });
    }
  };

  // Expose global wrapper
  window.core = core;

})();
