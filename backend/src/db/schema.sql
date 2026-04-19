-- ============================================
-- PERSONAL FINANCE MANAGEMENT SYSTEM - SCHEMA
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  icon VARCHAR(50) DEFAULT '💰',
  color VARCHAR(20) DEFAULT '#6366f1',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  category_id INTEGER REFERENCES categories(id),
  description TEXT,
  txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'csv')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  limit_amount DECIMAL(15,2) NOT NULL CHECK (limit_amount > 0),
  alert_threshold INTEGER DEFAULT 80 CHECK (alert_threshold BETWEEN 1 AND 100),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- Rules table (auto-categorization)
CREATE TABLE IF NOT EXISTS rules (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  predicted_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'warning' CHECK (type IN ('info', 'warning', 'danger', 'success')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, txn_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ============================================
-- DEFAULT CATEGORIES (system defaults)
-- ============================================
INSERT INTO categories (name, type, icon, color, is_default) VALUES
  ('Ăn uống / Food', 'expense', '🍜', '#ef4444', true),
  ('Di chuyển / Transport', 'expense', '🚗', '#f97316', true),
  ('Mua sắm / Shopping', 'expense', '🛍️', '#a855f7', true),
  ('Học tập / Education', 'expense', '📚', '#3b82f6', true),
  ('Giải trí / Entertainment', 'expense', '🎮', '#ec4899', true),
  ('Sức khỏe / Health', 'expense', '🏥', '#10b981', true),
  ('Hóa đơn / Bills', 'expense', '📄', '#6b7280', true),
  ('Khác / Others', 'expense', '📦', '#8b5cf6', true),
  ('Lương / Salary', 'income', '💼', '#22c55e', true),
  ('Freelance', 'income', '💻', '#06b6d4', true),
  ('Đầu tư / Investment', 'income', '📈', '#f59e0b', true),
  ('Khác / Other Income', 'income', '💰', '#84cc16', true)
ON CONFLICT DO NOTHING;
