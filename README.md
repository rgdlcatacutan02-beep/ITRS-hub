# ITRS Hub — IT Operations & Cloud Resource Portal

A centralized modern IT Operations and PC Setup portal built with **React 19**, **Vite**, and **TypeScript**. Designed for managing standard department PC software configurations, technician work orders, credential vaults, and cloud-synchronized operations.

---

## 🚀 Key Features

- **Role-Based Access Control (RBAC)**:
  - 👑 **Super Admin**: System configuration, account management, audit logs.
  - 🛡️ **Admin**: Folder, category, and resource management, task approvals.
  - 🛠️ **Staff / Technician**: Operational checklist, credential management, day-off requests.
  - 👁️ **Viewer**: Read-only access to standard PC setups and department tools.
- **Cloud Architecture & Database Abstraction**:
  - Asynchronous Cloud Service Layer with live telemetry (`services/cloudService.ts`).
  - Production-ready Express REST backend template (`server/index.js`) for seamless PostgreSQL / Supabase / SQLite connection.
  - Automatic caching and latency metrics.
- **Sleek Minimalist SaaS UI**:
  - Deep carbon & dark slate aesthetics with translucent glassmorphism (`backdrop-blur-xl`).
  - 3D Isometric Cyber Nexus SVG brand identity and favicon.
  - Executive KPI metrics, interactive task progress tracking, and leave scheduling.
- **IT Productivity Suite**:
  - 🔑 **Encrypted Password Manager / Credential Vault** with clipboard quick-copy.
  - 📝 **IT Operations Scratchpad** with automatic local synchronization.
  - 🧭 **Interactive Guided Tour** for fast onboarding.
  - 📦 **Cloud JSON Backup / Restore**.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla Tailwind CSS, Glassmorphism, Responsive CSS Grid
- **Icons**: Handcrafted scalable SVG icon system
- **Backend Architecture**: REST API Service Layer (`services/cloudService.ts`), Node.js Express server (`server/index.js`)

---

## 📦 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/rgdlcatacutan02-beep/ITRS-hub.git
cd ITRS-hub
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000/`.

### 3. Build for Production

```bash
npm run build
```

---

## 🔐 Default Demo Accounts

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin1234` |
| **Super Admin** | `superadmin` | `admin` |
| **Staff / Technician** | `staff` | `staff1234` |
| **Viewer** | `viewer` | `viewer1234` |

*(1-click quick login pills are available on the login screen for testing)*

---

## 📄 License

MIT License. Designed and maintained for enterprise IT operations.
