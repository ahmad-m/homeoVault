/**
 * HomeoVault - Settings, Backup & Restore Client Coordinator
 */

(function () {
  'use strict';

  class SettingsManager {
    constructor() {
      // Tab switcher elements
      this.tabButtons = document.querySelectorAll('.tab-btn');
      this.tabPanels = document.querySelectorAll('.tab-content-panel');

      // System Settings Form
      this.systemForm = document.getElementById('system-settings-form');
      this.txtAppName = document.getElementById('set-app-name');
      this.txtFamilyName = document.getElementById('set-family-name');
      this.selDefaultTheme = document.getElementById('set-default-theme');
      this.selLanguage = document.getElementById('set-language');
      this.selDateFormat = document.getElementById('set-date-format');
      this.selCurrency = document.getElementById('set-currency');
      this.selLocation = document.getElementById('set-default-location');
      this.txtLowStock = document.getElementById('set-low-stock-threshold');

      // User Settings Form
      this.userForm = document.getElementById('user-settings-form');
      this.selUserTheme = document.getElementById('set-user-theme');
      this.selUserLang = document.getElementById('set-user-lang');
      this.selUserLanding = document.getElementById('set-user-landing');

      // Backup Elements
      this.btnCreateBackup = document.getElementById('btn-create-backup');
      this.backupsList = document.getElementById('backups-list-container');

      // Restore Elements
      this.dropZone = document.getElementById('restore-drop-zone');
      this.fileInput = document.getElementById('restore-file-input');

      this.init();
    }

    init() {
      // 1. Tab switches listener
      if (this.tabButtons.length > 0) {
        this.tabButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-tab');
            this.switchTab(targetId);
          });
        });
      }

      // 2. Load System configurations
      if (this.systemForm) {
        this.loadSystemSettings();
        this.systemForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveSystemSettings();
        });
      }

      // 3. Load User profile preferences
      if (this.userForm) {
        this.loadUserPrefs();
        this.userForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveUserPrefs();
        });
      }

      // 4. Load backups center
      if (this.backupsList) {
        this.fetchBackupHistory();
        if (this.btnCreateBackup) {
          this.btnCreateBackup.addEventListener('click', () => this.createBackup());
        }
      }

      // 5. Restore drop zone installer
      if (this.dropZone) {
        this.initRestoreZone();
      }
    }

    switchTab(tabId) {
      this.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
      });
      this.tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === tabId);
      });
    }

    /**
     * Settings: Load general settings
     */
    async loadSystemSettings() {
      try {
        const res = await window.core.api.get('/api/settings', {}, false);
        const data = res.data;

        if (this.txtAppName) this.txtAppName.value = data.appName || '';
        if (this.txtFamilyName) this.txtFamilyName.value = data.familyName || '';
        if (this.selDefaultTheme) this.selDefaultTheme.value = data.defaultTheme || 'dark';
        if (this.selLanguage) this.selLanguage.value = data.language || 'en';
        if (this.selDateFormat) this.selDateFormat.value = data.dateFormat || 'YYYY-MM-DD';
        if (this.selCurrency) this.selCurrency.value = data.currency || 'USD';
        if (this.txtLowStock) this.txtLowStock.value = data.defaultLowStockThreshold || '5';

        // Load Cabinet box locations into select dropdown
        try {
          const locsRes = await window.core.api.get('/api/locations', {}, false);
          if (this.selLocation && locsRes.data) {
            this.selLocation.innerHTML = '<option value="">-- Choose Cabinet --</option>';
            locsRes.data.forEach(l => {
              this.selLocation.innerHTML += `<option value="${l.name}">${l.name}</option>`;
            });
            if (data.defaultLocation) {
              this.selLocation.value = data.defaultLocation;
            }
          }
        } catch (err) {
          console.error(err);
        }
      } catch (err) {
        window.core.toast.error('Load Error', 'Cannot retrieve application settings.');
      }
    }

    /**
     * Settings: Save general settings
     */
    async saveSystemSettings() {
      const payload = {
        appName: this.txtAppName.value,
        familyName: this.txtFamilyName.value,
        defaultTheme: this.selDefaultTheme.value,
        language: this.selLanguage.value,
        dateFormat: this.selDateFormat.value,
        currency: this.selCurrency.value,
        defaultLocation: this.selLocation.value,
        defaultLowStockThreshold: this.txtLowStock.value
      };

      try {
        await window.core.api.put('/api/settings', payload);
        window.core.toast.success('Saved', 'System settings saved successfully.');
      } catch (err) {
        window.core.toast.error('Save Error', 'Cannot save application settings.');
      }
    }

    /**
     * Settings: Load user overrides
     */
    async loadUserPrefs() {
      try {
        const res = await window.core.api.get('/api/settings/user', {}, false);
        const data = res.data;

        this.selUserTheme.value = data.theme || 'dark';
        this.selUserLang.value = data.language || 'en';
        this.selUserLanding.value = data.landing_page || '/dashboard';
      } catch (err) {
        window.core.toast.error('Load Error', 'Cannot retrieve preference overrides.');
      }
    }

    /**
     * Settings: Save user overrides
     */
    async saveUserPrefs() {
      const payload = {
        theme: this.selUserTheme.value,
        language: this.selUserLang.value,
        landing_page: this.selUserLanding.value
      };

      try {
        await window.core.api.put('/api/settings/user', payload);
        window.core.toast.success('Saved', 'Preferences saved successfully.');
        
        // Dynamically toggle CSS theme mode class if user changed it
        if (payload.theme === 'light') {
          document.documentElement.classList.add('light-mode');
        } else {
          document.documentElement.classList.remove('light-mode');
        }
      } catch (err) {
        window.core.toast.error('Save Error', 'Cannot save user preferences.');
      }
    }

    /**
     * Backup: Fetch list
     */
    async fetchBackupHistory() {
      try {
        const res = await window.core.api.get('/api/backup/history', {}, false);
        const history = res.data || [];

        if (history.length === 0) {
          this.backupsList.innerHTML = '<div style="text-align:center;padding:20px;">No backup files cataloged.</div>';
          return;
        }

        this.backupsList.innerHTML = '';
        history.forEach(bh => {
          const div = document.createElement('div');
          div.className = 'backup-item';
          div.innerHTML = `
            <div>
              <div class="backup-filename">${bh.filename}</div>
              <div class="backup-meta">
                Size: ${(bh.file_size / 1024).toFixed(1)} KB | 
                Date: ${new Date(bh.created_at).toLocaleString()} | 
                By: ${bh.operator_name || 'System'}
              </div>
            </div>
            <div>
              <a href="/api/backup/download/${bh.id}" class="reusable-btn reusable-btn-primary" style="padding:4px 10px;font-size:0.8rem;text-decoration:none;">Download</a>
            </div>
          `;
          this.backupsList.appendChild(div);
        });
      } catch (err) {
        this.backupsList.innerHTML = '<div style="text-align:center;color:var(--danger);padding:20px;">Failed to load backup logs.</div>';
      }
    }

    async createBackup() {
      try {
        window.core.loader.show();
        await window.core.api.post('/api/backup/create');
        window.core.toast.success('SUCCESS', 'Database and configurations backup created successfully.');
        this.fetchBackupHistory();
      } catch (err) {
        window.core.toast.error('Backup Error', 'Failed to generate backup file.');
      } finally {
        window.core.loader.hide();
      }
    }

    /**
     * Restore: Drag & Drop
     */
    initRestoreZone() {
      const zone = this.dropZone;
      const input = this.fileInput;

      zone.addEventListener('click', () => input.click());

      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.processRestoreFile(files[0]);
        }
      });

      input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.processRestoreFile(e.target.files[0]);
        }
      });
    }

    processRestoreFile(file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        window.core.toast.error('File Error', 'Only JSON backup files (.json) are supported.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          
          // Confirm Restore Dialog Action
          const msg = `Are you absolutely sure you want to restore? This will overwrite the current medicines catalog, suppliers directories, cabinet locations, and active stock levels!`;
          if (confirm(msg)) {
            window.core.loader.show();
            await window.core.api.post('/api/backup/restore', { backupData });
            window.core.loader.hide();
            
            window.core.toast.success('Restored', 'Database backup restored successfully.');
            // Reload page to reflect restored configs
            setTimeout(() => window.location.reload(), 1500);
          }
        } catch (err) {
          window.core.loader.hide();
          window.core.toast.error('Restore Error', 'Invalid backup file contents or schema mismatch.');
        }
      };
      reader.readAsText(file);
    }
  }

  // Load and mount
  document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
  });

})();
