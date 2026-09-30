# 🚀 Deploying Finova Pro to Render

This repository is fully configured for deployment on **Render** (as a Web Service with WebSockets and optional MongoDB Atlas integration).

---

## 🛠️ Option 1: One-Click Render Blueprint Deployment (Recommended)

1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Blueprint**.
3. Connect your GitHub repository (`finance-Dashboard`).
4. Render will automatically detect `render.yaml` and configure the Web Service with Node environment and WebSocket support.
5. (Optional) Set your `MONGODB_URI` environment variable under **Environment Variables** if using MongoDB Atlas.

---

## ⚙️ Option 2: Manual Render Web Service Setup

If you prefer setting up manually on Render:

1. Click **New +** ➔ **Web Service**.
2. Connect your GitHub repository (`shivamsharmakr04/finance-Dashboard`).
3. Configure the following settings:
   - **Name**: `finova-pro-dashboard`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `(click Generate to create a secure random key)`
   - `MONGODB_URI` = `(Optional: your MongoDB Atlas connection string)`
5. Click **Create Web Service**.

---

## 🍃 MongoDB Atlas Setup (Optional)

Finova Pro runs out-of-the-box with its built-in JSON database engine. To connect a production MongoDB database:

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User and allow network access (`0.0.0.0/0`).
3. Copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/finovapro?retryWrites=true&w=majority
   ```
4. Paste the connection string into the `MONGODB_URI` environment variable on Render.

---

## ✅ Post-Deployment Verification

Once deployed, Render provides a unique URL (e.g. `https://finova-pro-dashboard.onrender.com`).
- REST endpoints run under `/api`
- Real-time WebSocket server runs under `/ws`
- The frontend UI automatically connects to the server origin and displays **Live Sync Active (WS)** in the navigation status pill.
