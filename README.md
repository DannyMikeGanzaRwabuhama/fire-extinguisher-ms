# 🧯 Fire Extinguisher Management System — TZW LTD

A production-ready, feature-rich Web Application designed for **TZW LTD** to manage, track, inspect, and maintain fire extinguisher inventory. Built with a modern monolithic API backend, a responsive and responsive client-side interface, role-based security, trigger-based database notifications, and robust CSV/PDF exportable reporting modules.

---

## 🚀 Technical Stack

### Backend (API)
* **Runtime & Framework**: Node.js & Express.js
* **Database**: PostgreSQL (Implemented with raw SQL queries using the `pg` client pool for maximum performance and direct schema control)
* **Authentication**: JSON Web Token (JWT) with secure password hashing (`bcryptjs`)
* **Documentation**: Swagger UI (`swagger-ui-express` & `swagger-jsdoc`)
* **Utilities**: `pdfkit` (for PDF report layout printing) & `json2csv` (for structured spreadsheet downloads)

### Frontend (SPA Client)
* **Framework**: React 19 + TypeScript + Vite 8
* **Styling**: Tailwind CSS v4 + custom HSL CSS color system (modern dark mode support)
* **Icons & UI Utilities**: Lucide Icons, Radix UI primitives, `class-variance-authority` (CVA), and `clsx`/`tailwind-merge`
* **Network & State**: Axios client with interceptors for global authentication token handling

---

## 📂 Project Structure

```bash
RESTFUL_NE/
├── fire-extinguisher-backend/    # Node.js + Express + PostgreSQL Backend API
│   ├── src/
│   │   ├── config/              # Database Pool & JWT configurations
│   │   ├── middleware/          # Error handling & authentication guards
│   │   ├── modules/             # Monolithic business domains (auth, extinguisher, inspection, etc.)
│   │   ├── seeds/               # Seeding script (seed.js)
│   │   └── triggers/            # PostgreSQL trigger scripts
│   ├── package.json
│   └── .env
├── fire-extinguisher-frontend/   # React + TypeScript + Vite Frontend App
│   ├── src/
│   │   ├── api/                 # Axios clients for all endpoints
│   │   ├── components/          # Reusable UI component modules (tables, modals, dialogs)
│   │   ├── context/             # AuthContext state provider
│   │   ├── layouts/             # Dashboard and Public layouts
│   │   ├── pages/               # Feature-specific pages (Dashboard, Inventory, Reports)
│   │   └── routes/              # Client-side router declarations
│   ├── package.json
│   └── tailwind.config.js
├── database_backup.sql          # Full PostgreSQL database structure & seed data dump
├── erd.png                      # Entity Relationship Diagram (ERD)
└── architecture.png             # System Architecture & Flow Diagram
```

---

## ✨ Features & Functionality

1. **Role-Based Access Control (RBAC)**:
   * **Admin (`ROLE_ADMIN`)**: Complete dashboard visibility, database user management (including role promotion/demotion), full inventory CRUD (Create, Read, Update, Delete), inspections schedule, maintenance history log, and access to all reporting tools.
   * **Inspector (`ROLE_INSPECTOR`)**: Scoped access to schedule inspections, view and complete assigned inspections, log maintenance operations, and view inventory.
   * **User (`ROLE_USER`)**: Scoped to view inventory and schedule inspections. Hides admin reports and user lists.
2. **Email Verification & OTP Signup**:
   * Registers users with `is_verified = false` (self-selection of roles removed; all public signups default to `ROLE_USER`).
   * Automatically sends a secure 6-digit OTP code to the user's email using `nodemailer`.
   * Restricts login attempts with unverified accounts (returns `403 Forbidden` with a reminder toast).
   * Provides a dedicated `/verify-email` tab to verify credentials and complete login.
3. **Self-Service Password Reset (OTP)**:
   * Enables users to request a password reset OTP on `/forgot-password`.
   * Verifies the OTP, hashes the new password with `bcryptjs`, and updates the database record.
4. **Admin Role Promotion**:
   * Enables administrators to promote standard users (`ROLE_USER`) to Inspector (`ROLE_INSPECTOR`) or demote them back directly from the Users grid.
   * Includes double-confirm guards via the `ConfirmDialog` component before updating.
5. **Database Trigger Notifications**:
   * Uses a raw SQL trigger (`inspection_scheduled_trigger` on `inspections`) to automatically generate unread inbox notifications for both the user scheduling the inspection and the assigned inspector upon status updates.
6. **Smart Inventory Limits & Auto-Expiration**:
   * Auto-calculates active expired statuses client-side based on reference timestamps.
   * Restricts scheduling or updating actions on `EXPIRED` or `DECOMMISSIONED` extinguisher assets.
7. **Validation Guardrails**:
   * Double-schedule inspection checks prevent scheduling conflicts (`409 Conflict` on same extinguisher, date, and time slot).
   * Restricts maintenance logging to only `COMPLETED` inspection references.
   * Full date validation (e.g. installation date must precede expiry date).
8. **System Reports & Downloads**:
   * Features Stock, Expired, Inspections, Maintenance, and Compliance tabs.
   * Exports data tables to **CSV** and fully formatted **PDF** documents (featuring Crimson branding, zebra striping, page numbers, and dynamic line-wrapping to prevent overlaps).

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@tzw.rw` | `password123` |
| **Inspector** | `inspector1@tzw.rw` | `password123` |
| **User** | `user1@tzw.rw` | `password123` |

---

## 🛠️ Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [PostgreSQL](https://www.postgresql.org/) (Running on port `5432` with a database named `fire_extinguisher_db`)

### 1. Database Setup
Ensure PostgreSQL is running, then create the database:
```sql
CREATE DATABASE fire_extinguisher_db;
```

*(Note: The database tables, schemas, constraints, and trigger functions are automatically checked and generated on backend server startup).*

### 2. Backend Configuration
Navigate to the backend directory and configure the environment variables:
```bash
cd fire-extinguisher-backend
```
Create a `.env` file in the backend directory containing:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fire_extinguisher_db
DB_USER=postgres
DB_PASSWORD=password # Replace with your pgAdmin master password
JWT_SECRET=tzw_fire_secret_2025
JWT_EXPIRES_IN=24h
```

### 3. Run Seeding Script (Required)
Seed the database with default demo records (15 extinguishers, 5 users, 12 inspections, 8 maintenance logs):
```bash
node src/seeds/seed.js
```

### 4. Running the Backend
Install dependencies and run the server in development mode:
```bash
npm install
npm run dev
```
* **Server runs at**: `http://localhost:5000`
* **Swagger API Docs**: `http://localhost:5000/api-docs`

### 5. Running the Frontend
In a new terminal window, navigate to the frontend directory, install dependencies, and start the Vite dev server:
```bash
cd fire-extinguisher-frontend
npm install
npm run dev
```
* **Frontend runs at**: `http://localhost:5173`

---

## 📦 Database Backup & Restore

A database backup has been provided in the root folder as `database_backup.sql`. To restore it, run:
```bash
psql -U postgres -d fire_extinguisher_db -f database_backup.sql
```
