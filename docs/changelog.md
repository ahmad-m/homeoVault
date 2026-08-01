# Changelog

All notable changes to the **HomeoVault** family medicine inventory tracker will be documented in this file.

---

## [1.0.0] - 2026-08-01

### Added
-   **User Authentication & Security**: Secure signup, login, password changes, and password resets. Implemented HttpOnly cookies, JWT checks, bcrypt password hashing, and custom CORS.
-   **Remedy Catalog Master**: Normalized medicine metadata (Categories, Forms, Potencies) with UUID keys, search index filters, and bulk imports.
-   **Inventory Lot Controls**: Real-time batch-level inventory tracking (Stock-In lot batches, Stock-Out discards, transfers, adjustments, locations).
-   **Dashboard & Chart Analytics**: KPI stats counters, recent transaction ledger activities, and Chart.js analytics.
-   **Custom Reports Exporter**: Compiled 15 specialized reports exportable to PDF, Excel, and CSV format.
-   **Hourly Alert Schedulers**: Automated low-stock warning engines, expiration sweepers, and system loggers.
-   **Centralized Backup center**: Full database JSON serializations with drag-and-drop restore installations inside isolated transactions.
-   **Installable PWA**: Offline fallback warnings page, Cache-First static asset caches, and Network-First API caches.
-   **Brute-Force Shield**: Custom rate-limiter middleware protecting login and signup forms.
-   **Native Test Suite**: Self-contained test runner verifying cryptographic helpers and formatters.
-   **Render Blueprints**: `render.yaml` specification for zero-config production deployment.
