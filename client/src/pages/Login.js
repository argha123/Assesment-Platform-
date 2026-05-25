import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconLogIn, IconShieldCheck, IconAlertTriangle } from '../components/Icons';

function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [form, setForm] = useState({ email: 'admin@assessment.local', password: 'admin123' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo"><IconShieldCheck size={26} /></div>
          <div>
            <h1>IT Assessment</h1>
            <p>Enterprise Platform</p>
          </div>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to continue to your workspace</p>

        {error && (
          <div className="auth-error">
            <IconAlertTriangle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required autoFocus
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters" />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            <IconLogIn size={14} /> {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-meta" style={{ marginTop: 12 }}>
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>

        <p className="auth-meta">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>

        <div className="auth-hint">
          <strong>Demo credentials</strong>
          <code>admin@assessment.local · admin123</code>
        </div>
      </div>
    </div>
  );
}

export default Login;
