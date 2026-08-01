# HomeoVault: Homeopathic Family Medicine Inventory System

HomeoVault is a production-ready, secure, and offline-capable progressive web application (PWA) designed to manage homeopathic medicine inventories, track remedy potency batches, configure cabinet storage boxes, monitor safety levels, and generate customized financial and ledger reports.

---

## 1. Quick Installation & Setup

### Prerequisites
-   **Node.js**: Version 18 or higher (tested on Node v22)
-   **PostgreSQL**: Version 13 or higher

### Local Installation Steps
1.  **Clone the Repository**:
    ```bash
    git clone <repository_url>
    cd homeovault
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Copy the `.env.example` file to `.env` and fill in your local PostgreSQL database credentials and JWT parameters:
    ```bash
    cp .env.example .env
    ```
4.  **Run Database Migrations**:
    Apply database schema tables (categories, potencies, medicines, inventory batches, notifications, and settings):
    ```bash
    npm run db:migrate
    ```
5.  **Seed Database (Optional)**:
    Pre-seed default medicine categories, default potencies (Q, 3X, 6C, 30C, 200C, 1M, 10M), medicine forms (dilution, globules, mother tincture), and storage cabinet boxes:
    ```bash
    npm run db:seed
    ```
6.  **Start Application**:
    -   Development Mode (Hot Reloading via Nodemon):
        ```bash
        npm run dev
        ```
    -   Production Mode:
        ```bash
        npm start
        ```
7.  **Access the Application**:
    Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 2. Directory Structure

```text
homeovault/
├── backend/
│   ├── config/              # Central config configurations
│   ├── controllers/         # REST Controllers (Auth, Medicines, Inventory, Dashboard, Reports, Notifications, Settings)
│   ├── database/            # Database configurations, connection pool, migrations and seeds scripts
│   ├── middleware/          # Express Middlewares (Authentication, Input Validation, Custom CORS, Rate Limiters)
│   ├── repositories/        # Database CRUD Repository classes (extends BaseRepository)
│   ├── services/            # Business Logic Layers (Auth, Medicines, Inventory, Exporters, Schedulers, Backup/Restore)
│   └── utils/               # Formatting, hashing, and winston logger utilities
├── docs/                    # Technical architecture design documentation
├── public/                  # Frontend static files
│   ├── css/                 # Vanilla CSS stylesheets (styles, core, inventory, dashboard, reports, notifications, settings)
│   ├── js/                  # Vanilla JS managers and script coordinators
│   └── manifest.json        # PWA Web Manifest
├── views/                   # HTML layout page templates
├── tests/                   # Native verification test scripts
├── render.yaml              # Render production blueprint file
└── server.js                # App entry start point
```

---

## 3. Database Schema

The PostgreSQL schema is fully normalized to avoid data duplication:

1.  `users`: Primary user login and account info.
2.  `medicine_categories`: Classifications (e.g. remedies, nosodes, mother tinctures).
3.  `manufacturers`: Pharmacy labs and manufacturing profiles.
4.  `medicine_forms`: Medicine shapes (globules, liquid dilutions, trituration tablets).
5.  `potencies`: Scales (Q, 30C, 200C, 1M, 10M).
6.  `medicines`: Master remedy catalogs.
7.  `medicine_potencies`: Joint-table associating medicines to potencies.
8.  `medicine_aliases`: Key remedy abbreviations.
9.  `medicine_tags`: Remedial keywords.
10. `medicine_images` & `medicine_manufacturers`: Asset and pharmacy maps.
11. `locations`: Physical cabinet boxes presets.
12. `suppliers`: Pharmacy distributors directory.
13. `inventory`: Stores aggregate quantity balances per medicine potency.
14. `inventory_batches`: Individual manufacturing lot codes, prices, and expiration dates.
15. `stock_transactions`: Chronological ledger audit logs (STOCK_IN, STOCK_OUT, ADJUSTMENT).
16. `notifications` & `notification_preferences`: Alert center logs and user toggles profiles.
17. `scheduled_jobs` & `system_logs`: Scheduler executions and database system log trails.
18. `application_settings` & `system_preferences`: Global app configurations and user overrides.

---

## 4. API Endpoints Reference

### Authentication (`/api/auth`)
-   `POST /register`: Registers a new user account.
-   `POST /login`: Logs in a user and sets an HttpOnly cookie.
-   `POST /logout`: Destroys the cookie session.
-   `POST /change-password`: Modifies password.

### Medicines Catalog (`/api`)
-   `GET /medicines`: List remedies.
-   `POST /medicines`: Create new remedy.
-   `GET /medicines/:id`: Retrieve details.
-   `PUT /medicines/:id`: Modify details.
-   `POST /medicines/import`: Bulk import CSV/Excel.
-   `GET /categories` / `GET /forms` / `GET /potencies`: Fetch metadata sets.

### Inventory (`/api`)
-   `GET /inventory`: List stock aggregates.
-   `POST /inventory/stock-in`: Receive new stock lot batch.
-   `POST /inventory/stock-out`: Record stock consumption or discard.
-   `POST /inventory/adjust`: Override active lot count.
-   `POST /inventory/transfer`: Move stock between cabinet boxes.
-   `GET /locations` / `GET /suppliers`: Configure cabinet boxes and distributors.

### Dashboard & Analytics (`/api/dashboard`)
-   `GET /summary`: Compiles KPI counter metrics.
-   `GET /activity`: Chronological transaction ledger logs.
-   `GET /charts`: Chart.js formatted data.

### Reports (`/api`)
-   `GET /reports/inventory` / `GET /reports/stock-in` / `GET /reports/stock-out` / `GET /reports/expiry` / `GET /reports/low-stock` / `GET /reports/valuation` / `GET /reports/activity`: paginated filtered reports.
-   `POST /export/:format`: Exports report files (PDF, Excel XLS, CSV).

---

## 5. Backup & Restore Operations

### Backups
-   Backups compile database records into portable JSON archives.
-   Go to the Backups tab under Settings and click **Create Backup**. This packages table records, saves them to `/backups/` and logs the event in the history log.
-   Click **Download** next to any record in the list to save it locally.

### Restores
-   Go to the **Restore Wizard** under Settings.
-   Drag and drop a valid JSON backup file into the upload zone.
-   Confirm the overwrite prompt. The system will drop existing records and re-insert the backup content inside a safe transaction block.

---

## 6. Administrator & Troubleshooting Guide

### Common Issues:
1.  **Connection Refused (503 / ECONNREFUSED)**:
    Verify PostgreSQL is active on port 5432 and credentials in `.env` are correct.
2.  **PWA Offline warning banner**:
    Service worker detects connection drop. Check network connectivity.
3.  **Invalid token errors**:
    JWT cookies have expired or secret key changed. Log out and log back in.
