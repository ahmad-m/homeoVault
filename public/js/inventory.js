/**
 * HomeoVault - Inventory Client Coordinator
 */

(function () {
  'use strict';

  class InventoryCatalog {
    constructor() {
      this.tableBody = document.getElementById('inventory-table-body');
      this.paginationContainer = document.getElementById('inventory-pagination');
      
      this.params = {
        page: 1,
        limit: 10,
        q: '',
        category_id: '',
        location_id: '',
        status: ''
      };

      if (this.tableBody) {
        this.init();
      }
    }

    async init() {
      // Setup Filters selectors
      const catFilter = document.getElementById('filter-category');
      const locFilter = document.getElementById('filter-location');
      const statusFilter = document.getElementById('filter-status');
      const searchForm = document.getElementById('inventory-search-form');

      if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.params.q = document.getElementById('inventory-search-input').value.trim();
          this.params.page = 1;
          this.fetchList();
        });
      }

      // Populate filter dropdowns
      try {
        const [catsRes, locsRes] = await Promise.all([
          window.core.api.get('/api/categories', {}, false),
          window.core.api.get('/api/locations', {}, false)
        ]);

        if (catFilter && catsRes.data) {
          catsRes.data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = c.name;
            catFilter.appendChild(opt);
          });
          catFilter.addEventListener('change', (e) => {
            this.params.category_id = e.target.value;
            this.params.page = 1;
            this.fetchList();
          });
        }

        if (locFilter && locsRes.data) {
          locsRes.data.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = l.name;
            locFilter.appendChild(opt);
          });
          locFilter.addEventListener('change', (e) => {
            this.params.location_id = e.target.value;
            this.params.page = 1;
            this.fetchList();
          });
        }

        if (statusFilter) {
          statusFilter.addEventListener('change', (e) => {
            this.params.status = e.target.value;
            this.params.page = 1;
            this.fetchList();
          });
        }
      } catch (err) {
        console.error('Failed loading filter selections', err);
      }

      this.fetchList();
    }

    async fetchList() {
      try {
        const res = await window.core.api.get('/api/inventory', this.params);
        this.render(res.data.records);

        if (res.data.totalRecords > 0) {
          const totalPages = Math.ceil(res.data.totalRecords / this.params.limit);
          window.core.ui.renderPagination('inventory-pagination', {
            page: this.params.page,
            totalPages,
            totalRecords: res.data.totalRecords,
            onPageChange: (newPage) => {
              this.params.page = newPage;
              this.fetchList();
            }
          });
        } else {
          this.paginationContainer.innerHTML = '';
        }
      } catch (err) {
        this.tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--danger);">Failed to retrieve stock balances.</td></tr>';
      }
    }

    render(records) {
      if (!records || records.length === 0) {
        this.tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No stock entries matches your search filters.</td></tr>';
        return;
      }

      this.tableBody.innerHTML = '';
      records.forEach(item => {
        let badgeClass = 'badge-stock-in-stock';
        let statusText = 'In Stock';
        
        if (item.current_quantity === 0) {
          badgeClass = 'badge-stock-out';
          statusText = 'Out of Stock';
        } else if (item.current_quantity <= item.reorder_level) {
          badgeClass = 'badge-stock-low';
          statusText = 'Low Stock';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;color:var(--text-primary);">${item.medicine_name}</td>
          <td>${item.potency_name}</td>
          <td>${item.category_name}</td>
          <td style="font-weight:bold;">${item.current_quantity}</td>
          <td>${item.location_name || 'Unassigned'}</td>
          <td><span class="badge-stock ${badgeClass}">${statusText}</span></td>
          <td>
            <div style="display:flex;gap:8px;">
              <button class="reusable-btn reusable-btn-secondary" style="padding:4px 8px;font-size:0.75rem;" onclick="window.inventoryCatalog.showBatchesModal('${item.id}', '${item.medicine_name}')">Lots</button>
              <button class="reusable-btn reusable-btn-secondary" style="padding:4px 8px;font-size:0.75rem;color:var(--secondary);border-color:var(--secondary);" onclick="window.inventoryCatalog.showTransferModal('${item.id}', '${item.location_name || 'Unassigned'}')">Move</button>
            </div>
          </td>
        `;
        this.tableBody.appendChild(tr);
      });
    }

    async showBatchesModal(inventoryId, medicineName) {
      try {
        const res = await window.core.api.get(`/api/inventory/${inventoryId}`);
        const batches = res.data.batches || [];
        
        let bodyHtml = `
          <div class="table-responsive">
            <table class="reusable-table" style="font-size:0.82rem;">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th>Quantity</th>
                  <th>Supplier</th>
                  <th>Adjust</th>
                </tr>
              </thead>
              <tbody>
                ${batches.map(b => `
                  <tr>
                    <td>${b.batch_number}</td>
                    <td>${new Date(b.expiry_date).toLocaleDateString()}</td>
                    <td style="font-weight:bold;">${b.available_quantity}</td>
                    <td>${b.supplier_name || 'N/A'}</td>
                    <td>
                      <button class="reusable-btn reusable-btn-primary" style="padding:2px 6px;font-size:0.7rem;" onclick="window.inventoryCatalog.adjustBatchStock('${b.id}', ${b.available_quantity})">Set</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        
        if (batches.length === 0) {
          bodyHtml = '<p class="text-secondary" style="text-align:center;">No active batch lots available.</p>';
        }

        window.core.dialog.confirm({
          title: `Active Batches: ${medicineName}`,
          message: bodyHtml,
          confirmText: 'Done',
          cancelText: 'Close',
          onConfirm: () => {}
        });
      } catch (err) {
        window.core.toast.error('Load Error', 'Cannot fetch batches.');
      }
    }

    async adjustBatchStock(batchId, currentQty) {
      const newQtyStr = prompt(`Enter adjusted stock level for this lot (Current: ${currentQty}):`, currentQty);
      if (newQtyStr === null || newQtyStr === '') return;

      const newQty = parseInt(newQtyStr, 10);
      if (isNaN(newQty) || newQty < 0) {
        window.core.toast.error('Validation Error', 'Quantity must be a positive number.');
        return;
      }

      try {
        await window.core.api.post('/api/inventory/adjust', {
          inventory_batch_id: batchId,
          new_quantity: newQty,
          remarks: 'Manual grid override count adjustment.'
        });
        window.core.toast.success('Saved', 'Batch stock levels adjusted.');
        this.fetchList();
      } catch (err) {
        console.error(err);
      }
    }

    async showTransferModal(inventoryId, currentLocation) {
      try {
        const res = await window.core.api.get('/api/locations', {}, false);
        const locations = res.data || [];

        if (locations.length === 0) {
          window.core.toast.warn('No Locations', 'No cabinet storage locations found. Please add a location first.');
          return;
        }

        const selectHtml = `
          <div class="material-form-group" style="margin-top:16px;">
            <label class="form-label" style="display:block;margin-bottom:8px;">Current Cabinet: <strong>${currentLocation}</strong></label>
            <select class="material-select" id="transfer-location-select">
              <option value="">-- Choose Cabinet Location --</option>
              ${locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
            </select>
          </div>
        `;

        window.core.dialog.confirm({
          title: 'Transfer Cabinet Storage',
          message: `Select target storage drawer location: ${selectHtml}`,
          confirmText: 'Execute Transfer',
          onConfirm: async () => {
            const newLocId = document.getElementById('transfer-location-select').value;
            if (!newLocId) {
              window.core.toast.warn('Validation', 'Please select a target cabinet location.');
              return;
            }

            try {
              await window.core.api.post('/api/inventory/transfer', {
                inventory_id: inventoryId,
                new_location_id: newLocId
              });
              window.core.toast.success('Transferred', 'Cabinet default location modified.');
              this.fetchList();
            } catch (err) {
              const msg = err?.data?.message || 'Transfer request failed. Please try again.';
              window.core.toast.error('Transfer Failed', msg);
              console.error('Transfer error:', err);
            }
          }
        });
      } catch (err) {
        window.core.toast.error('Load Error', 'Cannot load cabinet lists.');
        console.error('Load locations error:', err);
      }
    }
  }

  /* =========================================================================
   * 2. STOCK IN PAGE INITIALIZER
   * ========================================================================= */
  class StockInManager {
    constructor() {
      this.form = document.getElementById('stock-in-form');
      this.medInput = document.getElementById('med-autocomplete-input');
      this.medDropdown = document.getElementById('med-autocomplete-dropdown');
      
      this.selectedMed = null;
      this.debounceTimer = null;
      this.lastQuery = '';

      if (this.form) {
        this.init();
      }
    }

    init() {
      // Autocomplete events
      this.medInput.addEventListener('input', () => {
        clearTimeout(this.debounceTimer);
        const query = this.medInput.value.trim();
        this.lastQuery = query;
        if (query.length < 2) {
          this.medDropdown.style.display = 'none';
          return;
        }
        this.debounceTimer = setTimeout(() => this.searchMedicines(query), 300);
      });

      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        if (!this.medInput.contains(e.target) && !this.medDropdown.contains(e.target)) {
          this.medDropdown.style.display = 'none';
        }
      });

      // Populate Suppliers and Cabinet lists
      this.loadSelectionDropdowns();

      // Submit Form
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async searchMedicines(query) {
      try {
        const res = await window.core.api.get('/api/medicines/search', { q: query, autocomplete: 'true' }, false);
        this.renderDropdown(res.data, query);
      } catch (err) {
        console.error(err);
      }
    }

    renderDropdown(items, query) {
      this.medDropdown.innerHTML = '';

      if (items && items.length > 0) {
        // Render matching results
        items.forEach(med => {
          const div = document.createElement('div');
          div.className = 'autocomplete-item';
          div.innerHTML = `<strong>${med.name}</strong> <span style="color:var(--text-muted);font-size:0.82rem;">${med.latin_name || ''}</span>`;
          div.addEventListener('click', () => {
            this.medInput.value = med.name;
            this.medDropdown.style.display = 'none';
            this.selectedMed = med;
            this.loadPotencies(med.id);
            this.hideQuickAddPanel();
          });
          this.medDropdown.appendChild(div);
        });
      } else {
        // No results — show info + Quick Add option
        const noResult = document.createElement('div');
        noResult.style.cssText = 'padding:10px 14px;color:var(--text-muted);font-size:0.85rem;border-bottom:1px solid var(--border);';
        noResult.innerText = `No remedy found for "${query}"`;
        this.medDropdown.appendChild(noResult);

        const addDiv = document.createElement('div');
        addDiv.className = 'autocomplete-item';
        addDiv.style.cssText = 'color:var(--primary);font-weight:600;display:flex;align-items:center;gap:8px;padding:10px 14px;';
        addDiv.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Add "<strong style="color:var(--primary);">${query}</strong>" as new medicine
        `;
        addDiv.addEventListener('click', () => {
          this.medDropdown.style.display = 'none';
          this.showQuickAddPanel(query);
        });
        this.medDropdown.appendChild(addDiv);
      }

      this.medDropdown.style.display = 'block';
    }

    showQuickAddPanel(name) {
      this.hideQuickAddPanel();

      const panel = document.createElement('div');
      panel.id = 'quick-add-panel';
      panel.style.cssText = [
        'background:linear-gradient(135deg,rgba(16,185,129,0.06),rgba(99,102,241,0.04))',
        'border:1.5px solid var(--primary)',
        'border-radius:12px',
        'padding:20px',
        'margin-top:16px'
      ].join(';');
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <div>
            <div style="font-family:var(--font-heading);font-weight:700;font-size:1.05rem;color:var(--primary);">➕ Quick Add to Catalog</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:3px;">Add this remedy to the catalog, then continue with stock-in</div>
          </div>
          <button type="button" id="close-quick-add" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.4rem;line-height:1;padding:0 4px;">&times;</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
          <div>
            <label class="form-label" style="display:block;margin-bottom:6px;font-weight:600;">Medicine Name *</label>
            <input type="text" id="qa-medicine-name" class="material-input" value="${name}" placeholder="e.g. Abrotanum">
          </div>
          <div>
            <label class="form-label" style="display:block;margin-bottom:6px;font-weight:600;">Category *</label>
            <select class="material-select" id="qa-category-select">
              <option value="">-- Loading... --</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom:18px;">
          <label class="form-label" style="display:block;margin-bottom:10px;font-weight:600;">Potencies * <span style="font-size:0.78rem;color:var(--text-muted);font-weight:400;">(select all that apply)</span></label>
          <div id="qa-potency-checkboxes" style="display:flex;flex-wrap:wrap;gap:8px;">
            <span style="color:var(--text-muted);font-size:0.85rem;">Loading potencies...</span>
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button type="button" id="cancel-quick-add" class="reusable-btn reusable-btn-secondary" style="padding:8px 16px;">Cancel</button>
          <button type="button" id="submit-quick-add" class="reusable-btn reusable-btn-primary" style="padding:8px 22px;">Add to Catalog &amp; Continue</button>
        </div>
      `;

      const searchContainer = this.medInput.closest('.search-container');
      searchContainer.insertAdjacentElement('afterend', panel);

      document.getElementById('close-quick-add').addEventListener('click', () => this.hideQuickAddPanel());
      document.getElementById('cancel-quick-add').addEventListener('click', () => this.hideQuickAddPanel());
      document.getElementById('submit-quick-add').addEventListener('click', () => this.submitQuickAdd());

      this.loadQuickAddOptions();
    }

    hideQuickAddPanel() {
      const existing = document.getElementById('quick-add-panel');
      if (existing) existing.remove();
    }

    async loadQuickAddOptions() {
      try {
        const [catsRes, potsRes] = await Promise.all([
          window.core.api.get('/api/categories', {}, false),
          window.core.api.get('/api/potencies', {}, false)
        ]);

        const catSelect = document.getElementById('qa-category-select');
        if (catSelect && catsRes.data) {
          catSelect.innerHTML = '<option value="">-- Choose Category --</option>';
          catsRes.data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = c.name;
            if (c.name === 'Single Remedy') opt.selected = true;
            catSelect.appendChild(opt);
          });
        }

        const container = document.getElementById('qa-potency-checkboxes');
        if (container && potsRes.data) {
          container.innerHTML = '';
          potsRes.data.forEach(p => {
            const label = document.createElement('label');
            label.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;cursor:pointer;font-size:0.82rem;font-weight:500;border:1.5px solid var(--border);transition:all 0.15s;user-select:none;';
            label.innerHTML = `<input type="checkbox" value="${p.id}" style="width:13px;height:13px;"> ${p.name}`;
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
        console.error('Failed to load quick-add options:', err);
        window.core.toast.error('Error', 'Failed to load categories/potencies.');
      }
    }

    async submitQuickAdd() {
      const name = document.getElementById('qa-medicine-name')?.value?.trim();
      const category_id = document.getElementById('qa-category-select')?.value;
      const checked = document.querySelectorAll('#qa-potency-checkboxes input[type="checkbox"]:checked');
      const potency_ids = Array.from(checked).map(cb => cb.value);

      if (!name) { window.core.toast.warn('Validation', 'Medicine name is required.'); return; }
      if (!category_id) { window.core.toast.warn('Validation', 'Please select a category.'); return; }
      if (potency_ids.length === 0) { window.core.toast.warn('Validation', 'Select at least one potency.'); return; }

      const btn = document.getElementById('submit-quick-add');
      btn.disabled = true;
      btn.innerText = 'Adding...';

      try {
        const res = await window.core.api.post('/api/medicines/quick-add', { name, category_id, potency_ids });
        const medicine = res.data;

        window.core.toast.success('Added!', `"${medicine.name}" added with ${medicine.potencies.length} potencies. Now choose the potency below.`);

        // Auto-fill medicine input and select it
        this.medInput.value = medicine.name;
        this.selectedMed = medicine;
        this.hideQuickAddPanel();

        // Load potencies into potency dropdown
        await this.loadPotencies(medicine.id);
      } catch (err) {
        const msg = err?.data?.message || 'Failed to add medicine.';
        window.core.toast.error('Add Failed', msg);
        if (btn) { btn.disabled = false; btn.innerText = 'Add to Catalog & Continue'; }
      }
    }

    async loadPotencies(medicineId) {
      const potencySelect = document.getElementById('potency_select');
      potencySelect.innerHTML = '<option value="">-- Loading Potencies --</option>';

      try {
        // The medicine details API returns potencies with mp.id (medicine_potency_id) as `id`
        const res = await window.core.api.get(`/api/medicines/${medicineId}`, {}, false);
        potencySelect.innerHTML = '<option value="">-- Choose Potency --</option>';

        if (res.data.potencies && res.data.potencies.length > 0) {
          res.data.potencies.forEach(p => {
            const opt = document.createElement('option');
            // p.id = mp.id from medicine_potencies table (medicine_potency_id)
            opt.value = p.id;
            opt.innerText = p.name;
            potencySelect.appendChild(opt);
          });
        } else {
          potencySelect.innerHTML = '<option value="">-- No Potencies Mapped --</option>';
        }
      } catch (err) {
        console.error('Failed to load potencies:', err);
        potencySelect.innerHTML = '<option value="">-- Failed to load --</option>';
      }
    }

    async loadSelectionDropdowns() {
      const supplierSelect = document.getElementById('supplier_select');
      const locationSelect = document.getElementById('location_select');

      try {
        const [mfrsRes, locsRes] = await Promise.all([
          window.core.api.get('/api/suppliers', {}, false),
          window.core.api.get('/api/locations', {}, false)
        ]);

        if (supplierSelect && mfrsRes.data) {
          mfrsRes.data.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.innerText = s.name;
            supplierSelect.appendChild(opt);
          });
        }

        if (locationSelect && locsRes.data) {
          locsRes.data.forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.innerText = l.name;
            locationSelect.appendChild(opt);
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    async handleSubmit(e) {
      e.preventDefault();

      if (!this.selectedMed) {
        window.core.toast.warn('Validation', 'Please search and select a remedy first.');
        return;
      }

      const potencyId = document.getElementById('potency_select').value;
      if (!potencyId) {
        window.core.toast.warn('Validation', 'Please select a potency for this remedy.');
        return;
      }
      
      const payload = {
        medicine_potency_id: potencyId,
        batch_number: document.getElementById('batch_number').value.trim(),
        expiry_date: document.getElementById('expiry_date').value || null,
        purchase_price: Number(document.getElementById('purchase_price').value) || 0,
        mrp: Number(document.getElementById('mrp').value) || 0,
        supplier_id: document.getElementById('supplier_select').value || null,
        quantity: parseInt(document.getElementById('quantity').value, 10),
        default_location_id: document.getElementById('location_select').value || null,
        remarks: document.getElementById('remarks').value.trim()
      };

      try {
        await window.core.api.post('/api/inventory/stock-in', payload);
        window.core.toast.success('Completed', 'Remedy batch cataloged into stock inventory.');
        setTimeout(() => window.location.href = '/inventory.html', 1500);
      } catch (err) {
        const msg = err?.data?.message || 'Stock-in failed. Please check inputs.';
        window.core.toast.error('Error', msg);
        console.error(err);
      }
    }
  }

  // Define location modifications for potencies queries in repositories
  // Wait, let's also write a Stock Out page manager and History page manager inside this file!
  // That will make everything run. Let's write them:
  class StockOutManager {
    constructor() {
      this.form = document.getElementById('stock-out-form');
      this.medInput = document.getElementById('stockout-med-autocomplete');
      this.medDropdown = document.getElementById('stockout-med-dropdown');
      
      this.selectedMed = null;
      this.debounceTimer = null;

      if (this.form) {
        this.init();
      }
    }

    init() {
      this.medInput.addEventListener('input', () => {
        clearTimeout(this.debounceTimer);
        const query = this.medInput.value.trim();
        if (query.length < 2) {
          this.medDropdown.style.display = 'none';
          return;
        }
        this.debounceTimer = setTimeout(() => this.searchMedicines(query), 300);
      });

      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async searchMedicines(query) {
      try {
        const res = await window.core.api.get('/api/medicines/search', { q: query, autocomplete: 'true' }, false);
        this.renderDropdown(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    renderDropdown(items) {
      if (!items || items.length === 0) {
        this.medDropdown.style.display = 'none';
        return;
      }
      this.medDropdown.innerHTML = '';
      items.forEach(med => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.innerText = med.name;
        div.addEventListener('click', () => {
          this.medInput.value = med.name;
          this.medDropdown.style.display = 'none';
          this.selectedMed = med;
          this.loadBatches(med.id);
        });
        this.medDropdown.appendChild(div);
      });
      this.medDropdown.style.display = 'block';
    }

    async loadBatches(medicineId) {
      const batchSelect = document.getElementById('batch_select');
      batchSelect.innerHTML = '<option value="">-- Loading Active Lots --</option>';

      try {
        // Query inventory lists to find this medicine aggregates
        const res = await window.core.api.get('/api/inventory', { limit: 100 }, false);
        const items = res.data.records.filter(r => r.medicine_id === medicineId);
        
        batchSelect.innerHTML = '<option value="">-- Choose Batch Lot --</option>';
        
        for (const item of items) {
          const detailRes = await window.core.api.get(`/api/inventory/${item.id}`, {}, false);
          const batches = detailRes.data.batches || [];
          batches.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.innerText = `${item.potency_name} | Batch: ${b.batch_number} (Avail: ${b.available_quantity} units) - Exp: ${new Date(b.expiry_date).toLocaleDateString()}`;
            batchSelect.appendChild(opt);
          });
        }
      } catch (err) {
        batchSelect.innerHTML = '<option value="">-- Failed to load lots --</option>';
      }
    }

    async handleSubmit(e) {
      e.preventDefault();
      
      const payload = {
        inventory_batch_id: document.getElementById('batch_select').value,
        quantity: parseInt(document.getElementById('quantity').value, 10),
        remarks: document.getElementById('remarks').value.trim()
      };

      try {
        await window.core.api.post('/api/inventory/stock-out', payload);
        window.core.toast.success('Completed', 'Remedy batch quantity deducted successfully.');
        setTimeout(() => window.location.href = '/inventory.html', 1500);
      } catch (err) {
        console.error(err);
      }
    }
  }

  // History Manager
  class HistoryManager {
    constructor() {
      this.tableBody = document.getElementById('history-table-body');
      if (this.tableBody) {
        this.init();
      }
    }

    async init() {
      try {
        const res = await window.core.api.get('/api/inventory/history', { limit: 25 });
        this.render(res.data.records);
      } catch (err) {
        this.tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--danger);">Failed to load history logs.</td></tr>';
      }
    }

    render(records) {
      if (!records || records.length === 0) {
        this.tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No stock transactions logged yet.</td></tr>';
        return;
      }
      this.tableBody.innerHTML = '';
      records.forEach(tx => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(tx.transaction_date).toLocaleString()}</td>
          <td style="font-weight:600;color:var(--text-primary);">${tx.medicine_name}</td>
          <td>${tx.potency_name}</td>
          <td><span class="tx-indicator tx-${tx.transaction_type}">${tx.transaction_type}</span></td>
          <td style="font-weight:bold;">${Math.abs(tx.quantity)}</td>
          <td>${tx.batch_number}</td>
          <td>${tx.remarks || ''}</td>
        `;
        this.tableBody.appendChild(tr);
      });
    }
  }

  // Supplier & Location Creation Forms
  class SupplierManager {
    constructor() {
      this.form = document.getElementById('supplier-form');
      this.tableBody = document.getElementById('suppliers-table-body');
      if (this.tableBody) {
        this.init();
      }
    }

    async init() {
      if (this.form) {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      }
      this.fetchList();
    }

    async fetchList() {
      try {
        const res = await window.core.api.get('/api/suppliers', {}, false);
        this.render(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    render(records) {
      if (!records || records.length === 0) {
        this.tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No suppliers registered yet.</td></tr>';
        return;
      }
      this.tableBody.innerHTML = '';
      records.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;color:var(--text-primary);">${item.name}</td>
          <td>${item.contact_name || ''}</td>
          <td>${item.email || ''}</td>
          <td>${item.phone || ''}</td>
          <td>${item.address || ''}</td>
        `;
        this.tableBody.appendChild(tr);
      });
    }

    async handleSubmit(e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('supplier_name').value.trim(),
        contact_name: document.getElementById('contact_name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim()
      };

      try {
        await window.core.api.post('/api/suppliers', payload);
        window.core.toast.success('Registered', 'New supplier profile saved.');
        this.form.reset();
        this.fetchList();
      } catch (err) {
        console.error(err);
      }
    }
  }

  class LocationManager {
    constructor() {
      this.form = document.getElementById('location-form');
      this.tableBody = document.getElementById('locations-table-body');
      if (this.tableBody) {
        this.init();
      }
    }

    async init() {
      if (this.form) {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      }
      this.fetchList();
    }

    async fetchList() {
      try {
        const res = await window.core.api.get('/api/locations', {}, false);
        this.render(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    render(records) {
      if (!records || records.length === 0) {
        this.tableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No locations added yet.</td></tr>';
        return;
      }
      this.tableBody.innerHTML = '';
      records.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;color:var(--text-primary);">${item.name}</td>
          <td>${item.description || ''}</td>
        `;
        this.tableBody.appendChild(tr);
      });
    }

    async handleSubmit(e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('location_name').value.trim(),
        description: document.getElementById('description').value.trim()
      };

      try {
        await window.core.api.post('/api/locations', payload);
        window.core.toast.success('Saved', 'Cabinet location registered.');
        this.form.reset();
        this.fetchList();
      } catch (err) {
        console.error(err);
      }
    }
  }

  // Load and mount catalog objects
  document.addEventListener('DOMContentLoaded', () => {
    window.inventoryCatalog = new InventoryCatalog();
    window.stockInManager = new StockInManager();
    window.stockOutManager = new StockOutManager();
    window.historyManager = new HistoryManager();
    window.supplierManager = new SupplierManager();
    window.locationManager = new LocationManager();
  });

})();
