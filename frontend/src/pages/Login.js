import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>FinanceVN</h1>
          <p>Quản lý tài chính cá nhân thông minh</p>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" value={form.email} onChange={handle} placeholder="email@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu / Password</label>
            <input className="form-input" name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
          </div>
          {error && <div style={{ color: '#E24B4A', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '10px', fontSize: 14 }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập / Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
