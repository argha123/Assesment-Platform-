import React, { useEffect, useMemo, useState } from 'react';
import {
  listUsers, createUser, updateUser, deleteUser,
  adminResetUserPassword, getPrivilegeCatalogue
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  IconShield, IconUser, IconUserPlus, IconEdit, IconTrash,
  IconAlertTriangle, IconCheckCircle, IconSave, IconSearch
} from '../components/Icons';

const ROLES = ['admin', 'assessor', 'reviewer', 'client'];

const ROLE_BADGE = {
  admin:    'badge-purple',
  assessor: 'badge-info',
  reviewer: 'badge-warning',
  client:   'badge-success'
};

const PRIVILEGE_LABELS = {
  run_individual_assessment:    'Run Individual Assessment',
  run_collaborative_assessment: 'Run Collaborative Assessment',
  manage_action_items:          'Manage Action Items',
  manage_evidence:              'Manage Evidence',
  manage_risks:                 'Manage Risk Register',
  view_reports:                 'View Reports',
  manage_compliance:            'Manage Compliance',
  manage_knowledge_base:        'Manage Knowledge Base',
  manage_users:                 'Manage Users',
  view_audit_log:               'View Audit Log'
};

const ASSESSMENT_PRIVILEGES = [
  'run_individual_assessment',
  'run_collaborative_assessment'
];

const blankForm = () => ({
  name: '', email: '', password: '', department: '', role: 'assessor',
  privileges: [], is_active: true
});

function Users() {
  const { user: me, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [allPrivileges, setAllPrivileges] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(blankForm());

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(blankForm());

  const [resetting, setResetting] = useState(null);
  const [resetForm, setResetForm] = useState({ password: '', confirm: '' });

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      setError('');
      const [u, p] = await Promise.all([listUsers(), getPrivilegeCatalogue()]);
      setUsers(u.data.users || []);
      setAllPrivileges(p.data.privileges || []);
      setDefaults(p.data.defaults || {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  /* ---- Create ---- */

  const openCreate = () => {
    const role = 'assessor';
    setCreateForm({
      ...blankForm(),
      role,
      privileges: defaults[role] || []
    });
    setCreateOpen(true);
  };

  const handleCreateRoleChange = (role) => {
    setCreateForm(prev => ({ ...prev, role, privileges: defaults[role] || [] }));
  };

  const togglePriv = (which, priv) => {
    if (which === 'create') {
      setCreateForm(prev => ({
        ...prev,
        privileges: prev.privileges.includes(priv)
          ? prev.privileges.filter(p => p !== priv)
          : [...prev.privileges, priv]
      }));
    } else if (which === 'edit') {
      setEditForm(prev => ({
        ...prev,
        privileges: prev.privileges.includes(priv)
          ? prev.privileges.filter(p => p !== priv)
          : [...prev.privileges, priv]
      }));
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(createForm);
      setCreateOpen(false);
      setCreateForm(blankForm());
      showFeedback('success', `User "${createForm.name}" created.`);
      load();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to create user.');
    }
  };

  /* ---- Edit ---- */

  const openEdit = (u) => {
    setEditing(u);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      department: u.department || '',
      role: u.role,
      privileges: u.privileges || [],
      is_active: u.is_active === 1 || u.is_active === true
    });
  };

  const handleEditRoleChange = (role) => {
    setEditForm(prev => ({ ...prev, role, privileges: defaults[role] || [] }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        department: editForm.department,
        role: editForm.role,
        privileges: editForm.privileges,
        is_active: !!editForm.is_active
      };
      await updateUser(editing.id, payload);
      setEditing(null);
      showFeedback('success', `Updated "${editForm.name}".`);
      load();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to save user.');
    }
  };

  /* ---- Password reset ---- */

  const openReset = (u) => {
    setResetting(u);
    setResetForm({ password: '', confirm: '' });
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (resetForm.password.length < 6) {
      showFeedback('error', 'Password must be at least 6 characters.');
      return;
    }
    if (resetForm.password !== resetForm.confirm) {
      showFeedback('error', 'Passwords do not match.');
      return;
    }
    try {
      await adminResetUserPassword(resetting.id, resetForm.password);
      setResetting(null);
      showFeedback('success', `Password reset for "${resetting.name}".`);
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to reset password.');
    }
  };

  /* ---- Delete ---- */

  const handleDelete = async (u) => {
    if (u.id === me?.id) return;
    if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      await deleteUser(u.id);
      showFeedback('success', `User "${u.name}" deleted.`);
      load();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to delete user.');
    }
  };

  /* ---- Filters ---- */

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (filterRole && u.role !== filterRole) return false;
      if (search) {
        const q = search.toLowerCase();
        const blob = `${u.name || ''} ${u.email || ''} ${u.department || ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [users, filterRole, search]);

  if (loading) return <div className="loading">Loading users…</div>;
  if (!hasRole('admin')) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon"><IconShield size={28} /></div>
        <h3>Admins only</h3>
        <p>You don't have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Users & Permissions</h2>
          <p>Role-based access control · Admin only</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconUserPlus size={14} /> Create User
        </button>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger-500)' }}>
          <div style={{ color: 'var(--danger-700)' }}>{error}</div>
        </div>
      )}

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

      <div className="stats-grid">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="stat-card">
              <div className={`stat-icon ${role === 'admin' ? 'purple' : role === 'assessor' ? 'blue' : role === 'reviewer' ? 'orange' : 'green'}`}>
                <IconShield />
              </div>
              <div className="stat-info">
                <h4>{count}</h4>
                <p style={{ textTransform: 'capitalize' }}>{role}{count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Name, email or department" style={{ paddingLeft: 38 }} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <IconSearch size={16} />
              </span>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Role</label>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="">All roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Users ({filtered.length})</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Assessment Capability</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const can = u.privileges || [];
                const indiv = can.includes('run_individual_assessment');
                const collab = can.includes('run_collaborative_assessment');
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))',
                          color: 'white', display: 'inline-flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 12, fontWeight: 700
                        }}>
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.name}{u.id === me?.id && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--brand-600)' }}>(you)</span>}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)' }}>{u.email}</td>
                    <td>{u.department || '-'}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {indiv  && <span className="badge badge-info">Individual</span>}
                        {collab && <span className="badge badge-purple">Collaborative</span>}
                        {!indiv && !collab && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No assessment access</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)} style={{ marginRight: 6 }}>
                        <IconEdit size={12} /> Edit
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openReset(u)} style={{ marginRight: 6 }}>
                        Reset PW
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}
                        disabled={u.id === me?.id} title={u.id === me?.id ? 'Cannot delete your own account' : 'Delete'}>
                        <IconTrash size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon"><IconUser size={28} /></div>
          <h3>No users match the filter</h3>
        </div>
      )}

      {/* Create user modal */}
      {createOpen && (
        <UserFormModal
          title="Create User"
          submitLabel="Create User"
          form={createForm}
          setForm={setCreateForm}
          handleRoleChange={handleCreateRoleChange}
          togglePrivilege={(p) => togglePriv('create', p)}
          allPrivileges={allPrivileges}
          showPasswordField
          onClose={() => setCreateOpen(false)}
          onSubmit={submitCreate}
        />
      )}

      {/* Edit user modal */}
      {editing && (
        <UserFormModal
          title={`Edit: ${editing.name}`}
          submitLabel="Save Changes"
          form={editForm}
          setForm={setEditForm}
          handleRoleChange={handleEditRoleChange}
          togglePrivilege={(p) => togglePriv('edit', p)}
          allPrivileges={allPrivileges}
          showPasswordField={false}
          isEditingSelf={editing.id === me?.id}
          showStatusToggle
          onClose={() => setEditing(null)}
          onSubmit={submitEdit}
        />
      )}

      {/* Reset password modal */}
      {resetting && (
        <div className="modal-overlay" onClick={() => setResetting(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Reset password — {resetting.name}</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13.5, marginBottom: 14 }}>
              Set a new password for this user. Share the password with them via a secure channel.
            </p>
            <form onSubmit={submitReset}>
              <div className="form-group">
                <label>New password *</label>
                <input type="password" required minLength={6}
                  value={resetForm.password}
                  onChange={e => setResetForm({ ...resetForm, password: e.target.value })}
                  placeholder="At least 6 characters" />
              </div>
              <div className="form-group">
                <label>Confirm new password *</label>
                <input type="password" required minLength={6}
                  value={resetForm.confirm}
                  onChange={e => setResetForm({ ...resetForm, confirm: e.target.value })}
                  placeholder="Repeat the password" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setResetting(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><IconSave size={14} /> Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Modal: shared user form ---------- */

function UserFormModal({
  title, submitLabel, form, setForm,
  handleRoleChange, togglePrivilege, allPrivileges,
  showPasswordField, showStatusToggle, isEditingSelf, onClose, onSubmit
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <h3>{title}</h3>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input required type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="user@company.com" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Security, Cloud Ops" />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select value={form.role} onChange={e => handleRoleChange(e.target.value)}
                disabled={isEditingSelf}
                title={isEditingSelf ? 'Cannot change your own role' : ''}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {showPasswordField && (
            <div className="form-group">
              <label>Initial password *</label>
              <input type="password" required minLength={6} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters" />
            </div>
          )}

          {showStatusToggle && (
            <div className="form-group">
              <label>Status</label>
              <label className="checkbox-item" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  disabled={isEditingSelf}
                  title={isEditingSelf ? 'Cannot deactivate yourself' : ''}
                  style={{ accentColor: 'var(--brand-600)' }} />
                <span>{form.is_active ? 'Active — can sign in' : 'Inactive — sign-in blocked'}</span>
              </label>
            </div>
          )}

          <div className="form-group">
            <label>Privileges</label>
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: -4, marginBottom: 8 }}>
              Toggle the assessment workflows and admin features this user can access.
            </p>

            {/* Highlighted assessment capability section */}
            <div style={{
              padding: '12px 14px', background: 'var(--brand-50)',
              border: '1px solid var(--brand-100)', borderRadius: 'var(--r-md)', marginBottom: 12
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-800)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Assessment Capability
              </div>
              <div className="checkbox-grid">
                {ASSESSMENT_PRIVILEGES.map(priv => (
                  <div key={priv}
                    className={`checkbox-item ${form.privileges.includes(priv) ? 'selected' : ''}`}
                    onClick={() => togglePrivilege(priv)}>
                    <input type="checkbox" readOnly checked={form.privileges.includes(priv)} />
                    <strong>{PRIVILEGE_LABELS[priv]}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Other privileges */}
            <div className="checkbox-grid">
              {allPrivileges.filter(p => !ASSESSMENT_PRIVILEGES.includes(p)).map(priv => (
                <div key={priv}
                  className={`checkbox-item ${form.privileges.includes(priv) ? 'selected' : ''}`}
                  onClick={() => togglePrivilege(priv)}>
                  <input type="checkbox" readOnly checked={form.privileges.includes(priv)} />
                  <span>{PRIVILEGE_LABELS[priv] || priv}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><IconSave size={14} /> {submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Users;
