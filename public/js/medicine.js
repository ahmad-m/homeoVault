/**
 * HomeoVault - Medicine Master Client Coordinator
 */

(function () {
  'use strict';

  class MedicineCatalog {
    constructor() {
      this.remedyGrid = document.getElementById('medicine-catalog-grid');
      this.paginationContainer = document.getElementById('catalog-pagination');
      this.categoryFilterGroup = document.getElementById('category-filter-list');
      this.potencyFilterGroup = document.getElementById('potency-filter-list');
      this.mfrFilterGroup = document.getElementById('manufacturer-filter-list');
      
      this.params = {
        page: 1,
        limit: 9,
        q: '',
        category_id: '',
        potency_id: '',
        manufacturer_id: '',
        sort: 'name'
      };

      if (this.remedyGrid) {
        this.initCatalog();
      }
    }

    /* =========================================================================
     * 1. CATALOG PAGE INITIALIZER
     * ========================================================================= */
    async initCatalog() {
      // Setup sort change listener
      const sortSelector = document.getElementById('medicine-sort-select');
      if (sortSelector) {
        sortSelector.addEventListener('change', (e) => {
          this.params.sort = e.target.value;
          this.params.page = 1;
          this.fetchCatalog();
        });
      }

      // Setup Search Form Submission
      const searchForm = document.getElementById('medicine-search-form');
      if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const queryInput = document.getElementById('medicine-search-input');
          this.params.q = queryInput.value.trim();
          this.params.page = 1;
          this.fetchCatalog();
        });
      }

      // Fetch dynamic filters and data catalog
      await this.loadFiltersList();
      this.fetchCatalog();
    }

    async loadFiltersList() {
      try {
        // Load categories, potencies, and manufacturers in parallel
        const [catsRes, potsRes, mfrsRes] = await Promise.all([
          window.core.api.get('/api/categories', {}, false),
          window.core.api.get('/api/potencies', {}, false),
          window.core.api.get('/api/manufacturers', {}, false)
        ]);

        // Render Category Checkboxes
        if (this.categoryFilterGroup && catsRes.data) {
          // Add "Show All" as first option to allow clearing the filter
          const allLabel = document.createElement('label');
          allLabel.className = 'filter-checkbox-label';
          allLabel.innerHTML = `
            <input type="radio" name="category-filter" value="" checked>
            <span>All Categories</span>
          `;
          allLabel.querySelector('input').addEventListener('change', (e) => {
            this.params.category_id = '';
            this.params.page = 1;
            this.fetchCatalog();
          });
          this.categoryFilterGroup.appendChild(allLabel);

          catsRes.data.forEach(cat => {
            const label = document.createElement('label');
            label.className = 'filter-checkbox-label';
            label.innerHTML = `
              <input type="radio" name="category-filter" value="${cat.id}">
              <span>${cat.name}</span>
            `;
            label.querySelector('input').addEventListener('change', (e) => {
              // For radio buttons, e.target.checked is always true when change fires
              this.params.category_id = e.target.value;
              this.params.page = 1;
              this.fetchCatalog();
            });
            this.categoryFilterGroup.appendChild(label);
          });
        }

        // Render Potency Checkboxes
        if (this.potencyFilterGroup && potsRes.data) {
          potsRes.data.forEach(pot => {
            const label = document.createElement('label');
            label.className = 'filter-checkbox-label';
            label.innerHTML = `
              <input type="radio" name="potency-filter" value="${pot.id}">
              <span>${pot.name}</span>
            `;
            label.querySelector('input').addEventListener('change', (e) => {
              this.params.potency_id = e.target.checked ? e.target.value : '';
              this.params.page = 1;
              this.fetchCatalog();
            });
            this.potencyFilterGroup.appendChild(label);
          });
        }

        // Render Manufacturer Checkboxes
        if (this.mfrFilterGroup && mfrsRes.data) {
          mfrsRes.data.forEach(mfr => {
            const label = document.createElement('label');
            label.className = 'filter-checkbox-label';
            label.innerHTML = `
              <input type="radio" name="mfr-filter" value="${mfr.id}">
              <span>${mfr.name}</span>
            `;
            label.querySelector('input').addEventListener('change', (e) => {
              this.params.manufacturer_id = e.target.checked ? e.target.value : '';
              this.params.page = 1;
              this.fetchCatalog();
            });
            this.mfrFilterGroup.appendChild(label);
          });
        }
      } catch (err) {
        console.error('Failed to load catalog filter data', err);
      }
    }

    async fetchCatalog() {
      try {
        const res = await window.core.api.get('/api/medicines/search', this.params);
        this.renderCatalog(res.data.records);
        
        // Render pagination controls
        if (res.data.pagination) {
          window.core.ui.renderPagination('catalog-pagination', {
            page: res.data.pagination.page,
            totalPages: res.data.pagination.totalPages,
            totalRecords: res.data.pagination.totalRecords,
            onPageChange: (newPage) => {
              this.params.page = newPage;
              this.fetchCatalog();
            }
          });
        }
      } catch (err) {
        window.core.ui.renderErrorState('medicine-catalog-grid', 'Failed to Load Remedies', 'Could not fetch catalog records.', () => this.fetchCatalog());
      }
    }

    executeSearch(term) {
      this.params.q = term;
      this.params.page = 1;
      this.fetchCatalog();
    }

    renderCatalog(records) {
      if (!records || records.length === 0) {
        window.core.ui.renderEmptyState('medicine-catalog-grid', 'No Medicines Cataloged', 'Add or import records to start building your remedy collection.');
        this.paginationContainer.innerHTML = '';
        return;
      }

      this.remedyGrid.innerHTML = '';
      records.forEach(item => {
        const card = document.createElement('article');
        card.className = 'reusable-card remedy-card';
        card.innerHTML = `
          <span class="remedy-category-badge">${item.category_name}</span>
          <h3 class="remedy-name">${item.name}</h3>
          <p class="remedy-subnames">${item.latin_name || 'No latin classification'}</p>
          <p class="remedy-description">${item.description ? item.description.substring(0, 100) + '...' : 'No description provided.'}</p>
          
          <div class="remedy-meta-row">
            ${item.default_form_name ? `<span class="meta-pill">Form: ${item.default_form_name}</span>` : ''}
            <span class="meta-pill">Min Stock: ${item.min_stock}</span>
          </div>

          <div style="display:flex;gap:8px;margin-top:auto;flex-wrap:wrap;">
            <a href="/medicine-details.html?id=${item.id}" class="reusable-btn reusable-btn-secondary" style="flex:1;text-align:center;text-decoration:none;font-size:0.82rem;padding:7px 10px;">View</a>
            <button class="reusable-btn" data-edit-id="${item.id}" style="flex:1;font-size:0.82rem;padding:7px 10px;background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);border-radius:8px;cursor:pointer;">✏ Edit</button>
            <button class="reusable-btn" data-delete-id="${item.id}" data-delete-name="${item.name}" style="flex:1;font-size:0.82rem;padding:7px 10px;background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.3);border-radius:8px;cursor:pointer;">🗑 Delete</button>
          </div>
        `;

        card.querySelector('[data-edit-id]').addEventListener('click', () => {
          window.medicineEditor.openEdit(item.id);
        });
        card.querySelector('[data-delete-id]').addEventListener('click', () => {
          window.medicineEditor.confirmDelete(item.id, item.name);
        });

        this.remedyGrid.appendChild(card);
      });
    }
  }

  /* =========================================================================
   * MEDICINE EDITOR — Edit & Delete Modal Manager
   * ========================================================================= */
  class MedicineEditor {
    constructor() {
      this._buildModal();
    }

    _buildModal() {
      // Remove any stale modal
      const old = document.getElementById('edit-medicine-modal');
      if (old) old.remove();

      const overlay = document.createElement('div');
      overlay.id = 'edit-medicine-modal';
      overlay.style.cssText = [
        'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px)',
        'z-index:8000;display:none;align-items:center;justify-content:center;padding:20px'
      ].join(';');

      overlay.innerHTML = `
        <div style="background:var(--surface,#1a1f35);border:1px solid var(--border);border-radius:16px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px 0;">
            <h2 style="font-family:var(--font-heading);font-weight:700;font-size:1.3rem;">✏️ Edit Remedy</h2>
            <button id="close-edit-modal" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted);line-height:1;">&times;</button>
          </div>
          <div style="padding:20px 24px 24px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
              <div style="grid-column:1/-1;">
                <label class="form-label" style="display:block;margin-bottom:6px;font-weight:600;">Medicine Name *</label>
                <input type="text" id="edit-med-name" class="material-input" placeholder="Remedy name">
              </div>
              <div>
                <label class="form-label" style="display:block;margin-bottom:6px;font-weight:600;">Latin Name</label>
                <input type="text" id="edit-latin-name" class="material-input" placeholder="Latin classification">
              </div>
              <div>
                <label class="form-label" style="display:block;margin-bottom:6px;font-weight:600;">Common Name</label>
                <input type="text" id="edit-common-name" class="material-input" placeholder="Common name">
              </div>
              <div>
                <label class="form-label" style="display:block;margin-bottom:6px;font-weight:600;">Short Name</label>
                <input type="text" id="edit-short-name" class="material-input" placeholder="Abbreviation">
              </div>
              <div>
                <label class="form-label" style="display:block;margin-bottom:6px;font-weight:600;">Category</label>
                <select class="material-select" id="edit-category-select">
                  <option value="">-- Loading... --</option>
                </select>
              </div>
              <div style="grid-column:1/-1;">
                <label class="form-label" style="display:block;margin-bottom:6px;font-weight:600;">Description</label>
                <textarea id="edit-description" class="material-input" style="height:80px;resize:none;" placeholder="Brief description"></textarea>
              </div>
            </div>

            <div style="margin-bottom:20px;">
              <label class="form-label" style="display:block;margin-bottom:10px;font-weight:600;">Potencies <span style="font-size:0.78rem;color:var(--text-muted);font-weight:400;">(check all that apply)</span></label>
              <div id="edit-potency-checkboxes" style="display:flex;flex-wrap:wrap;gap:8px;">Loading...</div>
            </div>

            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button id="cancel-edit-modal" class="reusable-btn reusable-btn-secondary" style="padding:9px 18px;">Cancel</button>
              <button id="save-edit-modal" class="reusable-btn reusable-btn-primary" style="padding:9px 22px;">Save Changes</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      document.getElementById('close-edit-modal').addEventListener('click', () => this.closeModal());
      document.getElementById('cancel-edit-modal').addEventListener('click', () => this.closeModal());
      overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeModal(); });
      document.getElementById('save-edit-modal').addEventListener('click', () => this.saveEdit());

      this.modal = overlay;
      this.currentId = null;
    }

    closeModal() {
      this.modal.style.display = 'none';
    }

    async openEdit(medicineId) {
      this.currentId = medicineId;
      this.modal.style.display = 'flex';

      // Reset fields
      ['edit-med-name','edit-latin-name','edit-common-name','edit-short-name','edit-description'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('edit-potency-checkboxes').innerHTML = 'Loading potencies...';
      document.getElementById('edit-category-select').innerHTML = '<option value="">-- Loading... --</option>';

      try {
        const [medRes, catsRes, potsRes] = await Promise.all([
          window.core.api.get(`/api/medicines/${medicineId}`, {}, false),
          window.core.api.get('/api/categories', {}, false),
          window.core.api.get('/api/potencies', {}, false)
        ]);

        const med = medRes.data;

        // Fill text fields
        document.getElementById('edit-med-name').value = med.name || '';
        document.getElementById('edit-latin-name').value = med.latin_name || '';
        document.getElementById('edit-common-name').value = med.common_name || '';
        document.getElementById('edit-short-name').value = med.short_name || '';
        document.getElementById('edit-description').value = med.description || '';

        // Fill category dropdown
        const catSel = document.getElementById('edit-category-select');
        catSel.innerHTML = '<option value="">-- Choose Category --</option>';
        if (catsRes.data) {
          catsRes.data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = c.name;
            if (c.id === med.category_id) opt.selected = true;
            catSel.appendChild(opt);
          });
        }

        // Determine currently mapped potency IDs (from medicine_potencies via mp.id link)
        // med.potencies = [{id: mp.id, name}] — we need the potency_id for comparison
        // Let's re-query the raw potency list and compare names
        const currentPotencyNames = new Set((med.potencies || []).map(p => p.name));

        // Fill potency checkboxes
        const container = document.getElementById('edit-potency-checkboxes');
        container.innerHTML = '';
        if (potsRes.data) {
          potsRes.data.forEach(p => {
            const isChecked = currentPotencyNames.has(p.name);
            const label = document.createElement('label');
            label.style.cssText = `display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;cursor:pointer;font-size:0.82rem;font-weight:500;border:1.5px solid ${isChecked ? 'var(--primary)' : 'var(--border)'};background:${isChecked ? 'rgba(16,185,129,0.12)' : 'transparent'};color:${isChecked ? 'var(--primary)' : ''};transition:all 0.15s;user-select:none;`;
            label.innerHTML = `<input type="checkbox" value="${p.id}" ${isChecked ? 'checked' : ''} style="width:13px;height:13px;"> ${p.name}`;
            const cb = label.querySelector('input');
            cb.addEventListener('change', () => {
              label.style.borderColor = cb.checked ? 'var(--primary)' : 'var(--border)';
              label.style.background = cb.checked ? 'rgba(16,185,129,0.12)' : 'transparent';
              label.style.color = cb.checked ? 'var(--primary)' : '';
            });
            container.appendChild(label);
          });
        }
      } catch (err) {
        window.core.toast.error('Error', 'Failed to load medicine details.');
        this.closeModal();
      }
    }

    async saveEdit() {
      const name = document.getElementById('edit-med-name').value.trim();
      if (!name) { window.core.toast.warn('Validation', 'Medicine name is required.'); return; }

      const checked = document.querySelectorAll('#edit-potency-checkboxes input[type="checkbox"]:checked');
      const potency_ids = Array.from(checked).map(cb => cb.value);

      const payload = {
        name,
        latin_name: document.getElementById('edit-latin-name').value.trim() || null,
        common_name: document.getElementById('edit-common-name').value.trim() || null,
        short_name: document.getElementById('edit-short-name').value.trim() || null,
        description: document.getElementById('edit-description').value.trim() || null,
        category_id: document.getElementById('edit-category-select').value || null,
        potency_ids
      };

      const btn = document.getElementById('save-edit-modal');
      btn.disabled = true;
      btn.innerText = 'Saving...';

      try {
        await window.core.api.put(`/api/medicines/${this.currentId}`, payload);
        window.core.toast.success('Saved', 'Remedy updated successfully.');
        this.closeModal();
        window.medicineCatalog?.fetchCatalog();
      } catch (err) {
        const msg = err?.data?.message || 'Update failed.';
        window.core.toast.error('Error', msg);
      } finally {
        btn.disabled = false;
        btn.innerText = 'Save Changes';
      }
    }

    confirmDelete(medicineId, medicineName) {
      window.core.dialog.confirm({
        title: '🗑 Delete Remedy',
        message: `<p style="margin:8px 0;">Are you sure you want to remove <strong style="color:var(--danger);">${medicineName}</strong> from the catalog?</p><p style="font-size:0.85rem;color:var(--text-muted);">This is a soft-delete — the record is deactivated, not permanently erased.</p>`,
        confirmText: 'Yes, Delete',
        cancelText: 'Keep It',
        onConfirm: async () => {
          try {
            await window.core.api.delete(`/api/medicines/${medicineId}`);
            window.core.toast.success('Deleted', `"${medicineName}" removed from catalog.`);
            window.medicineCatalog?.fetchCatalog();
          } catch (err) {
            const msg = err?.data?.message || 'Delete failed.';
            window.core.toast.error('Error', msg);
          }
        }
      });
    }
  }

  /* =========================================================================
   * 2. DETAILS PAGE INITIALIZER
   * ========================================================================= */
  class MedicineDetails {
    constructor() {
      this.detailsContainer = document.getElementById('details-view-container');
      if (this.detailsContainer) {
        this.init();
      }
    }

    async init() {
      const urlParams = new URLSearchParams(window.location.search);
      const medicineId = urlParams.get('id');

      if (!medicineId || !window.core.validate.uuid(medicineId)) {
        window.core.ui.renderErrorState('details-view-container', 'Invalid ID', 'The requested remedy details are missing or malformed.');
        return;
      }

      try {
        const res = await window.core.api.get(`/api/medicines/${medicineId}`);
        this.render(res.data);
      } catch (err) {
        window.core.ui.renderErrorState('details-view-container', 'Connection Error', 'Cannot establish connection to retrieve cabinet files.');
      }
    }

    render(item) {
      this.detailsContainer.innerHTML = `
        <div class="details-grid">
          
          <!-- Left Main Side -->
          <div class="reusable-card">
            <span class="remedy-category-badge">${item.category_name}</span>
            <h2 style="font-family:var(--font-heading); font-size:2.2rem; font-weight:800; margin-bottom:8px;">${item.name}</h2>
            <div style="font-size:1.1rem; color:var(--text-muted); font-style:italic; margin-bottom:24px;">
              ${item.latin_name ? `Latin: ${item.latin_name}` : 'No Latin Name recorded'} 
              ${item.common_name ? ` | Common: ${item.common_name}` : ''}
            </div>

            <div style="margin-bottom:24px;">
              <h4 style="font-family:var(--font-heading); font-weight:600; margin-bottom:8px;">Remedy Description</h4>
              <p style="font-size:0.95rem; line-height:1.6; color:var(--text-secondary);">${item.description || 'No description recorded.'}</p>
            </div>

            <div style="margin-bottom:24px;">
              <h4 style="font-family:var(--font-heading); font-weight:600; margin-bottom:8px;">Storage Instructions</h4>
              <p style="font-size:0.95rem; line-height:1.6; color:var(--text-secondary);">${item.storage_instructions || 'Standard cool, dry storage away from sunlight and strong aromatic odors.'}</p>
            </div>

            <div>
              <h4 style="font-family:var(--font-heading); font-weight:600; margin-bottom:8px;">Remedy Notes</h4>
              <p style="font-size:0.95rem; line-height:1.6; color:var(--text-secondary);">${item.notes || 'No custom notes.'}</p>
            </div>
          </div>

          <!-- Right Sidebar Side -->
          <div style="display:flex; flex-direction:column; gap:20px;">
            <!-- Specs Info Card -->
            <div class="reusable-card">
              <h3 style="font-family:var(--font-heading); font-size:1.15rem; font-weight:600; margin-bottom:20px;">Classification</h3>
              
              <div class="info-label">Cabinet Short Name</div>
              <div class="info-value">${item.short_name || 'N/A'}</div>

              <div class="info-label">Default Serving Form</div>
              <div class="info-value">${item.default_form_name || 'Globules'}</div>

              <div class="info-label">Minimum Safety Stock</div>
              <div class="info-value">${item.min_stock} units</div>
            </div>

            <!-- Potencies Linked Card -->
            <div class="reusable-card">
              <h3 style="font-family:var(--font-heading); font-size:1.15rem; font-weight:600; margin-bottom:16px;">Available Potencies</h3>
              <div class="tag-container">
                ${item.potencies && item.potencies.length > 0 
                  ? item.potencies.map(p => `<span class="tag-badge">${p.name}</span>`).join('')
                  : '<span class="text-secondary" style="font-size:0.85rem;">No potencies mapped.</span>'
                }
              </div>
            </div>

            <!-- Manufacturers Linked Card -->
            <div class="reusable-card">
              <h3 style="font-family:var(--font-heading); font-size:1.15rem; font-weight:600; margin-bottom:16px;">Trusted Laboratories</h3>
              <div class="tag-container">
                ${item.manufacturers && item.manufacturers.length > 0 
                  ? item.manufacturers.map(m => `<span class="tag-badge" style="color:var(--secondary);">${m.name}</span>`).join('')
                  : '<span class="text-secondary" style="font-size:0.85rem;">No manufacturers linked.</span>'
                }
              </div>
            </div>

            <!-- Aliases Linked Card -->
            <div class="reusable-card">
              <h3 style="font-family:var(--font-heading); font-size:1.15rem; font-weight:600; margin-bottom:16px;">Aliases & Keywords</h3>
              <div class="tag-container">
                ${item.aliases && item.aliases.length > 0 
                  ? item.aliases.map(a => `<span class="tag-badge" style="color:var(--text-muted);">${a}</span>`).join('')
                  : '<span class="text-secondary" style="font-size:0.85rem;">No aliases recorded.</span>'
                }
              </div>
            </div>
          </div>

        </div>
      `;
    }
  }

  /* =========================================================================
   * 3. IMPORT PAGE INITIALIZER
   * ========================================================================= */
  class MedicineImport {
    constructor() {
      this.dropzone = document.getElementById('import-dropzone');
      this.fileInput = document.getElementById('import-file-input');
      this.progressCard = document.getElementById('import-progress-card');
      this.summaryCard = document.getElementById('import-summary-card');
      this.errorsCard = document.getElementById('import-errors-card');
      this.selectedFileName = document.getElementById('selected-file-name');

      if (this.dropzone) {
        this.init();
      }
    }

    init() {
      // Drag/Drop Listeners
      ['dragenter', 'dragover'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          this.dropzone.classList.add('dragover');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          this.dropzone.classList.remove('dragover');
        }, false);
      });

      this.dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
          this.handleFileSelect(files[0]);
        }
      });

      this.dropzone.addEventListener('click', () => this.fileInput.click());
      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelect(e.target.files[0]);
        }
      });

      // Submit Form Handler
      document.getElementById('import-action-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.executeImport();
      });
    }

    handleFileSelect(file) {
      this.selectedFile = file;
      this.selectedFileName.innerText = `Selected File: ${file.name} (${Math.round(file.size / 1024)} KB)`;
      
      // Toggle submit button state
      document.getElementById('btn-execute-import').disabled = false;
      
      // Hide logs from previous import
      this.progressCard.style.display = 'none';
      this.summaryCard.style.display = 'none';
      this.errorsCard.style.display = 'none';
    }

    executeImport() {
      if (!this.selectedFile) return;

      const reader = new FileReader();
      
      // Identify type (csv or json)
      const extension = this.selectedFile.name.split('.').pop().toLowerCase();
      if (!['csv', 'json'].includes(extension)) {
        window.core.toast.error('File Error', 'Only CSV or JSON files are supported.');
        return;
      }

      this.progressCard.style.display = 'block';
      document.getElementById('btn-execute-import').disabled = true;

      reader.onload = async (e) => {
        const textContent = e.target.result;
        
        try {
          // Post file contents
          const res = await window.core.api.post('/api/import/medicines', {
            fileContent: textContent,
            fileType: extension
          });

          this.renderSummary(res.data, true);
        } catch (err) {
          // Check if it's a validation error list (status 422)
          if (err.status === 422 && err.data && err.data.data) {
            this.renderSummary(err.data.data, false);
          } else {
            this.progressCard.style.display = 'none';
            document.getElementById('btn-execute-import').disabled = false;
          }
        }
      };

      reader.readAsText(this.selectedFile);
    }

    renderSummary(data, success) {
      this.progressCard.style.display = 'none';
      
      // Display Summary Cards
      this.summaryCard.style.display = 'block';
      this.summaryCard.innerHTML = `
        <h3 style="font-family:var(--font-heading);font-weight:600;margin-bottom:15px;">Import Summary Results</h3>
        <p style="font-size:0.95rem;margin-bottom:8px;">Status: <span style="font-weight:bold;color:${success ? 'var(--success)' : 'var(--danger)'};">${success ? 'Successful Commit' : 'Rolled Back'}</span></p>
        <p style="font-size:0.95rem;margin-bottom:8px;">Total Records Processed: ${data.totalRecordsProcessed}</p>
        <p style="font-size:0.95rem;margin-bottom:8px;">Successfully Created: ${data.successCount}</p>
        <p style="font-size:0.95rem;margin-bottom:8px;">Duplicates Ignored: ${data.duplicateCount}</p>
        <p style="font-size:0.95rem;margin-bottom:8px;">Skipped / Malformed: ${data.skippedCount}</p>
      `;

      // If validation errors exist, render the list
      if (data.errors && data.errors.length > 0) {
        this.errorsCard.style.display = 'block';
        const errorListContainer = document.getElementById('validation-error-list');
        errorListContainer.innerHTML = '';
        
        data.errors.forEach(err => {
          const li = document.createElement('li');
          li.className = 'error-list-item';
          li.innerHTML = `
            <div style="font-weight:600;color:var(--danger);">Row ${err.row}: Remedy [${err.medicineName}]</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);">${err.reasons.join('<br>')}</div>
          `;
          errorListContainer.appendChild(li);
        });
      }
    }
  }

  // Load and mount catalog objects
  document.addEventListener('DOMContentLoaded', () => {
    window.medicineCatalog = new MedicineCatalog();
    window.medicineDetails = new MedicineDetails();
    window.medicineImport = new MedicineImport();
    window.medicineEditor = new MedicineEditor();
  });

})();
