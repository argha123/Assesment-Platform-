import React, { useEffect, useState } from 'react';
import {
  getBadges, getLeaderboard, getUserBadges, checkAchievements
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { IconAward, IconStar, IconCheck } from '../components/Icons';

const BADGE_THEMES = [
  { from: '#6366f1', to: '#818cf8' }, // indigo
  { from: '#f59e0b', to: '#fbbf24' }, // amber
  { from: '#10b981', to: '#34d399' }, // emerald
  { from: '#a855f7', to: '#c084fc' }, // purple
  { from: '#ef4444', to: '#f87171' }, // red
  { from: '#06b6d4', to: '#38bdf8' }, // cyan
  { from: '#ec4899', to: '#f472b6' }, // pink
  { from: '#84cc16', to: '#a3e635' }, // lime
];

function Gamification() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userBadges, setUserBadges] = useState({ badges: [], totalPoints: 0, level: 1 });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [justEarned, setJustEarned] = useState([]);

  useEffect(() => {
    Promise.all([
      getBadges(),
      getLeaderboard(),
      user ? getUserBadges(user.id) : Promise.resolve({ data: { badges: [], totalPoints: 0, level: 1 } })
    ])
      .then(([b, l, u]) => {
        setBadges(b.data || []);
        setLeaderboard(l.data || []);
        setUserBadges(u.data);
      })
      .catch(e => console.error('Failed to load gamification:', e))
      .finally(() => setLoading(false));
  }, [user]);

  const earnedIds = new Set(userBadges.badges.map(b => b.badge_id));

  const handleCheck = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const res = await checkAchievements(user.id);
      setJustEarned(res.data.awarded || []);
      // Reload user's badges
      const u = await getUserBadges(user.id);
      setUserBadges(u.data);
      const lb = await getLeaderboard();
      setLeaderboard(lb.data || []);
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <div className="loading">Loading achievements…</div>;

  const nextLevelPoints = userBadges.level * 100;
  const progressToNext = ((userBadges.totalPoints % 100) / 100) * 100;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Achievements & Leaderboard</h2>
          <p>Earn badges as you complete assessments and contribute</p>
        </div>
        {user && (
          <button className="btn btn-primary" onClick={handleCheck} disabled={checking}>
            <IconStar size={14} /> {checking ? 'Checking…' : 'Check My Achievements'}
          </button>
        )}
      </div>

      {/* User stats */}
      {user && (
        <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--brand-50), white)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 'var(--r-xl)',
              background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))',
              color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, boxShadow: '0 12px 28px -10px rgba(99, 102, 241, 0.55)'
            }}>
              L{userBadges.level}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h3 style={{ fontSize: 18, fontWeight: 650, color: 'var(--text-primary)', marginBottom: 6 }}>
                {user.name} · Level {userBadges.level}
              </h3>
              <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-700)', fontFeatureSettings: '"tnum"' }}>{userBadges.totalPoints}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Total Points</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success-600)', fontFeatureSettings: '"tnum"' }}>{userBadges.badges.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Badges Earned</div>
                </div>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill blue" style={{ width: `${progressToNext}%` }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                {nextLevelPoints - userBadges.totalPoints} points until level {userBadges.level + 1}
              </div>
            </div>
          </div>

          {justEarned.length > 0 && (
            <div style={{
              marginTop: 16, padding: '12px 16px',
              background: 'var(--success-50)', borderRadius: 'var(--r-md)',
              border: '1px solid var(--success-100)',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <IconCheck size={16} color="var(--success-600)" />
              <span style={{ color: 'var(--success-700)', fontSize: 13.5, fontWeight: 500 }}>
                Just earned: {justEarned.map(b => b.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* All badges */}
      <div className="card">
        <div className="card-header">
          <h3>All Badges ({badges.length})</h3>
          <span className="badge badge-info">{userBadges.badges.length} earned</span>
        </div>
        <div className="badge-grid">
          {badges.map((b, idx) => {
            const earned = earnedIds.has(b.id);
            const theme = BADGE_THEMES[idx % BADGE_THEMES.length];
            return (
              <div key={b.id} className={`badge-tile ${earned ? 'earned' : 'locked'}`}>
                <div className="badge-tile-icon"
                  style={{
                    background: earned
                      ? `linear-gradient(135deg, ${theme.from}, ${theme.to})`
                      : 'var(--gray-100)',
                    color: earned ? 'white' : 'var(--text-muted)'
                  }}>
                  <IconAward size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 650, color: earned ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{b.name}</h4>
                    {earned && <span className="badge badge-success"><IconCheck size={10} /> Earned</span>}
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 6 }}>{b.description}</p>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-700)', fontFeatureSettings: '"tnum"' }}>+{b.points} pts</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        <div className="card-header">
          <h3>Leaderboard</h3>
        </div>
        {leaderboard.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconStar size={28} /></div>
            <p>No leaderboard data yet — start earning badges!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Rank</th>
                  <th>User</th>
                  <th>Department</th>
                  <th>Badges</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(entry => (
                  <tr key={entry.id} style={entry.id === user?.id ? { background: 'var(--brand-50)' } : undefined}>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: '50%',
                        background: entry.rank <= 3
                          ? `linear-gradient(135deg, ${entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#94a3b8' : '#b45309'}, ${entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#cbd5e1' : '#d97706'})`
                          : 'var(--gray-100)',
                        color: entry.rank <= 3 ? 'white' : 'var(--text-secondary)',
                        fontWeight: 700, fontSize: 13
                      }}>
                        {entry.rank}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))',
                          color: 'white', display: 'inline-flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 12, fontWeight: 700
                        }}>
                          {(entry.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{entry.name}{entry.id === user?.id && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--brand-600)' }}>(you)</span>}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)' }}>{entry.department || '-'}</td>
                    <td style={{ fontFeatureSettings: '"tnum"', fontWeight: 500 }}>{entry.badge_count}</td>
                    <td style={{ fontFeatureSettings: '"tnum"', fontWeight: 700, color: 'var(--brand-700)' }}>{entry.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Gamification;
