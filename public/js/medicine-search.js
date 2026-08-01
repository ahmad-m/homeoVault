/**
 * HomeoVault - Medicine Search Engine Controller
 */

(function () {
  'use strict';

  class MedicineSearch {
    constructor() {
      this.searchInput = document.getElementById('medicine-search-input');
      this.dropdown = document.getElementById('search-autocomplete-dropdown');
      this.debounceTimer = null;
      this.recentSearchesKey = 'homeovault_recent_searches';

      this.filters = {
        q: '',
        category_id: '',
        manufacturer_id: '',
        form_id: '',
        potency_id: '',
        page: 1,
        limit: 12,
        sort: 'name'
      };

      if (this.searchInput) {
        this.init();
      }
    }

    init() {
      // 1. Setup Input Listener with Debounce
      this.searchInput.addEventListener('input', () => {
        clearTimeout(this.debounceTimer);
        const query = this.searchInput.value.trim();

        if (query.length < 2) {
          this.hideSuggestions();
          return;
        }

        this.debounceTimer = setTimeout(() => this.fetchSuggestions(query), 300);
      });

      // 2. Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
          this.hideSuggestions();
        }
      });

      // 3. Show recent searches on input focus
      this.searchInput.addEventListener('focus', () => {
        const query = this.searchInput.value.trim();
        if (query.length === 0) {
          this.showRecentSearches();
        }
      });
    }

    async fetchSuggestions(query) {
      try {
        const res = await window.core.api.get('/api/medicines/search', {
          q: query,
          autocomplete: 'true'
        }, false); // Set loader to false to prevent loading mask overlay while typing

        this.renderSuggestions(res.data);
      } catch (err) {
        console.error('Failed to load search autocomplete', err);
      }
    }

    renderSuggestions(suggestions) {
      if (!suggestions || suggestions.length === 0) {
        this.hideSuggestions();
        return;
      }

      this.dropdown.innerHTML = '';
      suggestions.forEach(item => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item autocomplete-suggestion-item';
        div.innerHTML = `
          <span>${item.name}</span>
          <span class="suggestion-sub">${item.latin_name || ''}</span>
        `;
        div.addEventListener('click', () => {
          this.searchInput.value = item.name;
          this.hideSuggestions();
          this.saveSearch(item.name);
          // Navigate to details page if selected
          window.location.href = `/medicine-details.html?id=${item.id}`;
        });
        this.dropdown.appendChild(div);
      });

      this.dropdown.style.display = 'block';
    }

    showRecentSearches() {
      const recents = this.getRecentSearches();
      if (recents.length === 0) {
        this.hideSuggestions();
        return;
      }

      this.dropdown.innerHTML = '<div style="padding: 10px 16px; font-size:0.75rem; text-transform:uppercase; font-weight:600; color:var(--text-muted);">Recent Searches</div>';
      
      recents.forEach(term => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.innerText = term;
        div.addEventListener('click', () => {
          this.searchInput.value = term;
          this.hideSuggestions();
          this.saveSearch(term);
          // Execute search on grid list
          if (window.medicineCatalog) {
            window.medicineCatalog.executeSearch(term);
          }
        });
        this.dropdown.appendChild(div);
      });

      this.dropdown.style.display = 'block';
    }

    hideSuggestions() {
      this.dropdown.style.display = 'none';
    }

    saveSearch(term) {
      let recents = this.getRecentSearches();
      recents = recents.filter(t => t.toLowerCase() !== term.toLowerCase());
      recents.unshift(term);
      if (recents.length > 5) recents.pop();
      localStorage.setItem(this.recentSearchesKey, JSON.stringify(recents));
    }

    getRecentSearches() {
      try {
        const items = localStorage.getItem(this.recentSearchesKey);
        return items ? JSON.parse(items) : [];
      } catch (err) {
        return [];
      }
    }
  }

  // Load and mount Search Controller globally
  document.addEventListener('DOMContentLoaded', () => {
    window.medicineSearch = new MedicineSearch();
  });

})();
