import React, { useEffect, useState, useCallback } from 'react';
import { budgetsAPI, categoriesAPI } from '../services/api';

const fmt = n => Number(n).toLocaleString('vi-VN') + '₫';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [cats, setCats] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ category_id: '', limit_amount: '', alert_threshold: 80 });
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetch = useCallback(async () => {
    const [b, c] = await Promise.all([budgetsAPI.list({ month, year }), categoriesAPI.list()]);
    setBudgets(b.data);
    setCats(c.data.filter(c => c.type === 'expense'));
  }, [month, year]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!form.category_id || !form.limit_amount) return alert('Vui lòng điền đầy đủ');
    setSaving(true);
    try {
      await budgetsAPI.create({ ...form, month, year });
      setModal(false);
      setForm({ category_id: '', limit_amount: '', alert_threshold: 80 });
      fetch();
    } catch (e) { alert(e?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Xóa ngân sách này?')) return;
    await budgetsAPI.delete(id);
    fetch();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ngân sách / Budgets</h1>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Tạo ngân sách</button>
      </div>

      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
        Tháng {month}/{year} — Theo dõi chi tiêu theo từng danh mục
      </div>

      {budgets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 14 }}>Chưa có ngân sách nào tháng này</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Bấm "Tạo ngân sách" để bắt đầu kiểm soát chi tiêu</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {budgets.map(b => {
            const spent = Number(b.spent_amount);
            const limit = Number(b.limit_amount);
            const pct = Math.min(Math.round((spent / limit) * 100), 100);
            const barColor = pct >= 100 ? '#E24B4A' : pct >= (b.alert_threshold || 80) ? '#BA7517' : '#1D9E75';
            const statusLabel = pct >= 100 ? '🚨 Vượt ngân sách' : pct >= (b.alert_threshold || 80) ? '⚠️ Sắp đạt ngưỡng' : '✅ Ổn định';

            return (
              <div key={b.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: (b.category_color || '#888') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {b.category_icon || '📦'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{b.category_name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{statusLabel}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: barColor }}>{fmt(spent)}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>/ {fmt(limit)}</div>
                  </div>
                </div>

                <div className="progress-bar" style={{ height: 10, marginBottom: 10 }}>
                  <div className="progress-fill" style={{ width: pct + '%', background: barColor }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {pct}% đã dùng · Còn lại: {fmt(Math.max(limit - spent, 0))}
                  </span>
                  <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => del(b.id)}>Xóa</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Tạo ngân sách tháng {month}/{year}</div>
            <div className="form-group">
              <label className="form-label">Danh mục chi tiêu</label>
              <select className="form-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Chọn danh mục...</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Giới hạn chi tiêu (₫)</label>
              <input className="form-input" type="number" min="0" value={form.limit_amount} onChange={e => setForm(f => ({ ...f, limit_amount: e.target.value }))} placeholder="VD: 3000000" />
            </div>
            <div className="form-group">
              <label className="form-label">Cảnh báo khi đạt (%) — hiện tại: {form.alert_threshold}%</label>
              <input className="form-input" type="range" min="50" max="95" step="5" value={form.alert_threshold} onChange={e => setForm(f => ({ ...f, alert_threshold: parseInt(e.target.value) }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Tạo ngân sách'}</button>
              <button className="btn" onClick={() => setModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
