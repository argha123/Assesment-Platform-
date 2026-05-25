import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconUserPlus, IconShieldCheck, IconAlertTriangle } from '../components/Icons';

const ROLES = [
  { value: 'assessor', label: 'Assessor', desc: 'Conduct and edit assessments' },
  { value: 'reviewer', label: 'Reviewer', desc: 'Review reports and findings' },
  { value: 'client',   label: 'Client',   desc: 'View your own organisation only' }
];

function Register() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'assessor' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
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

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Get started with the IT Assessment Platform</p>

        {error && (
          <div className="auth-error">
            <IconAlertTriangle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required minLength={6} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {ROLES.map(r => (
                <label key={r.value} className={`checkbox-item ${form.role === r.value ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}>
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                    onChange={() => setForm({ ...form, role: r.value })}
                    style={{ accentColor: 'var(--brand-600)' }} />
                  <div>
                    <strong>{r.label}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            <IconUserPlus size={14} /> {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-meta">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
