# HomeoVault Deployment Guide

This guide explains how to deploy the **HomeoVault** application to the **Render** hosting platform.

---

## 1. Environment Variable Specifications

Configure the following variables in the **Environment** settings panel on the Render dashboard:

| Variable Name | Required | Default Value | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `production` | Run mode. Triggers Helmet security, disables verbose logs. |
| `PORT` | No | `10000` | Port served. Render automatically assigns this. |
| `DB_HOST` | Yes | - | PostgreSQL instance host server. |
| `DB_PORT` | Yes | `5432` | PostgreSQL instance connection port. |
| `DB_USER` | Yes | - | Database username. |
| `DB_PASSWORD` | Yes | - | Database password. |
| `DB_NAME` | Yes | - | Target database name. |
| `DB_SSL` | No | `true` | Requires SSL encryption. Must be set to `true` for Render DB. |
| `JWT_SECRET` | Yes | - | Private token signature code. Use a long random string. |
| `JWT_EXPIRES_IN` | No | `24h` | Expiration window of the session token. |

---

## 2. Deploying on Render (Step-by-Step)

### Step 1: Push to GitHub/GitLab
Make sure your latest codebase changes are committed and pushed to your remote Git repository.

### Step 2: Create a PostgreSQL Database on Render
1.  Navigate to the Render Dashboard.
2.  Click **New +** and select **PostgreSQL**.
3.  Fill in the database name and select the Free tier (or appropriate tier).
4.  Once database provisioning completes, copy the **Internal Database URL** or connection credentials (Host, User, Password, DB Name).

### Step 3: Create the Web Service
1.  Click **New +** and select **Web Service**.
2.  Connect your Git repository.
3.  Configure the build properties:
    -   **Name**: `homeovault`
    -   **Environment**: `Node`
    -   **Build Command**: `npm install`
    -   **Start Command**: `npm run db:migrate && npm start` (this automatically runs migration scripts before spawning the server!)
4.  Open the **Advanced** section:
    -   Add the Environment Variables from the table above.
    -   Set **Health Check Path** to `/api/health`.
5.  Click **Create Web Service**.

---

## 3. Post-Deployment Verification Checklist

1.  **Check Deploy Logs**: Review compile outputs, dependency installations, and database migration logs.
2.  **Verify Service Health**: Access `https://your-service-name.onrender.com/api/health` to confirm that the health status returns `{ "status": "healthy" }`.
3.  **Perform Account Creation**: Access the login page, click **Register**, and verify that account creation and database insertions complete.
4.  **Confirm Offline PWA Support**: Open the page, verify that the application logo is visible, click install to add to home screen, and verify that closing the server redirects you to the offline fallback page.
