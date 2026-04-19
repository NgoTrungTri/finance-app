import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardAPI } from '../services/api';

const fmt = n => Number(n).toLocaleString('vi-VN') + '₫';

const COLORS = ['#ef4444','#f97316','#a855f7','#3b82f6','#ec4899','#10b981','#6b7280','#8b5cf6'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.summary(),
      dashboardAPI.byCategory(),
      dashboardAPI.monthlyTrend(),
      dashboardAPI.recent(),
    ]).then(([s, c, t, r]) => {
      setSummary(s.data);
      setByCategory(c.data);
      setTrend(t.data.map(d => ({ ...d, month: d.month.slice(0, 7), income: Number(d.income), expense: Number(d.expense) })));
      setRecent(r.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard tổng quan</h1>
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {summary && (
        <div className="metric-grid">
          <div className="metric">
            <div className="metric-label">Tổng thu / Income</div>
            <div className="metric-value" style={{ color: '#1D9E75' }}>{fmt(summary.total_income)}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Tổng chi / Expense</div>
            <div className="metric-value" style={{ color: '#E24B4A' }}>{fmt(summary.total_expense)}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Số dư / Balance</div>
            <div className="metric-value" style={{ color: '#378ADD' }}>{fmt(summary.balance)}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Giao dịch / Transactions</div>
            <div className="metric-value" style={{ color: '#7F77DD' }}>{summary.total_transactions}</div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Thu chi 6 tháng</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => Math.round(v / 1000000) + 'M'} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="income" name="Thu nhập" fill="#1D9E75" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#E24B4A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Chi tiêu theo danh mục</div>
          {byCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={byCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {byCategory.slice(0, 4).map((c, i) => (
                  <span key={i} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, color: '#6b7280' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    {c.icon} {Math.round(Number(c.amount) / (byCategory.reduce((s, x) => s + Number(x.amount), 0)) * 100)}%
                  </span>
                ))}
              </div>
            </>
          ) : <div style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 60, fontSize: 13 }}>Chưa có dữ liệu</div>}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Giao dịch gần đây</div>
          <Link to="/transactions" style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none' }}>Xem tất cả →</Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 13 }}>Chưa có giao dịch nào</div>
        ) : (
          recent.map(t => (
            <div key={t.id} className="txn-row">
              <div className="txn-icon" style={{ background: (t.category_color || '#888') + '25' }}>{t.category_icon || '📦'}</div>
              <div className="txn-info">
                <div className="txn-name">{t.description || 'Không có mô tả'}</div>
                <div className="txn-cat">{t.category_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="txn-amount" style={{ color: t.type === 'income' ? '#1D9E75' : '#E24B4A' }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </div>
                <div className="txn-date">{new Date(t.txn_date).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
