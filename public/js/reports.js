/**
 * HomeoVault - Reports & Export Client Coordinator
 */

(function () {
  'use strict';

  class ReportViewer {
    constructor() {
      this.tableHeader = document.getElementById('report-table-header');
      this.tableBody = document.getElementById('report-table-body');
      this.paginationContainer = document.getElementById('report-pagination');
      this.filtersForm = document.getElementById('report-filters-form');
      this.dynamicFiltersContainer = document.getElementById('dynamic-filters-container');
      
      this.reportTitle = document.getElementById('report-viewer-title');
      this.printTitle = document.getElementById('print-viewer-title');
      this.printOperator = document.getElementById('print-operator-name');

      this.currentType = null;
      this.params = { page: 1, limit: 20 };
      this.columns = [];

      if (this.tableBody) {
        this.init();
      }
    }

    async init() {
      const urlParams = new URLSearchParams(window.location.search);
      this.currentType = urlParams.get('type');

      if (!this.currentType) {
        window.location.href = '/reports.html';
        return;
      }

      // Configure titles
      const formattedTitle = this._formatReportTitle(this.currentType);
      this.reportTitle.innerText = formattedTitle;
      this.printTitle.innerText = formattedTitle;

      // Identify active user to log print operator
      try {
        const profile = await window.core.api.get('/api/users/profile', {}, false);
        this.printOperator.innerText = `${profile.data.first_name} ${profile.data.last_name}`;
      } catch (err) {
        this.printOperator.innerText = 'HomeoVault Cabinet Operator';
      }

      // Configure columns mapping
      this.columns = this._getColumnDefinitions(this.currentType);

      // Render Dynamic Filters panel
      this._renderFiltersPanel(this.currentType);

      // Wire filters submit
      this.filtersForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.params.page = 1;
        this.fetchReport();
      });

      // Wire Export buttons
      document.getElementById('btn-export-csv').addEventListener('click', () => this.executeExport('csv'));
      document.getElementById('btn-export-excel').addEventListener('click', () => this.executeExport('excel'));
      document.getElementById('btn-export-pdf').addEventListener('click', () => this.executeExport('pdf'));
      
      // Wire Print button
      document.getElementById('btn-print-report').addEventListener('click', () => window.print());

      // Fetch initial data
      this.fetchReport();
    }

    async fetchReport() {
      try {
        // Collect filters from active form elements
        const filters = this._collectFormFilters();
        const requestParams = {
          ...this.params,
          ...filters
        };

        const res = await window.core.api.get(`/api/reports/${this.currentType}`, requestParams);
        
        this.renderHeaders(this.columns);
        this.renderRows(res.data.records, this.columns);

        if (res.data.totalRecords > 0) {
          const totalPages = Math.ceil(res.data.totalRecords / this.params.limit);
          window.core.ui.renderPagination('report-pagination', {
            page: this.params.page,
            totalPages,
            totalRecords: res.data.totalRecords,
            onPageChange: (newPage) => {
              this.params.page = newPage;
              this.fetchReport();
            }
          });
        } else {
          this.paginationContainer.innerHTML = '';
        }
      } catch (err) {
        this.tableBody.innerHTML = `<tr><td colspan="${this.columns.length}" style="text-align:center;color:var(--danger);">Failed to retrieve report records.</td></tr>`;
      }
    }

    renderHeaders(cols) {
      this.tableHeader.innerHTML = '';
      const tr = document.createElement('tr');
      cols.forEach(c => {
        tr.innerHTML += `<th>${c.title}</th>`;
      });
      this.tableHeader.appendChild(tr);
    }

    renderRows(records, cols) {
      if (!records || records.length === 0) {
        this.tableBody.innerHTML = `<tr><td colspan="${cols.length}" style="text-align:center;">No records match the filter criteria.</td></tr>`;
        return;
      }

      this.tableBody.innerHTML = '';
      records.forEach(row => {
        const tr = document.createElement('tr');
        cols.forEach(col => {
          let val = row[col.key];
          if (val === undefined || val === null) val = '';
          
          // Formatters
          if (col.key === 'transaction_date' || col.key === 'created_at' || col.key === 'last_updated') {
            val = new Date(val).toLocaleString();
          } else if (col.key === 'expiry_date') {
            val = new Date(val).toLocaleDateString();
          } else if (col.key === 'purchase_price' || col.key === 'mrp' || col.key === 'total_cost_value' || col.key === 'total_mrp_value') {
            val = `$${parseFloat(val).toFixed(2)}`;
          }

          tr.innerHTML += `<td>${val}</td>`;
        });
        this.tableBody.appendChild(tr);
      });
    }

    async executeExport(format) {
      const filters = this._collectFormFilters();
      const payload = {
        reportType: this.currentType,
        title: this._formatReportTitle(this.currentType),
        filters,
        columns: this.columns
      };

      try {
        window.core.loader.show();
        
        const response = await fetch(`/api/export/${format}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Export request returned error.');
        }

        const blob = await response.blob();
        
        // Parse filename from Content-Disposition header
        const disposition = response.headers.get('content-disposition');
        let filename = `${this.currentType}_report_${Date.now()}.${format === 'excel' ? 'xls' : format}`;
        if (disposition && disposition.indexOf('filename=') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) { 
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // Trigger browser download prompt
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.core.toast.success('Exported', `Successfully downloaded report in ${format.toUpperCase()} format.`);
      } catch (err) {
        window.core.toast.error('Export Error', 'Cannot generate file exports.');
      } finally {
        window.core.loader.hide();
      }
    }

    _collectFormFilters() {
      const filters = {};
      const startEl = document.getElementById('filter-start-date');
      const endEl = document.getElementById('filter-end-date');
      const catEl = document.getElementById('filter-category');
      const locEl = document.getElementById('filter-location');
      const spltEl = document.getElementById('filter-supplier');
      const typeEl = document.getElementById('filter-tx-type');
      const expEl = document.getElementById('filter-expiry-status');
      const searchEl = document.getElementById('filter-search');

      if (startEl && startEl.value) filters.startDate = startEl.value;
      if (endEl && endEl.value) filters.endDate = endEl.value;
      if (catEl && catEl.value) filters.category_id = catEl.value;
      if (locEl && locEl.value) filters.location_id = locEl.value;
      if (spltEl && spltEl.value) filters.supplier_id = spltEl.value;
      if (typeEl && typeEl.value) filters.transaction_type = typeEl.value;
      if (expEl && expEl.value) filters.expiryStatus = expEl.value;
      if (searchEl && searchEl.value.trim()) filters.search = searchEl.value.trim();

      return filters;
    }

    _formatReportTitle(type) {
      switch (type) {
        case 'inventory': return 'Current Inventory Report';
        case 'stock-in': return 'Stock Inward Ledger Report';
        case 'stock-out': return 'Stock Outward Ledger Report';
        case 'expiry': return 'Batch Expiration Ledger Report';
        case 'low-stock': return 'Low Stock Alerts Report';
        case 'out-of-stock': return 'Out Of Stock Alerts Report';
        case 'valuation': return 'Inventory Assets Valuation Report';
        case 'activity': return 'System User Activities Report';
        default: return 'HomeoVault Master Report';
      }
    }

    _getColumnDefinitions(type) {
      switch (type) {
        case 'inventory':
          return [
            { key: 'medicine_name', title: 'Medicine Name' },
            { key: 'potency_name', title: 'Potency' },
            { key: 'category_name', title: 'Category' },
            { key: 'current_quantity', title: 'Balance' },
            { key: 'minimum_quantity', title: 'Min Qty' },
            { key: 'reorder_level', title: 'Reorder Level' },
            { key: 'location_name', title: 'Cabinet Location' }
          ];
        case 'stock-in':
          return [
            { key: 'transaction_date', title: 'Date' },
            { key: 'medicine_name', title: 'Medicine Name' },
            { key: 'potency_name', title: 'Potency' },
            { key: 'batch_number', title: 'Batch' },
            { key: 'quantity', title: 'Qty In' },
            { key: 'reference_number', title: 'Ref Number' },
            { key: 'supplier_name', title: 'Supplier' },
            { key: 'operator_name', title: 'Operator' },
            { key: 'remarks', title: 'Remarks' }
          ];
        case 'stock-out':
          return [
            { key: 'transaction_date', title: 'Date' },
            { key: 'medicine_name', title: 'Medicine Name' },
            { key: 'potency_name', title: 'Potency' },
            { key: 'batch_number', title: 'Batch' },
            { key: 'quantity', title: 'Qty Out' },
            { key: 'reference_number', title: 'Ref Number' },
            { key: 'operator_name', title: 'Operator' },
            { key: 'remarks', title: 'Remarks' }
          ];
        case 'expiry':
          return [
            { key: 'medicine_name', title: 'Medicine Name' },
            { key: 'potency_name', title: 'Potency' },
            { key: 'batch_number', title: 'Batch Code' },
            { key: 'expiry_date', title: 'Expiry Date' },
            { key: 'available_quantity', title: 'Available' },
            { key: 'location_name', title: 'Cabinet' },
            { key: 'status', title: 'Status' }
          ];
        case 'low-stock':
        case 'out-of-stock':
          return [
            { key: 'medicine_name', title: 'Medicine Name' },
            { key: 'potency_name', title: 'Potency' },
            { key: 'category_name', title: 'Category' },
            { key: 'current_quantity', title: 'Balance' },
            { key: 'minimum_quantity', title: 'Min Stock' },
            { key: 'location_name', title: 'Cabinet' }
          ];
        case 'valuation':
          return [
            { key: 'medicine_name', title: 'Medicine Name' },
            { key: 'potency_name', title: 'Potency' },
            { key: 'batch_number', title: 'Batch' },
            { key: 'available_quantity', title: 'Qty' },
            { key: 'purchase_price', title: 'Purchase Cost' },
            { key: 'mrp', title: 'MRP' },
            { key: 'total_cost_value', title: 'Cost Value' },
            { key: 'total_mrp_value', title: 'MRP Value' },
            { key: 'location_name', title: 'Cabinet' }
          ];
        case 'activity':
          return [
            { key: 'created_at', title: 'Date & Time' },
            { key: 'operator_name', title: 'Operator' },
            { key: 'action', title: 'Action' },
            { key: 'details', title: 'Audit Details' }
          ];
        default:
          return [];
      }
    }

    async _renderFiltersPanel(type) {
      this.dynamicFiltersContainer.innerHTML = '';

      // 1. Date Range filters (for transactional/logs reports)
      if (['stock-in', 'stock-out', 'activity'].includes(type)) {
        this.dynamicFiltersContainer.innerHTML += `
          <div class="form-group">
            <label class="form-label" style="display:block;margin-bottom:8px;">Start Date</label>
            <input type="date" id="filter-start-date" class="material-input">
          </div>
          <div class="form-group">
            <label class="form-label" style="display:block;margin-bottom:8px;">End Date</label>
            <input type="date" id="filter-end-date" class="material-input">
          </div>
        `;
      }

      // 2. Search input (for inventory queries)
      if (['inventory'].includes(type)) {
        this.dynamicFiltersContainer.innerHTML += `
          <div class="form-group">
            <label class="form-label" style="display:block;margin-bottom:8px;">Remedy Name</label>
            <input type="text" id="filter-search" class="material-input" placeholder="Type remedy name...">
          </div>
        `;
      }

      // 3. Category & Location selects (for inventory / expiry reports)
      if (['inventory', 'expiry'].includes(type)) {
        this.dynamicFiltersContainer.innerHTML += `
          <div class="form-group">
            <label class="form-label" style="display:block;margin-bottom:8px;">Category</label>
            <select class="material-select" id="filter-category">
              <option value="">-- All Categories --</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="display:block;margin-bottom:8px;">Cabinet Storage</label>
            <select class="material-select" id="filter-location">
              <option value="">-- All Cabinet storage --</option>
            </select>
          </div>
        `;

        // Populate selects
        try {
          const [catsRes, locsRes] = await Promise.all([
            window.core.api.get('/api/categories', {}, false),
            window.core.api.get('/api/locations', {}, false)
          ]);
          
          const catSelect = document.getElementById('filter-category');
          const locSelect = document.getElementById('filter-location');

          if (catSelect && catsRes.data) {
            catsRes.data.forEach(c => catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);
          }
          if (locSelect && locsRes.data) {
            locsRes.data.forEach(l => locSelect.innerHTML += `<option value="${l.id}">${l.name}</option>`);
          }
        } catch (err) {
          console.error(err);
        }
      }

      // 4. Expiry status selector
      if (type === 'expiry') {
        this.dynamicFiltersContainer.innerHTML += `
          <div class="form-group">
            <label class="form-label" style="display:block;margin-bottom:8px;">Expiry Status</label>
            <select class="material-select" id="filter-expiry-status">
              <option value="">-- All Expiring --</option>
              <option value="expired">Expired Lots</option>
              <option value="expiring_30">Expiring 30 Days</option>
              <option value="expiring_90">Expiring 90 Days</option>
            </select>
          </div>
        `;
      }
    }
  }

  // Load and mount reports
  document.addEventListener('DOMContentLoaded', () => {
    window.reportViewer = new ReportViewer();
  });

})();
