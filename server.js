/* ═════════════════════════════════════════════════════════════════════
   FINOVA PRO - REAL-TIME EXPRESS BACKEND & AI PREDICTIONS API
   ═════════════════════════════════════════════════════════════════════ */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'finova_pro_jwt_secret_key_2026';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Database File Helper Functions ──
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { users: [], transactions: {}, goals: {}, budgets: {}, subscriptions: {} };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// ── JWT Authentication Middleware ──
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin privileges required' });
  }
}

// ── Authentication Endpoints ──

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

  const db = readDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'US';
  const newUser = {
    id: `u_${Date.now()}`,
    name,
    email,
    role: role || 'user',
    avatar: initials
  };

  db.users.push(newUser);
  db.transactions[newUser.id] = [];
  db.goals[newUser.id] = [];
  db.budgets[newUser.id] = { food: 12000, shopping: 10000, transport: 6000, utilities: 5000, entertainment: 4000 };
  db.subscriptions[newUser.id] = [];
  writeDB(db);

  const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, avatar: newUser.avatar }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: newUser });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) return res.status(404).json({ error: 'Account not found' });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

// Get Current Auth User
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ── Workspace CRUD Endpoints ──

// Transactions
app.get('/api/transactions', authenticateToken, (req, res) => {
  const db = readDB();
  const txns = db.transactions[req.user.id] || [];
  res.json(txns);
});

app.post('/api/transactions', authenticateToken, (req, res) => {
  const { description, amount, type, category, date } = req.body;
  if (!description || !amount || !date) return res.status(400).json({ error: 'Missing required fields' });

  const db = readDB();
  if (!db.transactions[req.user.id]) db.transactions[req.user.id] = [];

  const newId = db.transactions[req.user.id].length ? Math.max(...db.transactions[req.user.id].map(t => t.id)) + 1 : 1;
  const newTxn = { id: newId, description, amount: Number(amount), type, category, date };

  db.transactions[req.user.id].unshift(newTxn);
  writeDB(db);
  res.status(201).json(newTxn);
});

app.put('/api/transactions/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const { description, amount, type, category, date } = req.body;
  const db = readDB();
  const txns = db.transactions[req.user.id] || [];
  const idx = txns.findIndex(t => t.id === id);

  if (idx !== -1) {
    txns[idx] = { ...txns[idx], description, amount: Number(amount), type, category, date };
    writeDB(db);
    return res.json(txns[idx]);
  }
  res.status(404).json({ error: 'Transaction not found' });
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  if (db.transactions[req.user.id]) {
    db.transactions[req.user.id] = db.transactions[req.user.id].filter(t => t.id !== id);
    writeDB(db);
  }
  res.json({ success: true });
});

// Goals
app.get('/api/goals', authenticateToken, (req, res) => {
  const db = readDB();
  res.json(db.goals[req.user.id] || []);
});

app.post('/api/goals', authenticateToken, (req, res) => {
  const { title, target, current } = req.body;
  const db = readDB();
  if (!db.goals[req.user.id]) db.goals[req.user.id] = [];

  const newGoal = {
    id: Date.now(),
    title,
    target: Number(target),
    current: Number(current) || 0,
    icon: "🎯"
  };

  db.goals[req.user.id].push(newGoal);
  writeDB(db);
  res.status(201).json(newGoal);
});

app.put('/api/goals/:id/deposit', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const { amount } = req.body;
  const db = readDB();
  const goalList = db.goals[req.user.id] || [];
  const goal = goalList.find(g => g.id === id);

  if (goal) {
    goal.current += Number(amount);
    writeDB(db);
    return res.json(goal);
  }
  res.status(404).json({ error: 'Goal not found' });
});

app.delete('/api/goals/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  if (db.goals[req.user.id]) {
    db.goals[req.user.id] = db.goals[req.user.id].filter(g => g.id !== id);
    writeDB(db);
  }
  res.json({ success: true });
});

// Budgets
app.get('/api/budgets', authenticateToken, (req, res) => {
  const db = readDB();
  res.json(db.budgets[req.user.id] || {});
});

app.post('/api/budgets', authenticateToken, (req, res) => {
  const { category, limit } = req.body;
  const db = readDB();
  if (!db.budgets[req.user.id]) db.budgets[req.user.id] = {};
  db.budgets[req.user.id][category] = Number(limit);
  writeDB(db);
  res.json(db.budgets[req.user.id]);
});

// Subscriptions
app.get('/api/subscriptions', authenticateToken, (req, res) => {
  const db = readDB();
  res.json(db.subscriptions[req.user.id] || []);
});

app.post('/api/subscriptions', authenticateToken, (req, res) => {
  const { name, cost, day } = req.body;
  const db = readDB();
  if (!db.subscriptions[req.user.id]) db.subscriptions[req.user.id] = [];

  const newSub = { id: Date.now(), name, cost: Number(cost), day: Number(day), active: true };
  db.subscriptions[req.user.id].push(newSub);
  writeDB(db);
  res.status(201).json(newSub);
});

app.delete('/api/subscriptions/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  if (db.subscriptions[req.user.id]) {
    db.subscriptions[req.user.id] = db.subscriptions[req.user.id].filter(s => s.id !== id);
    writeDB(db);
  }
  res.json({ success: true });
});

// ── 🤖 REAL-TIME AI PREDICTION & FORECASTING ENGINE ──
app.get('/api/predictions', authenticateToken, (req, res) => {
  const db = readDB();
  const txns = db.transactions[req.user.id] || [];
  const budgets = db.budgets[req.user.id] || {};

  let totalIncome = 0;
  let totalExpense = 0;
  const catSums = {};

  txns.forEach(t => {
    const amt = Number(t.amount);
    if (t.type === 'income') totalIncome += amt;
    if (t.type === 'expense') {
      totalExpense += amt;
      catSums[t.category] = (catSums[t.category] || 0) + amt;
    }
  });

  // Time-series exponential velocity prediction
  const velocityMultiplier = 1.06; // Projected 6% inflation/velocity adjustment
  const projectedExpense = Math.round(totalExpense * velocityMultiplier);
  const projectedSavings = Math.max(0, totalIncome - projectedExpense);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Identify highest risk category
  let topRiskCat = "none";
  let maxOverbudgetPct = 0;

  Object.keys(catSums).forEach(cat => {
    const limit = budgets[cat] || 10000;
    const spent = catSums[cat];
    const pct = Math.round((spent / limit) * 100);
    if (pct > maxOverbudgetPct) {
      maxOverbudgetPct = pct;
      topRiskCat = cat;
    }
  });

  // Dynamic Financial Health Scoring (0 - 100)
  let healthScore = 75;
  if (savingsRate > 30) healthScore += 18;
  else if (savingsRate > 15) healthScore += 8;
  else healthScore -= 12;

  if (maxOverbudgetPct > 90) healthScore -= 15;

  healthScore = Math.min(100, Math.max(10, healthScore));

  let advisorRecommendation = "Your monthly cashflow velocity is balanced. Keep maintaining your savings buffer!";
  if (healthScore > 85) {
    advisorRecommendation = "Outstanding financial pulse! Real-time forecast predicts healthy cashflow reserve next month.";
  } else if (healthScore < 60) {
    advisorRecommendation = `Alert: High spending velocity detected in ${topRiskCat.toUpperCase()} category (${maxOverbudgetPct}% of limit). Consider capping discretionary purchases.`;
  }

  res.json({
    realtimeTimestamp: new Date().toISOString(),
    metrics: {
      currentIncome: totalIncome,
      currentExpense: totalExpense,
      savingsRate,
      projectedNextMonthExpense: projectedExpense,
      projectedNextMonthSavings: projectedSavings,
      healthScore,
      highestRiskCategory: topRiskCat,
      overbudgetRatioPercent: maxOverbudgetPct
    },
    advisorRecommendation
  });
});

// ── ⚡ MASTER ADMIN API ──
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const db = readDB();
  let totalVolume = 0;
  let totalTxns = 0;

  Object.values(db.transactions).forEach(userTxns => {
    totalTxns += userTxns.length;
    userTxns.forEach(t => totalVolume += Number(t.amount));
  });

  res.json({
    totalUsers: db.users.length,
    totalVolume,
    totalTransactions: totalTxns,
    systemStatus: "100% Operational"
  });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const db = readDB();
  const userOverview = db.users.map(u => {
    const uTxns = db.transactions[u.id] || [];
    let inc = 0, exp = 0;
    uTxns.forEach(t => {
      if (t.type === 'income') inc += Number(t.amount);
      if (t.type === 'expense') exp += Number(t.amount);
    });
    return {
      ...u,
      netBalance: inc - exp,
      txnCount: uTxns.length
    };
  });
  res.json(userOverview);
});

app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  const uId = req.params.id;
  const db = readDB();
  const user = db.users.find(u => u.id === uId);
  if (user) {
    user.role = user.role === 'admin' ? 'user' : 'admin';
    writeDB(db);
    return res.json(user);
  }
  res.status(404).json({ error: 'User not found' });
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const uId = req.params.id;
  const db = readDB();
  db.users = db.users.filter(u => u.id !== uId);
  delete db.transactions[uId];
  delete db.goals[uId];
  delete db.budgets[uId];
  delete db.subscriptions[uId];
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/admin/reset', authenticateToken, requireAdmin, (req, res) => {
  const defaultDB = {
    users: [
      { id: "u1", name: "Alex Kumar", email: "alex@finova.io", role: "user", avatar: "AK" },
      { id: "u2", name: "Sarah Chen", email: "sarah@finova.io", role: "user", avatar: "SC" },
      { id: "u3", name: "Admin Master", email: "admin@finova.io", role: "admin", avatar: "AD" }
    ],
    transactions: { u1: [], u2: [], u3: [] },
    goals: { u1: [], u2: [] },
    budgets: { u1: { food: 12000, shopping: 10000 }, u2: {} },
    subscriptions: { u1: [], u2: [] }
  };
  writeDB(defaultDB);
  res.json({ success: true, message: 'System factory reset' });
});

app.listen(PORT, () => {
  console.log(`🚀 Finova Pro Real-Time Backend API running on http://localhost:${PORT}`);
});
