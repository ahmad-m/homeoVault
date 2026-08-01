/**
 * HomeoVault - Notifications, Alerts & Background Jobs Client Coordinator
 */

(function () {
  'use strict';

  class NotificationManager {
    constructor() {
      // Notification Center Elements
      this.listContainer = document.getElementById('notifications-list');
      this.paginationContainer = document.getElementById('notifications-pagination');
      this.btnMarkAllRead = document.getElementById('btn-mark-all-read');
      this.filterSelect = document.getElementById('filter-notification-type');
      this.filterReadSelect = document.getElementById('filter-read-status');

      // Preferences Settings Elements
      this.prefsForm = document.getElementById('notification-settings-form');
      this.chkEnableAll = document.getElementById('pref-enable-all');
      this.chkLowStock = document.getElementById('pref-low-stock');
      this.chkExpiry = document.getElementById('pref-expiry');
      this.chkDashboard = document.getElementById('pref-dashboard');
      this.chkEmail = document.getElementById('pref-email');
      this.chkPush = document.getElementById('pref-push');

      // Job Scheduler Elements
      this.jobsList = document.getElementById('jobs-list-container');

      this.params = { page: 1, limit: 15 };

      this.init();
    }

    init() {
      // 1. If in Notification Center
      if (this.listContainer) {
        this.fetchNotifications();
        
        if (this.btnMarkAllRead) {
          this.btnMarkAllRead.addEventListener('click', () => this.markAllAsRead());
        }

        if (this.filterSelect) {
          this.filterSelect.addEventListener('change', () => {
            this.params.page = 1;
            this.fetchNotifications();
          });
        }

        if (this.filterReadSelect) {
          this.filterReadSelect.addEventListener('change', () => {
            this.params.page = 1;
            this.fetchNotifications();
          });
        }
      }

      // 2. If in Preferences Settings
      if (this.prefsForm) {
        this.loadPreferences();
        this.prefsForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.savePreferences();
        });
      }

      // 3. If Job status list is present
      if (this.jobsList) {
        this.fetchJobStatus();
      }
    }

    /**
     * Notification Center: Fetch list
     */
    async fetchNotifications() {
      try {
        const queryParams = {
          page: this.params.page,
          limit: this.params.limit
        };

        if (this.filterSelect && this.filterSelect.value) {
          queryParams.type = this.filterSelect.value;
        }

        if (this.filterReadSelect && this.filterReadSelect.value) {
          queryParams.isRead = this.filterReadSelect.value;
        }

        const res = await window.core.api.get('/api/notifications', queryParams);
        this.renderNotifications(res.data.records);

        if (res.data.totalRecords > 0) {
          const totalPages = Math.ceil(res.data.totalRecords / this.params.limit);
          window.core.ui.renderPagination('notifications-pagination', {
            page: this.params.page,
            totalPages,
            totalRecords: res.data.totalRecords,
            onPageChange: (newPage) => {
              this.params.page = newPage;
              this.fetchNotifications();
            }
          });
        } else {
          this.paginationContainer.innerHTML = '';
        }

        // Also update the global header navbar badge if it exists
        this.updateGlobalBadge();
      } catch (err) {
        this.listContainer.innerHTML = '<div style="text-align:center;color:var(--danger);padding:20px;">Failed to load notifications.</div>';
      }
    }

    renderNotifications(records) {
      if (!records || records.length === 0) {
        this.listContainer.innerHTML = `
          <div class="empty-state" style="padding:40px;text-align:center;">
            <div style="font-size:2.5rem;margin-bottom:12px;">🔔</div>
            <h4 style="font-family:var(--font-heading);font-weight:700;margin-bottom:6px;">No Notifications</h4>
            <p class="text-secondary" style="font-size:0.88rem;">Everything is clear! Check back later for stock warnings.</p>
          </div>
        `;
        return;
      }

      this.listContainer.innerHTML = '';
      records.forEach(nt => {
        const div = document.createElement('div');
        div.className = `notification-item ${nt.is_read ? 'read' : 'unread'}`;
        
        // Add color variations for warning/danger categories
        if (!nt.is_read) {
          const isDanger = nt.type.startsWith('OUT') || nt.type.startsWith('EXPIRED') || nt.type.startsWith('SYSTEM');
          const isWarn = nt.type.startsWith('LOW') || nt.type.startsWith('EXPIRY');
          if (isDanger) div.classList.add('danger');
          else if (isWarn) div.classList.add('warn');
        }

        div.innerHTML = `
          <div class="notification-content">
            <h4 class="notification-title">${nt.title}</h4>
            <p class="notification-message">${nt.message}</p>
            <div class="notification-meta">
              <span class="notification-type-badge ${nt.type}">${nt.type}</span>
              <span>${new Date(nt.created_at).toLocaleString()}</span>
            </div>
          </div>
          
          <div style="display:flex;gap:8px;align-items:center;">
            ${!nt.is_read ? `<button class="reusable-btn btn-read-action" data-id="${nt.id}" style="padding:4px 8px;font-size:0.72rem;">Read</button>` : ''}
            <button class="reusable-btn btn-delete-action" data-id="${nt.id}" style="padding:4px 8px;font-size:0.72rem;border-color:var(--danger);color:var(--danger);">Delete</button>
          </div>
        `;

        // Bind Read action
        const btnRead = div.querySelector('.btn-read-action');
        if (btnRead) {
          btnRead.addEventListener('click', () => this.markAsRead(nt.id));
        }

        // Bind Delete action
        const btnDelete = div.querySelector('.btn-delete-action');
        if (btnDelete) {
          btnDelete.addEventListener('click', () => this.deleteNotification(nt.id));
        }

        this.listContainer.appendChild(div);
      });
    }

    async markAsRead(id) {
      try {
        await window.core.api.put(`/api/notifications/${id}/read`);
        window.core.toast.success('Done', 'Notification marked as read.');
        this.fetchNotifications();
      } catch (err) {
        window.core.toast.error('Error', 'Cannot update notification status.');
      }
    }

    async markAllAsRead() {
      try {
        await window.core.api.put('/api/notifications/read-all');
        window.core.toast.success('Done', 'All notifications marked as read.');
        this.fetchNotifications();
      } catch (err) {
        window.core.toast.error('Error', 'Cannot update notifications status.');
      }
    }

    async deleteNotification(id) {
      try {
        await window.core.api.delete(`/api/notifications/${id}`);
        window.core.toast.success('Removed', 'Notification deleted.');
        this.fetchNotifications();
      } catch (err) {
        window.core.toast.error('Error', 'Cannot remove notification.');
      }
    }

    /**
     * Preferences Settings: Load Preferences
     */
    async loadPreferences() {
      try {
        const res = await window.core.api.get('/api/notifications/preferences', {}, false);
        const prefs = res.data;

        this.chkEnableAll.checked = prefs.enable_all;
        this.chkLowStock.checked = prefs.low_stock;
        this.chkExpiry.checked = prefs.expiry;
        this.chkDashboard.checked = prefs.dashboard;
        this.chkEmail.checked = prefs.email;
        this.chkPush.checked = prefs.push;
      } catch (err) {
        window.core.toast.error('Load Error', 'Cannot load notification preferences.');
      }
    }

    /**
     * Preferences Settings: Save Preferences
     */
    async savePreferences() {
      const payload = {
        enable_all: this.chkEnableAll.checked,
        low_stock: this.chkLowStock.checked,
        expiry: this.chkExpiry.checked,
        dashboard: this.chkDashboard.checked,
        email: this.chkEmail.checked,
        push: this.chkPush.checked
      };

      try {
        await window.core.api.put('/api/notifications/preferences', payload);
        window.core.toast.success('Saved', 'Preferences updated successfully.');
      } catch (err) {
        window.core.toast.error('Save Error', 'Cannot save preferences profile.');
      }
    }

    /**
     * Job Scheduler: Load status list
     */
    async fetchJobStatus() {
      try {
        const res = await window.core.api.get('/api/jobs/status', {}, false);
        const jobs = res.data || [];

        if (jobs.length === 0) {
          this.jobsList.innerHTML = '<div style="text-align:center;padding:20px;">No scheduler jobs registered in the database.</div>';
          return;
        }

        this.jobsList.innerHTML = '';
        jobs.forEach(job => {
          const div = document.createElement('div');
          div.className = 'job-item-card';
          div.innerHTML = `
            <div>
              <div class="job-info-name">${job.name}</div>
              <div class="job-info-time">Last Run: ${job.last_run ? new Date(job.last_run).toLocaleString() : 'Never'}</div>
              ${job.error_details ? `<div style="font-size:0.75rem;color:var(--danger);margin-top:6px;">Error: ${job.error_details}</div>` : ''}
            </div>
            
            <div style="display:flex;gap:12px;align-items:center;">
              <span class="job-status-badge ${job.status}">${job.status}</span>
              <button class="reusable-btn reusable-btn-primary btn-run-job" data-name="${job.name}" style="padding:4px 10px;font-size:0.78rem;">Trigger Now</button>
            </div>
          `;

          // Bind manual run button action
          div.querySelector('.btn-run-job').addEventListener('click', (e) => {
            const name = e.target.getAttribute('data-name');
            this.triggerJobManual(name);
          });

          this.jobsList.appendChild(div);
        });
      } catch (err) {
        this.jobsList.innerHTML = '<div style="text-align:center;color:var(--danger);padding:20px;">Failed to load scheduled background jobs status.</div>';
      }
    }

    async triggerJobManual(name) {
      try {
        await window.core.api.post('/api/jobs/run', { name });
        window.core.toast.success('Triggered', `Job [${name}] started in the background.`);
        
        // Refresh statuses list after a short delay
        setTimeout(() => this.fetchJobStatus(), 800);
      } catch (err) {
        window.core.toast.error('Trigger Failed', 'Cannot run background task.');
      }
    }

    /**
     * Header Navbar: Count indicator badge updater
     */
    async updateGlobalBadge() {
      const badge = document.getElementById('nav-notifications-badge');
      if (!badge) return;

      try {
        const res = await window.core.api.get('/api/notifications/unread', {}, false);
        const count = res.data.count;

        if (count > 0) {
          badge.innerText = count > 99 ? '99+' : count;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      } catch (err) {
        // Suppress background errors
      }
    }
  }

  // Load and mount
  document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
    // Periodically update the unread counter badge every 30 seconds
    setInterval(() => window.notificationManager.updateGlobalBadge(), 30000);
    // Initial header badge refresh
    window.notificationManager.updateGlobalBadge();
  });

})();
