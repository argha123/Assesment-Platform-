import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../services/api';
import { IconActivity, IconSearch } from '../components/Icons';

const ACTION_BADGE = {
  create: 'badge-success',
  update: 'badge-info',
  delete: 'badge-danger',
  login:  'badge-purple',
  logout: 'badge-warning',
};

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entity_type: '', action: '', search: '' });

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters.entity_type, filters.action]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.action) params.action = filters.action;
      params.limit = 200;
      const res = await getAuditLogs(params);
      setLogs(res.data || []);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filters.search
    ? logs.filter(l => {
        const q = filters.search.toLowerCase();
        return (
          (l.user_name || '').toLowerCase().includes(q) ||
          (l.action || '').toLowerCase().includes(q) ||
          (l.entity_type || '').toLowerCase().includes(q) ||
          (l.entity_id || '').toLowerCase().includes(q) ||
          (l.details || '').toLowerCase().includes(q)
        );
      })
    : logs;

  const entityTypes = [...new Set(logs.map(l => l.entity_type).filter(Boolean))];
  const actions = [...new Set(logs.map(l => l.action).filter(Boolean))];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Audit Log</h2>
          <p>Full activity tracking across all data changes</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ marginBottom: 12 }}>
          <h3>Filters</h3>
          <span className="badge badge-info">{filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}</span>
        </div>
        <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Search by user, action, entity, details…"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                style={{ paddingLeft: 38 }} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <IconSearch size={16} />
              </span>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Entity Type</label>
            <select value={filters.entity_type} onChange={e => setFilters({ ...filters, entity_type: e.target.value })}>
              <option value="">All</option>
              {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Action</label>
            <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })}>
              <option value="">All</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading audit log…</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><IconActivity size={28} /></div>
          <h3>No audit log entries</h3>
          <p>System activity will appear here as users interact with data.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--text-tertiary)', whiteSpace: 'nowrap', fontFeatureSettings: '"tnum"' }}>
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 500 }}>{l.user_name || <em style={{ color: 'var(--text-muted)' }}>system</em>}</td>
                    <td>
                      <span className={`badge ${ACTION_BADGE[l.action?.toLowerCase()] || 'badge-info'}`}>{l.action}</span>
                    </td>
                    <td>
                      {l.entity_type ? (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {l.entity_type}{l.entity_id ? <span style={{ color: 'var(--text-muted)' }}>:{l.entity_id.substring(0, 8)}</span> : ''}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360 }}>{l.details || '-'}</td>
                    <td style={{ color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{l.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLog;
