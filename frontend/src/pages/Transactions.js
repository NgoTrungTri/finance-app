import React, { useEffect, useState, useCallback } from 'react';
import { transactionsAPI, categoriesAPI } from '../services/api';

const fmt = n => Number(n).toLocaleString('vi-VN') + '₫';
const today = () => new Date().toISOString().split('T')[0];

const EMPTY = { amount: '', type: 'expense', category_id: '', description: '', txn_date: today() };

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [cats, setCats] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ type: '', category_id: '', month: new Date().toISOString().slice(0, 7) });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCats = useCallback(async () => {
    const res = await categoriesAPI.list();
    setCats(res.data);
  }, []);

  const fetchTxns = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { month, ...rest } = filters;
      const params = { ...rest, page: p, limit: 15 };
      if (month) {
        const [y, m] = month.split('-').map(Number);
        params.start_date = `${month}-01`;
        params.end_date = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
      }
      const res = await transactionsAPI.list(params);
      setTxns(res.data);
      setTotal(res.total);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchCats(); }, [fetchCats]);
  useEffect(() => { fetchTxns(1); }, [fetchTxns]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (t) => {
    setForm({ amount: t.amount, type: t.type, category_id: t.category_id || '', description: t.description || '', txn_date: t.txn_date?.split('T')[0] || today() });
    setEditId(t.id); setModal(true);
  };
  const closeModal = () => { setModal(false); setEditId(null); };

  const save = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return alert('Vui lòng nhập số tiền hợp lệ');
    setSaving(true);
    try {
      if (editId) { await transactionsAPI.update(editId, form); }
      else { await transactionsAPI.create(form); }
      closeModal(); fetchTxns(1);
    } catch (e) { alert(e?.message || 'Có lỗi xảy ra'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Xóa giao dịch này?')) return;
    await transactionsAPI.delete(id);
    fetchTxns(page);
  };

  const filteredCats = cats.filter(c => c.type === form.type || !c.user_id);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Giao dịch / Transactions</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm mới</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input className="form-input" type="month" style={{ width: 160 }} value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))} />
        <select className="form-input" style={{ width: 150 }} value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">Tất cả loại</option>
          <option value="income">Thu nhập</option>
          <option value="expense">Chi tiêu</option>
        </select>
        <select className="form-input" style={{ width: 200 }} value={filters.category_id} onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))}>
          <option value="">Tất cả danh mục</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Đang tải...</div> :
          txns.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>Không có giao dịch nào</div> :
          txns.map(t => (
            <div key={t.id} className="txn-row" style={{ cursor: 'default' }}>
              <div className="txn-icon" style={{ background: (t.category_color || '#888') + '22' }}>{t.category_icon || '📦'}</div>
              <div className="txn-info">
                <div className="txn-name">{t.description || 'Không có mô tả'}</div>
                <div className="txn-cat">
                  <span className={`badge badge-${t.type}`}>{t.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}</span>
                  {' '}{t.category_name || 'Khác'}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginRight: 8 }}>
                <div className="txn-amount" style={{ color: t.type === 'income' ? '#1D9E75' : '#E24B4A' }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </div>
                <div className="txn-date">{new Date(t.txn_date).toLocaleDateString('vi-VN')}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(t)}>Sửa</button>
                <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => del(t.id)}>Xóa</button>
              </div>
            </div>
          ))
        }

        {total > 15 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
            {page > 1 && <button className="btn" onClick={() => fetchTxns(page - 1)}>← Trước</button>}
            <span style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>Trang {page} / {Math.ceil(total / 15)}</span>
            {page < Math.ceil(total / 15) && <button className="btn" onClick={() => fetchTxns(page + 1)}>Tiếp →</button>}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-title">{editId ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}</div>
            <div className="type-tabs">
              {['expense', 'income'].map(t => (
                <button key={t} className={'type-tab' + (form.type === t ? ' active' : '')}
                  onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}>
                  {t === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                </button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Số tiền (₫)</label>
              <input className="form-input" type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Nhập số tiền..." />
            </div>
            <div className="form-group">
              <label className="form-label">Danh mục</label>
              <select className="form-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Chọn danh mục...</option>
                {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ghi chú ngắn gọn..." />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày giao dịch</label>
              <input className="form-input" type="date" value={form.txn_date} onChange={e => setForm(f => ({ ...f, txn_date: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
              <button className="btn" onClick={closeModal}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
