/* ═════════════════════════════════════════════════════════════════════
   FINOVA PRO - MONGODB & MONGOOSE DATABASE SERVICE
   ═════════════════════════════════════════════════════════════════════ */

const mongoose = require('mongoose');

let isConnected = false;

// ── Schemas & Models ──
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: 'US' },
  password: { type: String, required: true }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  id: { type: Number, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

const GoalSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  id: { type: Number, required: true },
  title: { type: String, required: true },
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  icon: { type: String, default: '🎯' }
}, { timestamps: true });

const BudgetSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true }
}, { timestamps: true });

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  id: { type: Number, required: true },
  name: { type: String, required: true },
  cost: { type: Number, required: true },
  day: { type: Number, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Goal = mongoose.model('Goal', GoalSchema);
const Budget = mongoose.model('Budget', BudgetSchema);
const Subscription = mongoose.model('Subscription', SubscriptionSchema);

async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️ MONGODB_URI not provided. Running with local persistent JSON database.');
    return false;
  }

  if (isConnected) return true;

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log('🍃 MongoDB Atlas Connected Successfully!');
    return true;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️ Falling back to local JSON database.');
    return false;
  }
}

function getMongoStatus() {
  return {
    isConnected,
    uriConfigured: !!process.env.MONGODB_URI
  };
}

module.exports = {
  connectMongoDB,
  getMongoStatus,
  User,
  Transaction,
  Goal,
  Budget,
  Subscription
};
