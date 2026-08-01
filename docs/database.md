# HomeoVault Database System Documentation

This document describes the PostgreSQL database architecture, custom-built SQL migration/seeding systems, base repository pattern, and execution instructions.

---

## 1. Directory Structure

All database-related configuration, scripts, and structures reside within the `backend/database/` and `backend/repositories/` folders:

```text
backend/
├── database/
│   ├── connectionPool.js       # PostgreSQL Pool instantiation & lifecycle hooks
│   ├── databaseConfig.js       # Database environment variable parser
│   ├── database.js             # Connection testing script (startup validator)
│   ├── migrations/             # Database schema migrations
│   │   ├── 001_initial_schema.up.sql    # Schema tables (UP)
│   │   ├── 001_initial_schema.down.sql  # Schema tables rollback (DOWN)
│   │   └── migrationRunner.js           # Lightweight SQL migration runner
│   └── seed/                   # Database initial seed records
│       ├── 001_initial_seeds.up.sql     # Seed inserts (UP)
│       ├── 001_initial_seeds.down.sql   # Seed rollback (DOWN)
│       └── seedRunner.js                # Database seeder execution script
└── repositories/
    └── base.repository.js      # Reusable generic repository base class
```

---

## 2. PostgreSQL Connection Pool (`connectionPool.js`)

HomeoVault leverages a shared, reusable connection pool managed by the `pg` driver rather than establishing individual connections per query.

### Key Pool Parameters
*   **Idle Timeout (`DB_POOL_IDLE_TIMEOUT`)**: 30,000ms (30s). Disconnects idle database connections automatically, freeing server resources.
*   **Connection Timeout (`DB_POOL_CONNECTION_TIMEOUT`)**: 2,000ms (2s). Raises an immediate connection error if a client cannot acquire a socket.
*   **Maximum Connections (`DB_POOL_MAX`)**: 20. Safeguards PostgreSQL from connection exhaustion.
*   **Graceful Shutdown**: The export function `close()` is listening to application termination events. It triggers `pool.end()`, completing active queries before terminating sockets.
*   **Error Logging**: Any unexpected database errors occurring on idle clients are trapped globally using the pool error hook, avoiding application crashes.

---

## 3. Custom SQL Migration System

To maintain full control and keep dependencies minimal, we avoid bloated ORM layers (Sequelize, Prisma) and rely on a lightweight SQL runner.

### How it Works
1.  **Tracking Table**: The system maintains a `migration_history` table in the database containing applied file names:
    ```sql
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    ```
2.  **Up Executions**: The migration runner scans the folder for files ending with `.up.sql`. It checks the database records, filters out already executed files, and executes new files sequentially.
3.  **Transactions**: Each migration file executes inside an ACID transaction block (`BEGIN`, `COMMIT`, `ROLLBACK`). If one query fails inside a migration, the database rolls back completely to prevent corrupt states.
4.  **Down Executions**: Reverts the last executed file by finding its `.down.sql` matching counterpart, executing it, and clearing the history record.

---

## 4. Base Repository Pattern (`base.repository.js`)

The `BaseRepository` abstract class decouples Express request controllers from raw SQL statements, mapping operations onto standard methods:

### Supported Core Methods
*   `findById(id)`: Fetches a single row.
*   `findAll()`: Fetches all rows ordered by creation date.
*   `insert(data)`: Dynamically generates parameterized `INSERT INTO` queries using object property keys.
*   `update(id, data)`: Dynamically generates parameterized `UPDATE` queries.
*   `delete(id)`: Removes a record matching the primary key.
*   `executeQuery(text, params, client)`: Custom parameterized query fallback. Supports passing transactional clients.
*   `transaction(callback)`: Begins a transaction, executes the callback with the client instance, and commits/rolls back on success/error.

---

## 5. Database Environment Variables

Configure connection settings within your local `.env` file:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DB_HOST` | Database host server hostname | `localhost` |
| `DB_PORT` | PostgreSQL TCP port | `5432` |
| `DB_USER` | PostgreSQL user credentials | `postgres` |
| `DB_PASSWORD` | PostgreSQL user password | `postgres` |
| `DB_NAME` | Target database catalog name | `homeovault` |
| `DB_SSL` | Enable secure transport SSL flags | `false` |
| `DB_POOL_MAX` | Maximum number of active sockets | `20` |

---

## 6. Execution Commands

Use the following npm script commands to manage your database state:

### Connection Verification
Check if the application can successfully authenticate and query the database server:
```bash
npm run db:setup
```

### Manage Migrations
*   **Run Pending Migrations (Up)**:
    ```bash
    npm run db:migrate
    ```
*   **Rollback Last Migration (Down)**:
    ```bash
    npm run db:migrate:undo
    ```

### Manage Seed Data
*   **Seed Default Roles & Settings (Up)**:
    ```bash
    npm run db:seed
    ```
*   **Remove Seed Records (Down)**:
    ```bash
    npm run db:seed:undo
    ```
