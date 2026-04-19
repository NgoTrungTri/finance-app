const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/transactions - list with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, category_id, start_date, end_date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['t.user_id = $1'];
    let params = [userId];
    let idx = 2;

    if (type) { conditions.push(`t.type = $${idx++}`); params.push(type); }
    if (category_id) { conditions.push(`t.category_id = $${idx++}`); params.push(category_id); }
    if (start_date) { conditions.push(`t.txn_date >= $${idx++}`); params.push(start_date); }
    if (end_date) { conditions.push(`t.txn_date <= $${idx++}`); params.push(end_date); }

    const where = conditions.join(' AND ');
    const countResult = await db.query(`SELECT COUNT(*) FROM transactions t WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE ${where}
       ORDER BY t.txn_date DESC, t.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({ success: true, data: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/transactions - create
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, type, category_id, description, txn_date } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập số tiền và loại giao dịch' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Loại giao dịch không hợp lệ' });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền phải lớn hơn 0' });
    }

    const result = await db.query(
      `INSERT INTO transactions (user_id, amount, type, category_id, description, txn_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, amount, type, category_id || null, description || '', txn_date || new Date().toISOString().split('T')[0]]
    );

    // Check budget alerts after adding expense
    if (type === 'expense' && category_id) {
      await checkBudgetAlert(userId, category_id);
    }

    const tx = result.rows[0];
    const catResult = await db.query('SELECT name, icon, color FROM categories WHERE id = $1', [tx.category_id]);
    const cat = catResult.rows[0] || {};

    res.status(201).json({ success: true, data: { ...tx, category_name: cat.name, category_icon: cat.icon, category_color: cat.color } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount, type, category_id, description, txn_date } = req.body;

    const check = await db.query('SELECT id FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });

    const result = await db.query(
      `UPDATE transactions SET amount=$1, type=$2, category_id=$3, description=$4, txn_date=$5, updated_at=NOW()
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [amount, type, category_id, description, txn_date, id, userId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query('DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING id', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });

    res.json({ success: true, message: 'Đã xóa giao dịch' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

async function checkBudgetAlert(userId, categoryId) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgetResult = await db.query(
      'SELECT * FROM budgets WHERE user_id=$1 AND category_id=$2 AND month=$3 AND year=$4',
      [userId, categoryId, month, year]
    );
    if (budgetResult.rows.length === 0) return;

    const budget = budgetResult.rows[0];
    const spentResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions
       WHERE user_id=$1 AND category_id=$2 AND type='expense'
       AND DATE_TRUNC('month', txn_date) = DATE_TRUNC('month', CURRENT_DATE)`,
      [userId, categoryId]
    );
    const spent = parseFloat(spentResult.rows[0].spent);
    const limit = parseFloat(budget.limit_amount);
    const pct = (spent / limit) * 100;
    const threshold = budget.alert_threshold || 80;

    const catResult = await db.query('SELECT name FROM categories WHERE id=$1', [categoryId]);
    const catName = catResult.rows[0]?.name || 'danh mục';

    if (pct >= 100) {
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [userId, '🚨 Vượt ngân sách!', `Danh mục "${catName}" đã vượt ${pct.toFixed(0)}% ngân sách tháng này`, 'danger']
      );
    } else if (pct >= threshold) {
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [userId, '⚠️ Gần đạt ngân sách', `Danh mục "${catName}" đã dùng ${pct.toFixed(0)}% ngân sách tháng này`, 'warning']
      );
    }
  } catch (e) {
    console.error('Budget check error:', e);
  }
}

module.exports = router;
