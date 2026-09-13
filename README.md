# 💎 Finova Pro — Full-Stack Personal Finance Platform & AI Engine

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-10b981?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express-4.19-06b6d4?style=flat-square&logo=express)](https://expressjs.com)
[![JWT Auth](https://img.shields.io/badge/Authentication-JWT%20%2B%20bcryptjs-6366f1?style=flat-square)](https://jwt.io)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=flat-square)](LICENSE)

**Finova Pro** is a full-stack, real-time Personal Finance Dashboard & AI Analytics Platform built with a Node.js Express REST API backend, secure `bcryptjs` password hashing, JWT authentication, persistent JSON database storage, time-series AI cashflow forecasting, and a modern Cyber-Emerald Web UI with live multi-tab synchronization.

---

## 🌟 Key Features & Capabilities

### 🔐 1. Real-Time Security & Authorization
- **`bcryptjs` Password Hashing**: Passwords are encrypted with 10 salt rounds before persisting to backend storage.
- **JWT Authentication & Sessions**: Secure 7-day signed JSON Web Tokens passed in `Authorization: Bearer <token>` headers.
- **Role-Based Access Control (RBAC)**: Enforced via `authenticateToken` and `requireAdmin` middlewares for **Standard User** and **Master Admin** roles.

### ⚡ 2. Real-Time Node.js Express Backend (`server.js`)
- **Authentication Endpoints**:
  - `POST /api/auth/register` — Account registration with password hashing & automatic data initialization.
  - `POST /api/auth/login` — Secure credential verification & JWT token issuance.
  - `GET /api/auth/me` — Real-time JWT token verification.
- **Profile & Workspace Endpoints**:
  - `PUT /api/user/profile` — Live profile name and avatar updates.
  - `POST /api/workspace/restore` — Full workspace JSON backup restoration.
- **Financial Workspace Endpoints**:
  - `/api/transactions` — Income & expense CRUD operations with pagination & filtering.
  - `/api/goals` — Savings goal creation, target progress, and live deposit logging.
  - `/api/budgets` — Category spending limits and deletion endpoints.
  - `/api/subscriptions` — Recurring billing & renewal day tracking.
- **🤖 Real-Time AI Predictions API (`/api/predictions`)**:
  - Time-series exponential spending velocity forecasting next month expenses.
  - Dynamic Financial Health Score (0–100) and actionable AI risk advisor alerts.
- **⚡ Master Admin API (`/api/admin`)**:
  - Global volume stats, transaction aggregation, user demotion/promotion, user deletion, and factory reset.

### 🎨 3. Cyber-Emerald Web Interface
- **Real-Time Backend Status Pill**: Glowing `● Sync Active` status pill in navbar displaying live Express backend connection health.
- **Background Auto-Sync Loop**: Automated 15-second background polling keeping open tabs synchronized.
- **Brand SVG Assets**: Custom vector emblem (`favicon.svg`) integrated for browser tab icons and header badges.
- **Interactive Chart.js Suite**: Dynamic balance trend line chart (3M/6M/12M), category expense doughnut chart, and cashflow bar charts.
- **Preferences & Export**: Multi-currency switcher (₹ INR, $ USD, € EUR, £ GBP), dark/light themes, CSV exporter, and full JSON backup/restore.

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v14.0 or higher) installed on your system.

### 2. Installation & Server Setup
```bash
# Clone the repository
git clone https://github.com/shivamsharmakr04/finance-Dashboard.git
cd finance-Dashboard

# Install backend dependencies (express, cors, jsonwebtoken, bcryptjs)
npm install

# Start the Real-Time Express Server (Runs on http://localhost:5000)
npm start
```

### 3. Open the Application
Open `index.html` directly in your web browser or use a local development server (e.g. Live Server).

---

## 🔑 Demo Accounts

You can log in instantly using the built-in quick demo buttons or credentials below (default password for all demo accounts is `password123`):

| Role | Name | Email | Default Password |
| :--- | :--- | :--- | :--- |
| **Standard User** | Alex Kumar | `alex@finova.io` | `password123` |
| **Standard User** | Sarah Chen | `sarah@finova.io` | `password123` |
| **Master Admin** | Admin Master | `admin@finova.io` | `password123` |

---

## 📂 Project Structure

```
finance-Dashboard/
├── server.js          # Real-time Express REST API, JWT auth, & AI prediction engine
├── db.json            # Persistent JSON database store
├── script.js          # Frontend API client, real-time sync, & Chart.js renderer
├── index.html         # Single-page application markup & modals
├── style.css          # Cyber-Emerald design system, animations, & themes
├── favicon.svg        # Custom brand vector logo & favicon asset
├── package.json       # Project dependencies & startup scripts
└── README.md          # Project documentation
```

---

Made with ❤️ for real-time financial empowerment.