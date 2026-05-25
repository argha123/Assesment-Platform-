import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { IconShieldCheck, IconAlertTriangle, IconCheckCircle, IconShield } from '../components/Icons';

function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') || '');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (next.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (next !== confirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      await resetPassword(token, next);
      setSuccess('Password reset. Redirecting to sign in…');
      setTimeout(() => navigate('/login'), 1600);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
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

        <h2 className="auth-title">Reset your password</h2>
        <p className="auth-subtitle">Enter your reset token and choose a new password</p>

        {error && <div className="auth-error"><IconAlertTriangle size={14} /> {error}</div>}

        {success && (
          <div style={{
            padding: '10px 14px', background: 'var(--success-50)',
            border: '1px solid var(--success-100)', borderRadius: 'var(--r-md)',
            color: 'var(--success-700)', fontSize: 13, fontWeight: 500, marginBottom: 14,
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            <IconCheckCircle size={14} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Reset Token</label>
            <input required value={token} onChange={e => setToken(e.target.value)}
              placeholder="Paste your reset token" />
          </div>
          <div className="form-group">
            <label>New password</label>
            <input type="password" required minLength={6} value={next}
              onChange={e => setNext(e.target.value)}
              placeholder="At least 6 characters" />
          </div>
          <div className="form-group">
            <label>Confirm new password</label>
            <input type="password" required minLength={6} value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat the new password" />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            <IconShield size={14} /> {submitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-meta">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
