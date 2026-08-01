/**
 * HomeoVault - Frontend Application Logic
 * Implements Vanilla JS controllers for Responsive Menu, Toast Notifications, Modals, and Spinners.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initModals();
  initToastTester();
});

/**
 * 1. Mobile Navigation Menu Drawer
 */
function initMobileMenu() {
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('mobile-active');
      
      // Update hamburger icon visual status if needed
      const icon = navToggle.querySelector('i');
      if (icon) {
        if (navLinks.classList.contains('mobile-active')) {
          icon.textContent = '✕'; // Close character
        } else {
          icon.textContent = '☰'; // Hamburger character
        }
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
        navLinks.classList.remove('mobile-active');
        const icon = navToggle.querySelector('i');
        if (icon) icon.textContent = '☰';
      }
    });
  }
}

/**
 * 2. Toast Notification Engine
 */
class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Spawns a floating toast notification.
   * @param {string} title - Title of the toast
   * @param {string} message - Description message
   * @param {string} type - success | danger | warning | info
   * @param {number} duration - Auto close delay in ms (default 4000)
   */
  show(title, message, type = 'success', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // SVG icons based on message status type
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger)"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--warning)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--info)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    this.container.appendChild(toast);

    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    // Auto-dismiss timer
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  }

  dismiss(toast) {
    if (toast.parentNode) {
      toast.classList.add('hide');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }
  }
}

// Global Export
window.toast = new ToastManager();

/**
 * 3. Loading Spinner Controller
 */
const spinner = {
  show: (targetId = null) => {
    // If targetId is provided, spawn inside target container. Otherwise, overlay globally.
    if (targetId) {
      const container = document.getElementById(targetId);
      if (container && !container.querySelector('.spinner-container')) {
        const spinnerMarkup = document.createElement('div');
        spinnerMarkup.className = 'spinner-container';
        spinnerMarkup.innerHTML = '<div class="spinner"></div>';
        container.appendChild(spinnerMarkup);
      }
    } else {
      if (!document.getElementById('global-spinner')) {
        const overlay = document.createElement('div');
        overlay.id = 'global-spinner';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.background = 'rgba(11, 15, 25, 0.8)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(overlay);
      }
    }
  },
  hide: (targetId = null) => {
    if (targetId) {
      const container = document.getElementById(targetId);
      const innerSpinner = container?.querySelector('.spinner-container');
      if (innerSpinner) innerSpinner.remove();
    } else {
      const globalSpinner = document.getElementById('global-spinner');
      if (globalSpinner) globalSpinner.remove();
    }
  }
};

window.spinner = spinner;

/**
 * 4. Modal Overlay Controller
 */
function initModals() {
  const modalTargets = document.querySelectorAll('[data-modal-target]');
  const modalCloses = document.querySelectorAll('[data-modal-close]');
  
  modalTargets.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-target');
      openModal(targetId);
    });
  });

  modalCloses.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });

  // Close when clicking overlay backdrop
  const overlays = document.querySelectorAll('.modal-overlay');
  overlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock background scrolling
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Unlock background scrolling
  }
}

window.openModal = openModal;
window.closeModal = closeModal;

/**
 * 5. Tester bindings for Landing/Dashboard interactive components
 */
function initToastTester() {
  // Bind buttons on the dashboard for manual test triggers
  const btnSuccess = document.getElementById('btn-test-success');
  const btnDanger = document.getElementById('btn-test-danger');
  const btnWarning = document.getElementById('btn-test-warning');
  const btnInfo = document.getElementById('btn-test-info');
  const btnSpinner = document.getElementById('btn-test-spinner');

  if (btnSuccess) {
    btnSuccess.addEventListener('click', () => {
      window.toast.show('Medicine Synced', 'Homeopathic medicine inventory synchronized successfully.', 'success');
    });
  }
  
  if (btnDanger) {
    btnDanger.addEventListener('click', () => {
      window.toast.show('Low Stock Alert', 'Nux Vomica 30C is running low (only 2 bottles left).', 'danger');
    });
  }

  if (btnWarning) {
    btnWarning.addEventListener('click', () => {
      window.toast.show('Database Sync Delay', 'Connection to server took longer than expected.', 'warning');
    });
  }

  if (btnInfo) {
    btnInfo.addEventListener('click', () => {
      window.toast.show('System Update', 'New medicine index catalog updated.', 'info');
    });
  }

  if (btnSpinner) {
    btnSpinner.addEventListener('click', () => {
      window.spinner.show();
      setTimeout(() => {
        window.spinner.hide();
        window.toast.show('Data Loaded', 'Inventory metrics updated successfully.', 'success');
      }, 2000);
    });
  }
}

/**
 * 6. PWA Service Worker & Install Banners Manager
 */
(function () {
  'use strict';

  // A. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => {
          console.log('[Service Worker] Registered successfully. Scope:', reg.scope);
          
          // Detect service worker updates
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateBanner();
              }
            });
          });
        })
        .catch((err) => {
          console.error('[Service Worker] Registration failed:', err);
        });
    });
  }

  // B. Handle Installation Prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.position = 'fixed';
    banner.style.bottom = '20px';
    banner.style.left = '20px';
    banner.style.right = '20px';
    banner.style.maxWidth = '400px';
    banner.style.backgroundColor = 'var(--bg-secondary)';
    banner.style.border = '1px solid var(--primary)';
    banner.style.borderRadius = 'var(--radius-md)';
    banner.style.padding = '16px';
    banner.style.zIndex = '10000';
    banner.style.boxShadow = 'var(--shadow-lg)';
    banner.style.display = 'flex';
    banner.style.flexDirection = 'column';
    banner.style.gap = '12px';

    banner.innerHTML = `
      <div>
        <strong style="display:block;color:var(--text-primary);margin-bottom:4px;">Install HomeoVault App</strong>
        <span class="text-secondary" style="font-size:0.8rem;">Add HomeoVault to your home screen for rapid offline medicine access.</span>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button class="reusable-btn" id="btn-pwa-dismiss" style="padding:4px 10px;font-size:0.75rem;">Later</button>
        <button class="reusable-btn reusable-btn-primary" id="btn-pwa-install" style="padding:4px 10px;font-size:0.75rem;">Install Now</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('btn-pwa-dismiss').addEventListener('click', () => {
      banner.remove();
    });

    document.getElementById('btn-pwa-install').addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted installation.');
          }
          deferredPrompt = null;
          banner.remove();
        });
      }
    });
  }

  // C. Handle Service Worker Updates
  function showUpdateBanner() {
    if (document.getElementById('pwa-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.style.position = 'fixed';
    banner.style.top = '20px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.backgroundColor = 'var(--bg-secondary)';
    banner.style.border = '1px solid var(--info)';
    banner.style.borderRadius = 'var(--radius-md)';
    banner.style.padding = '12px 20px';
    banner.style.zIndex = '10001';
    banner.style.boxShadow = 'var(--shadow-lg)';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.gap = '16px';

    banner.innerHTML = `
      <span style="font-size:0.85rem;color:var(--text-primary);font-weight:600;">Update Available. Refresh to load new version.</span>
      <button class="reusable-btn reusable-btn-primary" id="btn-pwa-refresh" style="padding:4px 10px;font-size:0.75rem;">Refresh</button>
    `;

    document.body.appendChild(banner);

    document.getElementById('btn-pwa-refresh').addEventListener('click', () => {
      window.location.reload();
    });
  }

  // D. Monitor Connection Status
  window.addEventListener('offline', () => {
    window.toast.show('Offline Warning', 'Connection down. Running in offline mode.', 'warning');
    showOfflineBanner();
  });

  window.addEventListener('online', () => {
    window.toast.show('Online Restored', 'Connection restored. Resyncing data.', 'success');
    const banner = document.getElementById('pwa-offline-banner');
    if (banner) banner.remove();
  });

  function showOfflineBanner() {
    if (document.getElementById('pwa-offline-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-offline-banner';
    banner.style.position = 'fixed';
    banner.style.bottom = '0';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.backgroundColor = 'var(--warning)';
    banner.style.color = '#000000';
    banner.style.padding = '8px';
    banner.style.textAlign = 'center';
    banner.style.fontWeight = 'bold';
    banner.style.fontSize = '0.8rem';
    banner.style.zIndex = '9999';
    banner.style.animation = 'slide-up 0.3s ease-out';
    banner.innerText = '⚠️ You are currently offline. Pages may load slower.';

    document.body.appendChild(banner);
  }

})();
