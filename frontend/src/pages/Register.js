import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form.email, form.password, form.full_name);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>FinanceVN</h1>
          <p>Tạo tài khoản mới</p>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Họ tên / Full name</label>
            <input className="form-input" name="full_name" value={form.full_name} onChange={handle} placeholder="Nguyễn Văn A" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" value={form.email} onChange={handle} placeholder="email@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu / Password</label>
            <input className="form-input" name="password" type="password" value={form.password} onChange={handle} placeholder="Ít nhất 6 ký tự" required minLength={6} />
          </div>
          {error && <div style={{ color: '#E24B4A', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '10px', fontSize: 14 }}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký / Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
