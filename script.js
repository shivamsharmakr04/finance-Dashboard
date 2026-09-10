/* ═════════════════════════════════════════════════════════════════════
   FINOVA PRO - FRONTEND API CLIENT & REAL-TIME INTEGRATION ENGINE
   ═════════════════════════════════════════════════════════════════════ */

const API_BASE_URL = 'http://localhost:5000/api';

// Default Fallback Categories
const DEFAULT_CATEGORIES = {
  food: { name: "Food & Dining", icon: "🍔", color: "#10b981" },
  transport: { name: "Transport & Travel", icon: "🚗", color: "#06b6d4" },
  shopping: { name: "Shopping", icon: "🛍️", color: "#8b5cf6" },
  utilities: { name: "Utilities & Bills", icon: "⚡", color: "#f59e0b" },
  health: { name: "Health & Fitness", icon: "💊", color: "#f43f5e" },
  entertainment: { name: "Entertainment", icon: "🎬", color: "#6366f1" },
  salary: { name: "Salary", icon: "💼", color: "#10b981" },
  freelance: { name: "Freelance Work", icon: "💻", color: "#06b6d4" },
  investment: { name: "Investments", icon: "📈", color: "#8b5cf6" },
  other: { name: "Other", icon: "📦", color: "#64748b" }
};

const CURRENCY_SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

// Application Client State
let authToken = localStorage.getItem('finova_jwt_token') || null;
let currentUser = JSON.parse(localStorage.getItem('finova_current_user')) || null;

let transactions = [];
let goals = [];
let budgets = {};
let subscriptions = [];
let aiPredictionData = null;

let currency = localStorage.getItem('finova_pro_currency') || 'INR';
let theme = localStorage.getItem('finova_pro_theme') || 'dark';

let currentPage = 1;
const PER_PAGE = 8;
let sortCol = 'date';
let sortDir = 'desc';
let editingTxnId = null;
let trendPeriod = 12;
let chartInstances = {};

// ── Generic API Helper Function ──
async function fetchAPI(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Request failed');
    return data;
  } catch (err) {
    console.warn(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
}

// ── Master Initialization ──
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(theme);
  
  if (authToken && currentUser) {
    try {
      const res = await fetchAPI('/auth/me');
      currentUser = res.user;
      localStorage.setItem('finova_current_user', JSON.stringify(currentUser));
      showApp();
    } catch (e) {
      handleLogout();
    }
  } else {
    showLoginScreen();
  }
});

// ── Authentication Engine ──
function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
}

async function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  initUI();
  await loadUserData();
  renderAllViews();
}

function switchAuthTab(tab) {
  const isSignIn = tab === 'signin';
  document.getElementById('tabSignIn').classList.toggle('active', isSignIn);
  document.getElementById('tabSignUp').classList.toggle('active', !isSignIn);
  document.getElementById('formSignIn').style.display = isSignIn ? 'block' : 'none';
  document.getElementById('formSignUp').style.display = isSignIn ? 'none' : 'block';
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();

  try {
    const res = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    authToken = res.token;
    currentUser = res.user;
    localStorage.setItem('finova_jwt_token', authToken);
    localStorage.setItem('finova_current_user', JSON.stringify(currentUser));

    await showApp();
    showToast(`Welcome back, ${currentUser.name}!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const role = document.getElementById('regRole').value;

  try {
    const res = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, role })
    });

    authToken = res.token;
    currentUser = res.user;
    localStorage.setItem('finova_jwt_token', authToken);
    localStorage.setItem('finova_current_user', JSON.stringify(currentUser));

    await showApp();
    showToast(`Account registered! Welcome ${name}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function demoLogin(userId) {
  const emails = {
    'u1': 'alex@finova.io',
    'u2': 'sarah@finova.io',
    'u3': 'admin@finova.io'
  };
  const email = emails[userId];
  if (email) {
    document.getElementById('loginEmail').value = email;
    try {
      const res = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      authToken = res.token;
      currentUser = res.user;
      localStorage.setItem('finova_jwt_token', authToken);
      localStorage.setItem('finova_current_user', JSON.stringify(currentUser));
      await showApp();
      showToast(`Signed in as ${currentUser.name} (${currentUser.role.toUpperCase()})`, 'success');
    } catch (err) {
      showToast('Demo login failed: ' + err.message, 'error');
    }
  }
}

function handleLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('finova_jwt_token');
  localStorage.removeItem('finova_current_user');
  showLoginScreen();
  showToast('Logged out of workspace.', 'success');
}

// ── Real-Time Workspace Data Sync ──
async function loadUserData() {
  try {
    const [txnsData, goalsData, budgetsData, subsData, predictions] = await Promise.all([
      fetchAPI('/transactions'),
      fetchAPI('/goals'),
      fetchAPI('/budgets'),
      fetchAPI('/subscriptions'),
      fetchAPI('/predictions').catch(() => null)
    ]);

    transactions = txnsData || [];
    goals = goalsData || [];
    budgets = budgetsData || {};
    subscriptions = subsData || [];
    aiPredictionData = predictions;
  } catch (err) {
    console.warn('Failed syncing real-time backend data:', err.message);
  }
}

// ── UI Setup ──
function initUI() {
  document.getElementById('currencySelector').value = currency;
  document.getElementById('settingCurrency').value = currency;
  document.getElementById('settingName').value = currentUser.name;
  
  document.getElementById('sidebarName').textContent = currentUser.name;
  document.getElementById('sidebarAvatar').textContent = currentUser.avatar;
  document.getElementById('sidebarRoleBadge').textContent = currentUser.role === 'admin' ? '⚡ Master Admin' : 'Pro User';

  const isAdm = currentUser.role === 'admin';
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdm ? (el.tagName === 'DIV' ? 'block' : 'flex') : 'none';
  });

  const topBadge = document.getElementById('topbarRoleBadge');
  if (topBadge) {
    topBadge.textContent = currentUser.role.toUpperCase();
    topBadge.className = isAdm ? 'badge-admin' : 'badge-user';
  }

  document.getElementById('greetingHeader').textContent = `Welcome back, ${currentUser.name.split(' ')[0]} ✦`;
  document.getElementById('txDate').value = new Date().toISOString().split('T')[0];

  populateCategoryDropdowns();
}

function navigate(pageId) {
  if (pageId === 'admin' && currentUser.role !== 'admin') {
    showToast('Access denied: Admin privileges required.', 'error');
    return;
  }

  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-page') === pageId);
  });

  document.querySelectorAll('.page-view').forEach(page => {
    page.classList.remove('active');
  });

  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  const titles = {
    'dashboard': 'Dashboard Overview',
    'transactions': 'Transaction Manager',
    'budgets-goals': 'Savings Goals & Budgets',
    'subscriptions': 'Recurring Subscriptions',
    'analytics': 'AI Analytics & Health',
    'admin': 'Master Administration Control',
    'settings': 'Preferences & Data'
  };
  document.getElementById('pageTitle').textContent = titles[pageId] || 'Workspace';

  toggleSidebar(false);
  renderAllViews();
}

function toggleSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (open) {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  } else {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
}

function formatCurrency(amount) {
  const symbol = CURRENCY_SYMBOLS[currency] || "₹";
  return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  localStorage.setItem('finova_pro_theme', theme);
  reinitCharts();
}

function applyTheme(th) {
  document.documentElement.setAttribute('data-theme', th);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = th === 'dark' ? '☀️' : '🌙';
}

function changeCurrency(curr) {
  currency = curr;
  document.getElementById('currencySelector').value = curr;
  document.getElementById('settingCurrency').value = curr;
  localStorage.setItem('finova_pro_currency', curr);
  renderAllViews();
  showToast(`Currency updated to ${curr}`, 'success');
}

// ── Master Render Engine ──
function renderAllViews() {
  renderStatCards();
  renderRecentTxns();
  renderTransactions();
  renderGoals();
  renderBudgets();
  renderSubscriptions();
  renderAIAdvisor();
  renderAdminPanel();
  updateBadge();
  initCharts();
}

function updateBadge() {
  document.getElementById('txnBadge').textContent = transactions.length;
}

function renderStatCards() {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += Number(t.amount);
    if (t.type === 'expense') totalExpense += Number(t.amount);
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  document.getElementById('statBalance').textContent = formatCurrency(netBalance);
  document.getElementById('statIncome').textContent = formatCurrency(totalIncome);
  document.getElementById('statExpense').textContent = formatCurrency(totalExpense);
  document.getElementById('statSavings').textContent = `${savingsRate.toFixed(1)}%`;
}

function renderRecentTxns() {
  const container = document.getElementById('recentTxnList');
  if (!container) return;

  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">No recent transactions</div>`;
    return;
  }

  container.innerHTML = recent.map(t => {
    const cat = DEFAULT_CATEGORIES[t.category] || { icon: "📦", name: t.category };
    const isIncome = t.type === 'income';
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border);">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; border-radius:var(--radius-md); background:var(--surface-input); display:flex; align-items:center; justify-content:center; font-size:16px;">
            ${cat.icon}
          </div>
          <div>
            <div style="font-weight:700; font-size:13px;">${t.description}</div>
            <div style="font-size:11px; color:var(--text-muted);">${t.date}</div>
          </div>
        </div>
        <div class="amount-cell ${isIncome ? 'amount-income' : 'amount-expense'}">
          ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
        </div>
      </div>
    `;
  }).join('');
}

function populateCategoryDropdowns() {
  const txCat = document.getElementById('txCategory');
  const filterCat = document.getElementById('filterCategory');
  const budgetCat = document.getElementById('budgetCategorySelect');

  const optionsHTML = Object.keys(DEFAULT_CATEGORIES).map(key => {
    const c = DEFAULT_CATEGORIES[key];
    return `<option value="${key}">${c.icon} ${c.name}</option>`;
  }).join('');

  if (txCat) txCat.innerHTML = optionsHTML;
  if (budgetCat) budgetCat.innerHTML = optionsHTML;
  if (filterCat) filterCat.innerHTML = `<option value="">All Categories</option>` + optionsHTML;
}

function renderTransactions() {
  const tbody = document.getElementById('txnTableBody');
  if (!tbody) return;

  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const filterType = document.getElementById('filterType')?.value || '';
  const filterCat = document.getElementById('filterCategory')?.value || '';

  let filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search) || t.amount.toString().includes(search);
    const matchesType = !filterType || t.type === filterType;
    const matchesCat = !filterCat || t.category === filterCat;
    return matchesSearch && matchesType && matchesCat;
  });

  filtered.sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    if (sortCol === 'amount') { valA = Number(valA); valB = Number(valB); }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const total = filtered.length;
  const startIdx = (currentPage - 1) * PER_PAGE;
  const pageData = filtered.slice(startIdx, startIdx + PER_PAGE);

  document.getElementById('paginationInfo').textContent = `Showing ${pageData.length ? startIdx + 1 : 0} to ${Math.min(startIdx + PER_PAGE, total)} of ${total} entries`;

  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No transactions match your search.</td></tr>`;
    renderPaginationBtns(0);
    return;
  }

  tbody.innerHTML = pageData.map(t => {
    const cat = DEFAULT_CATEGORIES[t.category] || { icon: "📦", name: t.category };
    const isIncome = t.type === 'income';
    return `
      <tr>
        <td style="font-family:var(--font-mono); font-size:12px;">${t.date}</td>
        <td style="font-weight:700;">${t.description}</td>
        <td><span class="category-tag">${cat.icon} ${cat.name}</span></td>
        <td><span class="category-tag" style="background:${isIncome ? 'var(--primary-light)' : 'var(--rose-light)'}; color:${isIncome ? 'var(--primary)' : 'var(--rose)'};">${t.type.toUpperCase()}</span></td>
        <td class="amount-cell ${isIncome ? 'amount-income' : 'amount-expense'}">${isIncome ? '+' : '-'}${formatCurrency(t.amount)}</td>
        <td style="text-align:center;">
          <div style="display:flex; justify-content:center; gap:6px;">
            <button class="icon-btn" style="width:30px; height:30px; font-size:12px;" onclick="openTxnModal(${t.id})">✏️</button>
            <button class="icon-btn" style="width:30px; height:30px; font-size:12px; color:var(--rose);" onclick="deleteTransaction(${t.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderPaginationBtns(Math.ceil(total / PER_PAGE));
}

function renderPaginationBtns(totalPages) {
  const container = document.getElementById('paginationBtns');
  if (!container) return;

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<div class="page-num ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</div>`;
  }
  container.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  renderTransactions();
}

function sortBy(col) {
  if (sortCol === col) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = col;
    sortDir = 'desc';
  }
  renderTransactions();
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterCategory').value = '';
  renderTransactions();
}

function openTxnModal(id = null) {
  editingTxnId = id;
  const modal = document.getElementById('txnModal');
  const title = document.getElementById('txnModalTitle');

  if (id) {
    const t = transactions.find(x => x.id === id);
    if (t) {
      title.textContent = 'Edit Transaction';
      document.getElementById('txDesc').value = t.description;
      document.getElementById('txAmount').value = t.amount;
      document.getElementById('txType').value = t.type;
      document.getElementById('txCategory').value = t.category;
      document.getElementById('txDate').value = t.date;
    }
  } else {
    title.textContent = 'Add Transaction';
    document.getElementById('txDesc').value = '';
    document.getElementById('txAmount').value = '';
    document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
  }
  modal.classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  if (modalId === 'txnModal') {
    editingTxnId = null;
  }
}

async function saveTransaction() {
  const desc = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const type = document.getElementById('txType').value;
  const category = document.getElementById('txCategory').value;
  const date = document.getElementById('txDate').value;

  if (!desc || isNaN(amount) || amount <= 0 || !date) {
    showToast('Please enter a valid description, amount, and date.', 'error');
    return;
  }

  try {
    if (editingTxnId) {
      const updatedTxn = await fetchAPI(`/transactions/${editingTxnId}`, {
        method: 'PUT',
        body: JSON.stringify({ description: desc, amount, type, category, date })
      });
      const idx = transactions.findIndex(t => t.id === editingTxnId);
      if (idx !== -1) transactions[idx] = updatedTxn;
      editingTxnId = null;
    } else {
      const newTxn = await fetchAPI('/transactions', {
        method: 'POST',
        body: JSON.stringify({ description: desc, amount, type, category, date })
      });
      transactions.unshift(newTxn);
    }

    closeModal('txnModal');
    await loadUserData();
    renderAllViews();
    reinitCharts();
    showToast('Transaction saved to real-time server!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTransaction(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    try {
      await fetchAPI(`/transactions/${id}`, { method: 'DELETE' });
      transactions = transactions.filter(t => t.id !== id);
      await loadUserData();
      renderAllViews();
      reinitCharts();
      showToast('Transaction deleted.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

// ── Savings Goals Engine ──
function renderGoals() {
  const container = document.getElementById('goalsGrid');
  if (!container) return;

  container.innerHTML = goals.map(g => {
    const percent = Math.min(100, Math.round((g.current / g.target) * 100));
    return `
      <div class="goal-card">
        <div class="goal-header">
          <div class="goal-title">${g.icon || '🎯'} ${g.title}</div>
          <span class="category-tag" style="color:var(--primary);">${percent}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-fill primary" style="width: ${percent}%;"></div>
        </div>
        <div class="goal-meta">
          <span>Saved: ${formatCurrency(g.current)}</span>
          <span>Target: ${formatCurrency(g.target)}</span>
        </div>
        <div class="goal-actions">
          <button class="btn btn-ghost" style="flex:1; padding:6px; font-size:12px;" onclick="depositGoal(${g.id})">＋ Deposit</button>
          <button class="icon-btn" style="width:32px; height:32px; font-size:12px; color:var(--rose);" onclick="deleteGoal(${g.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function openGoalModal() {
  document.getElementById('goalTitle').value = '';
  document.getElementById('goalTarget').value = '';
  document.getElementById('goalCurrent').value = '';
  document.getElementById('goalModal').classList.add('active');
}

async function saveGoal() {
  const title = document.getElementById('goalTitle').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value);
  const current = parseFloat(document.getElementById('goalCurrent').value) || 0;

  if (!title || isNaN(target) || target <= 0) {
    showToast('Please enter a goal title and target amount.', 'error');
    return;
  }

  try {
    const newGoal = await fetchAPI('/goals', {
      method: 'POST',
      body: JSON.stringify({ title, target, current })
    });
    goals.push(newGoal);
    closeModal('goalModal');
    renderGoals();
    showToast('Savings goal saved to backend!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function depositGoal(id) {
  const amountStr = prompt('Enter deposit amount into this goal:');
  const amount = parseFloat(amountStr);
  if (!isNaN(amount) && amount > 0) {
    try {
      const updatedGoal = await fetchAPI(`/goals/${id}/deposit`, {
        method: 'PUT',
        body: JSON.stringify({ amount })
      });
      const index = goals.findIndex(g => g.id === id);
      if (index !== -1) goals[index] = updatedGoal;
      renderGoals();
      showToast(`Deposited ${formatCurrency(amount)} into ${updatedGoal.title}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

async function deleteGoal(id) {
  if (confirm('Delete this goal?')) {
    try {
      await fetchAPI(`/goals/${id}`, { method: 'DELETE' });
      goals = goals.filter(g => g.id !== id);
      renderGoals();
      showToast('Goal removed.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

// ── Category Budgets Engine ──
function renderBudgets() {
  const container = document.getElementById('budgetsGrid');
  if (!container) return;

  const currentMonthExpenses = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    currentMonthExpenses[t.category] = (currentMonthExpenses[t.category] || 0) + Number(t.amount);
  });

  container.innerHTML = Object.keys(budgets).map(catKey => {
    const limit = budgets[catKey];
    const spent = currentMonthExpenses[catKey] || 0;
    const percent = Math.min(100, Math.round((spent / limit) * 100));
    const cat = DEFAULT_CATEGORIES[catKey] || { icon: "📦", name: catKey };

    let fillClass = "primary";
    if (percent > 90) fillClass = "rose";
    else if (percent > 75) fillClass = "amber";

    return `
      <div class="budget-card">
        <div class="goal-header">
          <div class="goal-title">${cat.icon} ${cat.name}</div>
          <span style="font-weight:700; font-size:12px; color:${percent > 90 ? 'var(--rose)' : 'var(--text-secondary)'};">${percent}% Spent</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-fill ${fillClass}" style="width: ${percent}%;"></div>
        </div>
        <div class="goal-meta">
          <span>Spent: ${formatCurrency(spent)}</span>
          <span>Limit: ${formatCurrency(limit)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function openBudgetModal() {
  document.getElementById('budgetModal').classList.add('active');
}

async function saveBudgetLimit() {
  const category = document.getElementById('budgetCategorySelect').value;
  const limit = parseFloat(document.getElementById('budgetLimitInput').value);

  if (isNaN(limit) || limit <= 0) {
    showToast('Please enter a valid monthly limit.', 'error');
    return;
  }

  try {
    const updatedBudgets = await fetchAPI('/budgets', {
      method: 'POST',
      body: JSON.stringify({ category, limit })
    });
    budgets = updatedBudgets;
    closeModal('budgetModal');
    renderBudgets();
    renderAIAdvisor();
    showToast('Budget limit updated!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Subscriptions Engine ──
function renderSubscriptions() {
  const container = document.getElementById('subsGrid');
  if (!container) return;

  let totalMonthlyCost = 0;
  subscriptions.forEach(s => {
    if (s.active) totalMonthlyCost += Number(s.cost);
  });

  document.getElementById('totalSubCost').textContent = formatCurrency(totalMonthlyCost);

  const today = new Date().getDate();

  container.innerHTML = subscriptions.map(s => {
    const daysLeft = s.day >= today ? s.day - today : 30 - (today - s.day);
    return `
      <div class="sub-card">
        <div class="goal-header">
          <div class="goal-title">🔄 ${s.name}</div>
          <span class="category-tag" style="background:var(--secondary-light); color:var(--secondary);">${daysLeft}d left</span>
        </div>
        <div style="font-family:var(--font-mono); font-size:18px; font-weight:700; margin: 8px 0;">
          ${formatCurrency(s.cost)} <span style="font-size:11px; color:var(--text-muted);">/ mo</span>
        </div>
        <div class="goal-meta">
          <span>Renews on day ${s.day}</span>
          <button class="icon-btn" style="width:28px; height:28px; font-size:11px; color:var(--rose);" onclick="deleteSubscription(${s.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function openSubModal() {
  document.getElementById('subName').value = '';
  document.getElementById('subCost').value = '';
  document.getElementById('subDay').value = '';
  document.getElementById('subModal').classList.add('active');
}

async function saveSubscription() {
  const name = document.getElementById('subName').value.trim();
  const cost = parseFloat(document.getElementById('subCost').value);
  const day = parseInt(document.getElementById('subDay').value);

  if (!name || isNaN(cost) || cost <= 0 || isNaN(day) || day < 1 || day > 31) {
    showToast('Please enter valid subscription details.', 'error');
    return;
  }

  try {
    const newSub = await fetchAPI('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ name, cost, day })
    });
    subscriptions.push(newSub);
    closeModal('subModal');
    renderSubscriptions();
    showToast('Subscription saved to backend!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteSubscription(id) {
  if (confirm('Remove subscription?')) {
    try {
      await fetchAPI(`/subscriptions/${id}`, { method: 'DELETE' });
      subscriptions = subscriptions.filter(s => s.id !== id);
      renderSubscriptions();
      showToast('Subscription removed.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

// ── 🤖 REAL-TIME AI PREDICTIONS ENGINE ──
async function renderAIAdvisor() {
  const scoreEl = document.getElementById('healthScoreVal');
  const textEl = document.getElementById('aiAdvisorText');
  const burnEl = document.getElementById('burnRateVal');

  if (aiPredictionData && aiPredictionData.metrics) {
    const m = aiPredictionData.metrics;
    if (scoreEl) scoreEl.textContent = `${m.healthScore} / 100`;
    if (textEl) textEl.textContent = aiPredictionData.advisorRecommendation;
    if (burnEl) burnEl.textContent = m.overbudgetRatioPercent > 80 ? 'High' : 'Optimal';
  } else {
    // Local calculation fallback
    let income = 0, expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      if (t.type === 'expense') expense += Number(t.amount);
    });

    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    let score = 75;
    if (savingsRate > 30) score += 15;
    else if (savingsRate < 15) score -= 15;

    if (scoreEl) scoreEl.textContent = `${score} / 100`;
    if (textEl) textEl.textContent = "Real-time forecasting active. Maintain a steady savings rate buffer!";
  }

  renderCategoryVelocityList();
}

function renderCategoryVelocityList() {
  const container = document.getElementById('categoryProgressList');
  if (!container) return;

  const expenses = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    expenses[t.category] = (expenses[t.category] || 0) + Number(t.amount);
  });

  const totalExpense = Object.values(expenses).reduce((a, b) => a + b, 0) || 1;

  container.innerHTML = Object.keys(expenses).map(catKey => {
    const spent = expenses[catKey];
    const pct = Math.round((spent / totalExpense) * 100);
    const cat = DEFAULT_CATEGORIES[catKey] || { icon: "📦", name: catKey };

    return `
      <div>
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:4px;">
          <span>${cat.icon} ${cat.name}</span>
          <span style="font-family:var(--font-mono);">${formatCurrency(spent)} (${pct}%)</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-fill primary" style="width:${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ── ⚡ MASTER ADMIN API ENGINE ──
async function renderAdminPanel() {
  if (!currentUser || currentUser.role !== 'admin') return;

  const tbody = document.getElementById('adminUserTableBody');
  if (!tbody) return;

  try {
    const [stats, adminUsers] = await Promise.all([
      fetchAPI('/admin/stats'),
      fetchAPI('/admin/users')
    ]);

    document.getElementById('adminStatUsers').textContent = stats.totalUsers;
    document.getElementById('adminStatVolume').textContent = formatCurrency(stats.totalVolume);
    document.getElementById('adminStatTxns').textContent = stats.totalTransactions;

    tbody.innerHTML = adminUsers.map(u => {
      const isAdmin = u.role === 'admin';
      return `
        <tr>
          <td style="font-family:var(--font-mono); font-size:12px;">${u.id}</td>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="user-avatar" style="width:32px; height:32px; font-size:11px;">${u.avatar}</div>
              <div>
                <div style="font-weight:700;">${u.name}</div>
                <div style="font-size:11px; color:var(--text-muted);">${u.email}</div>
              </div>
            </div>
          </td>
          <td><span class="${isAdmin ? 'badge-admin' : 'badge-user'}">${u.role.toUpperCase()}</span></td>
          <td style="text-align:right; font-family:var(--font-mono); font-weight:700; color:${u.netBalance >= 0 ? 'var(--primary)' : 'var(--rose)'};">
            ${formatCurrency(u.netBalance || 0)}
          </td>
          <td style="text-align:center; font-family:var(--font-mono);">${u.txnCount || 0}</td>
          <td style="text-align:center;">
            <div style="display:flex; justify-content:center; gap:6px;">
              <button class="btn btn-ghost" style="padding:4px 8px; font-size:11px;" onclick="toggleUserRole('${u.id}')">
                ${isAdmin ? 'Demote User' : 'Promote Admin'}
              </button>
              <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="inspectUserDashboard('${u.id}')">
                👁️ Inspect
              </button>
              ${u.id !== currentUser.id ? `
                <button class="icon-btn" style="width:28px; height:28px; font-size:11px; color:var(--rose);" onclick="deleteUser('${u.id}')" title="Delete User">🗑️</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.warn('Admin API Error:', err.message);
  }
}

async function toggleUserRole(userId) {
  try {
    const updated = await fetchAPI(`/admin/users/${userId}/role`, { method: 'PUT' });
    showToast(`Updated role for ${updated.name} to ${updated.role.toUpperCase()}`, 'success');
    await renderAdminPanel();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function inspectUserDashboard(userId) {
  await demoLogin(userId);
  navigate('dashboard');
}

async function deleteUser(userId) {
  if (confirm('Delete this user account?')) {
    try {
      await fetchAPI(`/admin/users/${userId}`, { method: 'DELETE' });
      showToast('User account deleted.', 'success');
      await renderAdminPanel();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

function openAddUserModal() {
  document.getElementById('newUserName').value = '';
  document.getElementById('newUserEmail').value = '';
  document.getElementById('addUserModal').classList.add('active');
}

async function saveNewUser() {
  const name = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
  const role = document.getElementById('newUserRole').value;

  if (!name || !email) {
    showToast('Please enter name and email.', 'error');
    return;
  }

  try {
    await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, role })
    });
    closeModal('addUserModal');
    showToast(`User ${name} created on real-time server!`, 'success');
    await renderAdminPanel();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function exportGlobalAudit() {
  const auditData = {
    system: "Finova Pro Real-Time Server Audit",
    timestamp: new Date().toISOString(),
    user: currentUser,
    transactions,
    goals,
    budgets,
    subscriptions
  };

  const jsonStr = JSON.stringify(auditData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `finova_pro_audit_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('System audit log exported!', 'success');
}

async function factoryResetSystem() {
  if (confirm('Factory reset system? Erases server database.')) {
    try {
      await fetchAPI('/admin/reset', { method: 'POST' });
      showToast('System reset complete.', 'success');
      handleLogout();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

// ── Chart.js Engine ──
function initCharts() {
  reinitCharts();
}

function reinitCharts() {
  Object.values(chartInstances).forEach(chart => chart && chart.destroy());
  chartInstances = {};

  initBalanceTrendChart();
  initCategoryDonutChart();
  initCashflowBarChart();
  initAnalyticsBarChart();
}

function setTrendPeriod(months, btn) {
  trendPeriod = months;
  if (btn) {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.replace('btn-primary', 'btn-ghost'));
    btn.classList.replace('btn-ghost', 'btn-primary');
  }
  initBalanceTrendChart();
}

function getMonthlySummary(monthsCount = 6) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const months = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = monthNames[d.getMonth()];
    
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.date && t.date.startsWith(prefix)) {
        if (t.type === 'income') income += Number(t.amount);
        if (t.type === 'expense') expense += Number(t.amount);
      }
    });

    months.push({ label, income, expense, net: income - expense });
  }

  const hasData = months.some(m => m.income > 0 || m.expense > 0);
  if (!hasData && transactions.length > 0) {
    let inc = 0, exp = 0;
    transactions.forEach(t => {
      if (t.type === 'income') inc += Number(t.amount);
      if (t.type === 'expense') exp += Number(t.amount);
    });
    months[months.length - 1].income = inc;
    months[months.length - 1].expense = exp;
    months[months.length - 1].net = inc - exp;
  }

  return months;
}

function initBalanceTrendChart() {
  const ctx = document.getElementById('balanceTrendChart')?.getContext('2d');
  if (!ctx) return;

  const monthlyData = getMonthlySummary(trendPeriod);
  const labels = monthlyData.map(m => m.label);
  
  let runningBalance = 0;
  const dataPoints = monthlyData.map(m => {
    runningBalance += m.net;
    return runningBalance;
  });

  chartInstances.balance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Net Balance',
        data: dataPoints,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function initCategoryDonutChart() {
  const ctx = document.getElementById('categoryDonutChart')?.getContext('2d');
  if (!ctx) return;

  const catSums = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catSums[t.category] = (catSums[t.category] || 0) + Number(t.amount);
  });

  const labels = Object.keys(catSums).length ? Object.keys(catSums).map(k => DEFAULT_CATEGORIES[k]?.name || k) : ['No Expenses'];
  const data = Object.keys(catSums).length ? Object.values(catSums) : [1];
  const bgColors = Object.keys(catSums).length ? Object.keys(catSums).map(k => DEFAULT_CATEGORIES[k]?.color || '#64748b') : ['#1e293b'];

  chartInstances.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: bgColors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
    }
  });
}

function initCashflowBarChart() {
  const ctx = document.getElementById('cashflowBarChart')?.getContext('2d');
  if (!ctx) return;

  const monthlyData = getMonthlySummary(4);
  const labels = monthlyData.map(m => m.label);
  const incomeData = monthlyData.map(m => m.income);
  const expenseData = monthlyData.map(m => m.expense);

  chartInstances.cashflow = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: incomeData, backgroundColor: '#10b981', borderRadius: 6 },
        { label: 'Expense', data: expenseData, backgroundColor: '#f43f5e', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function initAnalyticsBarChart() {
  const ctx = document.getElementById('analyticsBarChart')?.getContext('2d');
  if (!ctx) return;

  const monthlyData = getMonthlySummary(6);
  const labels = monthlyData.map(m => m.label);
  const netData = monthlyData.map(m => m.net);

  chartInstances.analytics = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Net Cashflow Growth', data: netData, backgroundColor: '#6366f1', borderRadius: 8 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

// ── Preferences & Backup ──
function saveUserSettings() {
  const newName = document.getElementById('settingName').value.trim();
  if (newName && currentUser) {
    currentUser.name = newName;
    document.getElementById('sidebarName').textContent = currentUser.name;
    document.getElementById('greetingHeader').textContent = `Welcome back, ${currentUser.name.split(' ')[0]} ✦`;
    localStorage.setItem('finova_current_user', JSON.stringify(currentUser));
    showToast('Profile settings saved!', 'success');
  }
}

function exportCSV() {
  if (!transactions.length) {
    showToast('No transactions to export.', 'error');
    return;
  }
  const headers = ['ID', 'Date', 'Description', 'Category', 'Type', 'Amount'];
  const rows = transactions.map(t => [t.id, t.date, `"${t.description}"`, t.category, t.type, t.amount]);
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `finova_pro_${currentUser.name.replace(/\s+/g, '_')}_txns.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Transactions exported as CSV!', 'success');
}

function exportJSONBackup() {
  const backupData = {
    user: currentUser,
    transactions,
    goals,
    budgets,
    subscriptions,
    currency,
    theme,
    version: "2.0"
  };
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `finova_pro_${currentUser.name.replace(/\s+/g, '_')}_backup.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('JSON backup exported!', 'success');
}

function importJSONBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.transactions) transactions = data.transactions;
      if (data.goals) goals = data.goals;
      if (data.budgets) budgets = data.budgets;
      if (data.subscriptions) subscriptions = data.subscriptions;

      renderAllViews();
      reinitCharts();
      showToast('Workspace backup restored!', 'success');
    } catch (err) {
      showToast('Invalid backup file format.', 'error');
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (confirm('Reset workspace data to demo records?')) {
    loadUserData();
    renderAllViews();
    reinitCharts();
    showToast('Workspace data reset.', 'success');
  }
}

// ── Toast System ──
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}