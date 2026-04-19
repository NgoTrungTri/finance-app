const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// ==================== CATEGORIES ====================
router.get('/categories', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM categories WHERE is_default=true OR user_id=$1 ORDER BY type, name`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.post('/categories', authenticate, async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name || !type) return res.status(400).json({ success: false, message: 'Thiếu thông tin danh mục' });

    const result = await db.query(
      'INSERT INTO categories (name, type, icon, color, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, type, icon || '📦', color || '#6366f1', req.user.id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ==================== BUDGETS ====================
router.get('/budgets', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();

    const result = await db.query(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
        COALESCE((
          SELECT SUM(t.amount) FROM transactions t
          WHERE t.user_id=b.user_id AND t.category_id=b.category_id AND t.type='expense'
          AND EXTRACT(MONTH FROM t.txn_date)=b.month AND EXTRACT(YEAR FROM t.txn_date)=b.year
        ), 0) AS spent_amount
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id=$1 AND b.month=$2 AND b.year=$3
       ORDER BY c.name`,
      [userId, m, y]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.post('/budgets', authenticate, async (req, res) => {
  try {
    const { category_id, limit_amount, alert_threshold, month, year } = req.body;
    if (!category_id || !limit_amount) return res.status(400).json({ success: false, message: 'Thiếu thông tin ngân sách' });

    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();

    const result = await db.query(
      `INSERT INTO budgets (user_id, category_id, limit_amount, alert_threshold, month, year)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, category_id, month, year)
       DO UPDATE SET limit_amount=$3, alert_threshold=$4
       RETURNING *`,
      [req.user.id, category_id, limit_amount, alert_threshold || 80, m, y]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.delete('/budgets/:id', authenticate, async (req, res) => {
  try {
    await db.query('DELETE FROM budgets WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Đã xóa ngân sách' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ==================== NOTIFICATIONS ====================
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

router.patch('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// ==================== PREDICTIONS ====================
router.get('/predictions/monthly', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear();

    // Average of last 3 months
    const avgResult = await db.query(
      `SELECT COALESCE(AVG(monthly_total), 0) AS avg_expense
       FROM (
         SELECT DATE_TRUNC('month', txn_date) AS m, SUM(amount) AS monthly_total
         FROM transactions
         WHERE user_id=$1 AND type='expense' AND txn_date >= CURRENT_DATE - INTERVAL '3 months'
         GROUP BY DATE_TRUNC('month', txn_date)
       ) sub`,
      [userId]
    );
    const predicted = parseFloat(avgResult.rows[0].avg_expense) || 0;

    // Upsert prediction
    await db.query(
      `INSERT INTO predictions (user_id, month, year, predicted_amount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, month, year) DO UPDATE SET predicted_amount=$4`,
      [userId, nextMonth, nextYear, predicted]
    );

    res.json({ success: true, data: { month: nextMonth, year: nextYear, predicted_amount: predicted } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
