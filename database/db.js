/* ═════════════════════════════════════════════════════════════════════
   FINOVA PRO - DATABASE SERVICE ENGINE
   ═════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const DB_DIR = __dirname;
const DB_FILE = path.join(DB_DIR, 'db.json');
const ROOT_DB_FILE = path.join(__dirname, '..', 'db.json');

// Ensure database directory & db.json file exist
function initializeDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    if (fs.existsSync(ROOT_DB_FILE)) {
      try {
        const rootContent = fs.readFileSync(ROOT_DB_FILE, 'utf8');
        fs.writeFileSync(DB_FILE, rootContent, 'utf8');
        console.log('📦 Database initialized from root db.json');
        return;
      } catch (err) {
        console.error('Error copying root db.json:', err);
      }
    }

    const defaultPasswordHash = '$2a$10$nMOJuWEwOlPWN11rsdWlqeBW6s/yV5bvKwSK0YHgfDQv3J0.vP7jy'; // password123
    const defaultData = {
      users: [
        { id: "u1", name: "Alex Kumar", email: "alex@finova.io", role: "user", avatar: "AK", password: defaultPasswordHash },
        { id: "u2", name: "Sarah Chen", email: "sarah@finova.io", role: "user", avatar: "SC", password: defaultPasswordHash },
        { id: "u3", name: "Admin Master", email: "admin@finova.io", role: "admin", avatar: "AD", password: defaultPasswordHash }
      ],
      transactions: { u1: [], u2: [], u3: [] },
      goals: { u1: [], u2: [] },
      budgets: { u1: { food: 12000, shopping: 10000 }, u2: {} },
      subscriptions: { u1: [], u2: [] }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    console.log('📦 Created fresh database at database/db.json');
  }
}

function readDB() {
  initializeDB();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return { users: [], transactions: {}, goals: {}, budgets: {}, subscriptions: {} };
  }
}

function writeDB(data) {
  initializeDB();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    // Keep root db.json in sync if it exists for backwards compatibility
    if (fs.existsSync(ROOT_DB_FILE)) {
      fs.writeFileSync(ROOT_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Error writing database:', err);
  }
}

module.exports = {
  readDB,
  writeDB,
  initializeDB,
  DB_FILE
};
