const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/summary - tổng quan tháng hiện tại
router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();

    const result = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) AS balance,
        COUNT(*) AS total_transactions
       FROM transactions
       WHERE user_id=$1 AND EXTRACT(MONTH FROM txn_date)=$2 AND EXTRACT(YEAR FROM txn_date)=$3`,
      [userId, m, y]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/dashboard/by-category
router.get('/by-category', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year, type = 'expense' } = req.query;
    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();

    const result = await db.query(
      `SELECT c.name AS category, c.icon, c.color, SUM(t.amount) AS amount, COUNT(*) AS count
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id=$1 AND t.type=$2
         AND EXTRACT(MONTH FROM t.txn_date)=$3
         AND EXTRACT(YEAR FROM t.txn_date)=$4
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY amount DESC`,
      [userId, type, m, y]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/dashboard/monthly-trend - 6 tháng gần nhất
router.get('/monthly-trend', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
        TO_CHAR(DATE_TRUNC('month', txn_date), 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE user_id=$1 AND txn_date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', txn_date)
       ORDER BY month ASC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// GET /api/dashboard/recent-transactions
router.get('/recent', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id=$1
       ORDER BY t.txn_date DESC, t.created_at DESC
       LIMIT 10`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
