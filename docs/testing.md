# HomeoVault Testing & QA Guide

This document describes the native testing routines, manual QA protocols, performance audits, and security checklists.

---

## 1. Native Testing Suite (`tests/runTests.js`)

HomeoVault includes a lightweight test runner to verify core helper functions without requiring external packages.

To execute tests locally, run:
```bash
npm test
```

### Included Tests:
1.  **Password Hashing**: Verifies that bcrypt hashes passwords securely and matches correct passwords while failing incorrect entries.
2.  **Response Formatter**: Tests that JSON payloads match the standardized structure (`success`, `message`, `data`, `error`).
3.  **AppError**: Validates operational status markers and status codes.

---

## 2. Manual QA & Regression Checklist

### A. Authentication & Registration
- [ ] Attempt to sign up with a weak password (verify validator flags).
- [ ] Attempt to sign up using an existing email (verify unique constraint conflict 409 error).
- [ ] Try to access `/dashboard` without cookies (verify redirect to `/login`).
- [ ] Submit invalid login credentials (verify limit counter counts attempts and rate limits requests).

### B. Catalog & Inventory Movements
- [ ] Create a medicine (verify category, potency maps save).
- [ ] Stock-In a batch (verify quantity increases, transaction logs list STOCK_IN).
- [ ] Stock-Out a batch (verify stock level drops, transaction logs list STOCK_OUT).
- [ ] Trigger locations transfer (verify stock moves between cabinets).

### C. Report Generations
- [ ] Query Low Stock report (confirm it matches limits).
- [ ] Export Inventory report to PDF, Excel, and CSV (verify layout stream writes, XLS headers, and CSV cells write cleanly).

---

## 3. Performance & Stress Testing Checklist

- [ ] **Connection Limits**: Verify database pool max connections doesn't leak.
- [ ] **Paginations**: Ensure `/api/medicines` and reports query using cursor `LIMIT` and `OFFSET` to protect backend memory.
- [ ] **Asset Minifications**: Ensure static styles and JavaScript files load in compressed formats, and check page load speeds.

---

## 4. Security Audit Checklist

- [ ] **SQL Injection**: Validate that all database commands route parameter values via bindings (`$1`, `$2`) instead of string interpolations.
- [ ] **XSS**: Confirm inputs are sanitized by express-validators before processing.
- [ ] **CSRF**: Verify session cookies use `HttpOnly`, `Secure` (in production), and `SameSite=Lax` flags to restrict cross-site credential sharing.
