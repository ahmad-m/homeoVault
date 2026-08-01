/**
 * HomeoVault - Dashboard & Analytics Client Coordinator
 */

(function () {
  'use strict';

  class DashboardManager {
    constructor() {
      // KPI Elements
      this.elTotalMedicines = document.getElementById('kpi-total-medicines');
      this.elTotalItems = document.getElementById('kpi-total-items');
      this.elTotalStock = document.getElementById('kpi-total-stock');
      this.elLowStock = document.getElementById('kpi-low-stock');
      this.elOutOfStock = document.getElementById('kpi-out-of-stock');
      this.elExpired = document.getElementById('kpi-expired');
      this.elExpiring30 = document.getElementById('kpi-expiring-30');
      this.elTodayIn = document.getElementById('kpi-today-in');
      this.elTodayOut = document.getElementById('kpi-today-out');
      this.elSuppliers = document.getElementById('kpi-suppliers');
      this.elCategories = document.getElementById('kpi-categories');
      this.elValuation = document.getElementById('kpi-valuation');

      // Table Containers
      this.activityTable = document.getElementById('recent-activity-body');
      this.lowStockTable = document.getElementById('low-stock-body');

      // Global Search
      this.searchForm = document.getElementById('dashboard-global-search-form');

      this.charts = {};

      if (this.elTotalMedicines) {
        this.init();
      }
    }

    async init() {
      // Wire global search input
      if (this.searchForm) {
        this.searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const query = document.getElementById('dashboard-search-input').value.trim();
          if (query) {
            window.location.href = `/medicines.html?search=${encodeURIComponent(query)}`;
          }
        });
      }

      // Fetch summary and tables details
      await Promise.all([
        this.fetchSummary(),
        this.fetchActivity(),
        this.fetchLowStock(),
        this.fetchCharts()
      ]);
    }

    async fetchSummary() {
      try {
        const res = await window.core.api.get('/api/dashboard/summary', {}, false);
        const data = res.data;

        // Populate KPIs
        this.animateCounter(this.elTotalMedicines, data.totalMedicines);
        this.animateCounter(this.elTotalItems, data.totalInventoryItems);
        this.animateCounter(this.elTotalStock, data.totalAvailableStock);
        this.animateCounter(this.elLowStock, data.lowStockCount);
        this.animateCounter(this.elOutOfStock, data.outOfStockCount);
        this.animateCounter(this.elExpired, data.expiredCount);
        this.animateCounter(this.elExpiring30, data.expiring30Count);
        this.animateCounter(this.elTodayIn, data.todayStockIn);
        this.animateCounter(this.elTodayOut, data.todayStockOut);
        this.animateCounter(this.elSuppliers, data.totalSuppliers);
        this.animateCounter(this.elCategories, data.totalCategories);

      } catch (err) {
        console.error('Failed loading summary KPI cards', err);
      }
    }

    async fetchActivity() {
      try {
        const res = await window.core.api.get('/api/dashboard/activity', {}, false);
        const records = res.data || [];

        if (records.length === 0) {
          this.activityTable.innerHTML = '<tr><td colspan="6" style="text-align:center;">No recent activities logged.</td></tr>';
          return;
        }

        this.activityTable.innerHTML = '';
        records.forEach(tx => {
          const tr = document.createElement('tr');
          tr.style.fontSize = '0.85rem';
          tr.innerHTML = `
            <td>${new Date(tx.transaction_date).toLocaleDateString()}</td>
            <td style="font-weight:600;color:var(--text-primary);">${tx.medicine_name}</td>
            <td>${tx.potency_name}</td>
            <td><span class="tx-indicator tx-${tx.transaction_type}">${tx.transaction_type}</span></td>
            <td style="font-weight:bold;">${Math.abs(tx.quantity)}</td>
            <td>${tx.first_name} ${tx.last_name}</td>
          `;
          this.activityTable.appendChild(tr);
        });
      } catch (err) {
        this.activityTable.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--danger);">Failed to load activities.</td></tr>';
      }
    }

    async fetchLowStock() {
      try {
        const res = await window.core.api.get('/api/dashboard/low-stock', {}, false);
        const records = res.data || [];

        if (records.length === 0) {
          this.lowStockTable.innerHTML = '<tr><td colspan="4" style="text-align:center;">No low stock alerts. All levels safe.</td></tr>';
          return;
        }

        this.lowStockTable.innerHTML = '';
        records.slice(0, 5).forEach(item => {
          const tr = document.createElement('tr');
          tr.style.fontSize = '0.85rem';
          tr.innerHTML = `
            <td style="font-weight:600;color:var(--text-primary);">${item.medicine_name}</td>
            <td>${item.potency_name}</td>
            <td style="font-weight:bold;color:var(--warning);">${item.current_quantity}</td>
            <td>
              <a href="/stock-in.html" class="reusable-btn reusable-btn-primary" style="padding:2px 6px;font-size:0.7rem;text-decoration:none;">Restock</a>
            </td>
          `;
          this.lowStockTable.appendChild(tr);
        });
      } catch (err) {
        this.lowStockTable.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--danger);">Failed to load low stock warning.</td></tr>';
      }
    }

    async fetchCharts() {
      try {
        const res = await window.core.api.get('/api/dashboard/charts', {}, false);
        const datasets = res.data;

        // Display Valuation aggregate KPI
        if (this.elValuation && datasets.valuation) {
          this.elValuation.innerText = `$${datasets.valuation.totalPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // Render charts using CDN Chart.js
        this.renderMonthlyTrends(datasets.monthly);
        this.renderCategoryDistribution(datasets.category);
        this.renderTopUsage(datasets.topUsed);
        this.renderMostStocked(datasets.mostStocked);
      } catch (err) {
        console.error('Failed loading analytics charts', err);
      }
    }

    renderMonthlyTrends(monthly) {
      const ctx = document.getElementById('monthly-trends-chart').getContext('2d');
      this.charts.monthly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: monthly.labels,
          datasets: [
            {
              label: 'Stock In',
              data: monthly.datasets[0].data,
              backgroundColor: '#10b981', // Emerald
              borderRadius: 4
            },
            {
              label: 'Stock Out',
              data: monthly.datasets[1].data,
              backgroundColor: '#ef4444', // Red
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#9ca3af' } }
          },
          scales: {
            x: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af' } },
            y: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af' } }
          }
        }
      });
    }

    renderCategoryDistribution(category) {
      const ctx = document.getElementById('category-ratio-chart').getContext('2d');
      this.charts.category = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: category.labels,
          datasets: [{
            data: category.data,
            backgroundColor: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 9 } } }
          }
        }
      });
    }

    renderTopUsage(topUsed) {
      const ctx = document.getElementById('top-used-chart').getContext('2d');
      this.charts.topUsed = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topUsed.labels,
          datasets: [{
            label: 'Quantity Used',
            data: topUsed.data,
            backgroundColor: '#06b6d4', // Cyan
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y', // Horizontal bar chart
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af' } },
            y: { grid: { color: '#1f2937' }, ticks: { color: '#9ca3af' } }
          }
        }
      });
    }

    renderMostStocked(mostStocked) {
      const ctx = document.getElementById('most-stocked-chart').getContext('2d');
      this.charts.mostStocked = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: mostStocked.labels,
          datasets: [{
            data: mostStocked.data,
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#06b6d4', '#8b5cf6']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#9ca3af', font: { size: 9 } } }
          }
        }
      });
    }

    animateCounter(element, targetValue) {
      if (!element) return;
      
      let start = 0;
      const duration = 800; // 0.8s
      const increment = targetValue / (duration / 16); // ~60fps
      
      const updateCount = () => {
        start += increment;
        if (start >= targetValue) {
          element.innerText = Math.round(targetValue).toLocaleString();
        } else {
          element.innerText = Math.round(start).toLocaleString();
          requestAnimationFrame(updateCount);
        }
      };

      if (targetValue > 0) {
        updateCount();
      } else {
        element.innerText = '0';
      }
    }
  }

  // Load and mount dashboard
  document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
  });

})();
