import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, changeOwnPassword } from '../services/api';
import {
  IconUser, IconSave, IconAlertTriangle, IconCheckCircle, IconShield
} from '../components/Icons';

function Account() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || ''
  });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await updateProfile(profile);
      // Refresh local auth user (name/email/etc may have changed)
      const updated = res.data.user;
      localStorage.setItem('auth_user', JSON.stringify(updated));
      // Trigger context refresh by simulating relogin state update via a soft reload
      window.dispatchEvent(new Event('storage'));
      showFeedback('success', 'Profile updated successfully.');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (pw.next.length < 6) { showFeedback('error', 'New password must be at least 6 characters.'); return; }
    if (pw.next !== pw.confirm) { showFeedback('error', 'Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await changeOwnPassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      showFeedback('success', 'Password changed successfully.');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Account Settings</h2>
          <p>Manage your profile, email and password</p>
        </div>
      </div>

      {feedback.text && (
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 16,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: feedback.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
          color:      feedback.type === 'success' ? 'var(--success-700)' : 'var(--danger-700)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--success-100)' : 'var(--danger-100)'}`,
          fontSize: 13
        }}>
          {feedback.type === 'success' ? <IconCheckCircle size={14} /> : <IconAlertTriangle size={14} />}
          {feedback.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--r-md)',
              background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))',
              color: 'white', display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22, fontWeight: 700
            }}>
              {(user.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-primary)' }}>{user.name}</h3>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-info'}`}>{user.role}</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {user.email}</span>
              </div>
            </div>
          </div>

          <form onSubmit={submitProfile}>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input value={profile.name} required
                  onChange={e => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={profile.email} required
                  onChange={e => setProfile({ ...profile, email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input value={profile.department}
                onChange={e => setProfile({ ...profile, department: e.target.value })}
                placeholder="e.g. IT Operations" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              <IconSave size={14} /> {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <IconShield size={18} />
            <h3 style={{ fontSize: 15, fontWeight: 650 }}>Change Password</h3>
          </div>
          <form onSubmit={submitPassword}>
            <div className="form-group">
              <label>Current password *</label>
              <input type="password" required value={pw.current}
                onChange={e => setPw({ ...pw, current: e.target.value })}
                placeholder="Your current password" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>New password *</label>
                <input type="password" required minLength={6} value={pw.next}
                  onChange={e => setPw({ ...pw, next: e.target.value })}
                  placeholder="At least 6 characters" />
              </div>
              <div className="form-group">
                <label>Confirm new password *</label>
                <input type="password" required minLength={6} value={pw.confirm}
                  onChange={e => setPw({ ...pw, confirm: e.target.value })}
                  placeholder="Repeat the new password" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              <IconShield size={14} /> {savingPw ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Account;
