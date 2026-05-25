import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { IconShieldCheck, IconAlertTriangle, IconCheckCircle } from '../components/Icons';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [demoToken, setDemoToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setDemoToken('');
    setSubmitting(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.data.message);
      // In development the API returns the token so admins can complete the flow without an email service
      if (res.data.reset_token) setDemoToken(res.data.reset_token);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start password reset.');
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

        <h2 className="auth-title">Forgot your password?</h2>
        <p className="auth-subtitle">Enter your email and we'll generate a reset link</p>

        {error && (
          <div className="auth-error"><IconAlertTriangle size={14} /> {error}</div>
        )}

        {message && (
          <div style={{
            padding: '10px 14px', background: 'var(--success-50)',
            border: '1px solid var(--success-100)', borderRadius: 'var(--r-md)',
            color: 'var(--success-700)', fontSize: 13, fontWeight: 500, marginBottom: 14,
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            <IconCheckCircle size={14} /> {message}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required autoFocus value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {demoToken && (
          <div className="auth-hint" style={{ marginTop: 16 }}>
            <strong>Development mode</strong>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Email isn't configured, so the reset token is shown here. In production this would be sent via email.
            </span>
            <code>{demoToken}</code>
            <Link to={`/reset-password?token=${demoToken}`} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              Open reset link
            </Link>
          </div>
        )}

        <p className="auth-meta">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
