# Finova Pro — Personal Finance Dashboard

**Finova Pro** is a full-stack personal finance application designed to help users understand, organize, and manage their money in one place. It brings together income and expense tracking, budgets, savings goals, subscriptions, and visual insights, with a modular backend and real-time data communication.

## Overview

Managing personal finances often means switching between separate tools for transactions, budgets, and savings. Finova Pro aims to bring these workflows together in a single dashboard, making financial activity easier to review and track.

## Features

- **Authentication:** JWT-based authentication with bcrypt password hashing.
- **Transactions:** Record and manage income and expenses.
- **Budgets:** Set budgets and review spending patterns.
- **Savings goals:** Define targets and track progress.
- **Subscriptions:** Keep track of recurring payments.
- **Analytics:** Visualize financial activity and spending trends.
- **Forecasting:** Explore cash-flow projections and financial health insights.
- **Data portability:** Export transactions to CSV and back up or restore data in JSON.
- **Multi-currency support:** Work with supported currency options.
- **Real-time communication:** WebSocket-based data updates and synchronization.
- **User and admin workflows:** Support for user-facing and administrative operations.

## Technology Stack

| Area | Technologies |
|---|---|
| Backend | Node.js, Express.js |
| API | REST |
| Real-time communication | WebSockets |
| Authentication | JWT, bcryptjs |
| Frontend | HTML, CSS, JavaScript, Chart.js |
| Data persistence | JSON-based persistent data store |
| Version control | Git, GitHub |

## Architecture

The application separates the browser interface from backend services. The backend is organized into modular responsibilities for authentication and finance-related workflows, while REST endpoints handle standard requests and WebSockets support real-time communication.

```text
┌─────────────────────────────┐
│         Browser UI          │
│ HTML · CSS · JavaScript     │
│ Charts and dashboard views  │
└──────────────┬──────────────┘
               │
        REST API / WebSocket
               │
┌──────────────▼──────────────┐
│      Express Backend        │
│                             │
│  Authentication             │
│  Transactions               │
│  Budgets                    │
│  Savings Goals              │
│  Subscriptions              │
│  Analytics & Predictions    │
│  Real-time Data Services    │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│   Persistent Data Store     │
└─────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

```bash
git clone https://github.com/shivamsharmakr04/finance-Dashboard.git
cd finance-Dashboard
npm install
npm start
```

Start the frontend using a local development server and open `index.html` in your browser. The API uses the port configured by the project.

> **Note:** Check the project's configuration and environment settings before running it in a production environment. Never commit secrets or credentials to the repository.

## Project Goals

Finova Pro demonstrates practical full-stack development concepts, including:

- Designing and integrating REST APIs
- Structuring backend functionality into maintainable modules
- Implementing authentication and authorization
- Building financial CRUD workflows
- Visualizing data with charts
- Supporting real-time client/server communication
- Implementing export and backup workflows
- Connecting frontend experiences with backend services

## Author

**Shivam Kumar** — Full-Stack Developer

- [GitHub](https://github.com/shivamsharmakr04)
- [LinkedIn](https://www.linkedin.com/in/shivam-kumar-b0aab2209/)

---

If you find this project useful, consider giving the repository a ⭐ on GitHub.
