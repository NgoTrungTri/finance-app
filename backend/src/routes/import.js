const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/import/csv
router.post('/csv', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng upload file CSV' });

  const results = [];
  const errors = [];
  let rowNum = 0;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          rowNum++;
          try {
            const amount = parseFloat(row.amount);
            const type = row.type?.trim().toLowerCase();
            const date = row.date?.trim();

            if (!amount || amount <= 0) { errors.push({ row: rowNum, error: 'Số tiền không hợp lệ' }); return; }
            if (!['income', 'expense'].includes(type)) { errors.push({ row: rowNum, error: 'Loại giao dịch phải là income hoặc expense' }); return; }
            if (!date || isNaN(Date.parse(date))) { errors.push({ row: rowNum, error: 'Ngày không hợp lệ' }); return; }

            results.push({ amount, type, description: row.description || '', txn_date: date });
          } catch (e) {
            errors.push({ row: rowNum, error: 'Lỗi xử lý dòng' });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    let imported = 0;
    for (const row of results) {
      await db.query(
        `INSERT INTO transactions (user_id, amount, type, description, txn_date, source)
         VALUES ($1, $2, $3, $4, $5, 'csv')`,
        [req.user.id, row.amount, row.type, row.description, row.txn_date]
      );
      imported++;
    }

    fs.unlinkSync(req.file.path);
    res.json({ success: true, data: { imported, errors, total: rowNum } });
  } catch (err) {
    console.error(err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Lỗi xử lý file CSV' });
  }
});

module.exports = router;
