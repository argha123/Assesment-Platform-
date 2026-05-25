import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getFramework, updateFramework,
  createControl, updateControl, deleteControl,
  getControlMappings, setControlMappings,
  getQuestions
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  IconShield, IconArrowLeft, IconEdit, IconPlus, IconTrash, IconLink,
  IconCheckCircle, IconAlertTriangle, IconSearch
} from '../components/Icons';

function FrameworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const [framework, setFramework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', version: '' });

  const [showCtrlForm, setShowCtrlForm] = useState(false);
  const [ctrlEditing, setCtrlEditing] = useState(null);
  const [ctrlForm, setCtrlForm] = useState({ control_id: '', control_name: '', description: '', category: '' });

  const [showMappings, setShowMappings] = useState(null); // control object
  const [allQuestions, setAllQuestions] = useState([]);
  const [mappedIds, setMappedIds] = useState(new Set());
  const [questionFilter, setQuestionFilter] = useState({ category: '', search: '' });

  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await getFramework(id);
      setFramework(res.data);
      setEditForm({
        name: res.data.name || '',
        description: res.data.description || '',
        version: res.data.version || ''
      });
    } catch (e) {
      console.error('Failed to load framework:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // Load questions once for mapping
  useEffect(() => {
    getQuestions({ limit: 500 }).then(res => {
      const items = res.data?.questions || res.data || [];
      setAllQuestions(items);
    }).catch(() => setAllQuestions([]));
  }, []);

  const saveFramework = async (e) => {
    e.preventDefault();
    try {
      await updateFramework(id, editForm);
      setEditing(false);
      showFeedback('success', 'Framework updated.');
      load();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Update failed.');
    }
  };

  // Control CRUD
  const resetCtrlForm = () => {
    setCtrlForm({ control_id: '', control_name: '', description: '', category: '' });
    setCtrlEditing(null);
    setShowCtrlForm(false);
  };

  const submitControl = async (e) => {
    e.preventDefault();
    try {
      if (ctrlEditing) await updateControl(ctrlEditing.id, ctrlForm);
      else await createControl(id, ctrlForm);
      resetCtrlForm();
      showFeedback('success', ctrlEditing ? 'Control updated.' : 'Control created.');
      load();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Save failed.');
    }
  };

  const editControl = (c) => {
    setCtrlEditing(c);
    setCtrlForm({
      control_id: c.control_id || '',
      control_name: c.control_name || '',
      description: c.description || '',
      category: c.category || ''
    });
    setShowCtrlForm(true);
  };

  const removeControl = async (c) => {
    if (!window.confirm(`Delete control "${c.control_id} — ${c.control_name}"?`)) return;
    await deleteControl(c.id);
    showFeedback('success', 'Control deleted.');
    load();
  };

  // Mapping editor
  const openMappings = async (c) => {
    setShowMappings(c);
    setQuestionFilter({ category: '', search: '' });
    try {
      const res = await getControlMappings(c.id);
      setMappedIds(new Set((res.data || []).map(m => m.question_id)));
    } catch {
      setMappedIds(new Set());
    }
  };

  const closeMappings = () => {
    setShowMappings(null);
    setMappedIds(new Set());
  };

  const toggleQuestionMapping = (qid) => {
    setMappedIds(prev => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  };

  const saveMappings = async () => {
    try {
      await setControlMappings(showMappings.id, Array.from(mappedIds));
      showFeedback('success', `Mapped ${mappedIds.size} question${mappedIds.size === 1 ? '' : 's'} to "${showMappings.control_name}".`);
      closeMappings();
      load();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to save mappings.');
    }
  };

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      if (questionFilter.category && q.category?.toLowerCase() !== questionFilter.category) return false;
      if (questionFilter.search) {
        const s = questionFilter.search.toLowerCase();
        const blob = `${q.question_text || ''} ${q.subcategory || ''} ${q.category || ''}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [allQuestions, questionFilter]);

  if (loading) return <div className="loading">Loading framework…</div>;
  if (!framework) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon"><IconShield size={28} /></div>
        <h3>Framework not found</h3>
      </div>
    );
  }

  const ctrls = framework.controls || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/compliance')} style={{ marginBottom: 12 }}>
            <IconArrowLeft size={13} /> Back to Compliance
          </button>
          <h2>{framework.name}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-info">{framework.code}</span>
            {framework.version && <span className="badge badge-purple">v{framework.version}</span>}
            <span className="badge badge-warning">{ctrls.length} controls</span>
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-outline" onClick={() => setEditing(e => !e)}>
            <IconEdit size={14} /> {editing ? 'Cancel' : 'Edit Framework'}
          </button>
        )}
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

      {editing && (
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Edit Framework</h3>
          <form onSubmit={saveFramework}>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Version</label>
                <input value={editForm.version} onChange={e => setEditForm({ ...editForm, version: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">Save Changes</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {!editing && (
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {framework.description || <em style={{ color: 'var(--text-muted)' }}>No description.</em>}
          </p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Controls ({ctrls.length})</h3>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => { resetCtrlForm(); setShowCtrlForm(true); }}>
              <IconPlus size={13} /> New Control
            </button>
          )}
        </div>

        {ctrls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconShield size={28} /></div>
            <p>No controls defined for this framework yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Control ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Mapping</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {ctrls.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{c.control_id}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.control_name}</div>
                      {c.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {c.description.length > 90 ? c.description.substring(0, 90) + '…' : c.description}
                        </div>
                      )}
                    </td>
                    <td>{c.category || '-'}</td>
                    <td>
                      <span className={`badge ${c.mapping_count > 0 ? 'badge-success' : 'badge-warning'}`}>
                        {c.mapping_count || 0} question{c.mapping_count === 1 ? '' : 's'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openMappings(c)} style={{ marginRight: 6 }}>
                          <IconLink size={12} /> Map
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => editControl(c)} style={{ marginRight: 6 }}>
                          <IconEdit size={12} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => removeControl(c)}>
                          <IconTrash size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Control form modal */}
      {showCtrlForm && (
        <div className="modal-overlay" onClick={resetCtrlForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{ctrlEditing ? 'Edit Control' : 'New Control'}</h3>
            <form onSubmit={submitControl}>
              <div className="form-row">
                <div className="form-group">
                  <label>Control ID *</label>
                  <input required value={ctrlForm.control_id}
                    onChange={e => setCtrlForm({ ...ctrlForm, control_id: e.target.value })}
                    placeholder="e.g. ID.AM" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input value={ctrlForm.category}
                    onChange={e => setCtrlForm({ ...ctrlForm, category: e.target.value })}
                    placeholder="e.g. Identify, Protect" />
                </div>
              </div>
              <div className="form-group">
                <label>Control Name *</label>
                <input required value={ctrlForm.control_name}
                  onChange={e => setCtrlForm({ ...ctrlForm, control_name: e.target.value })}
                  placeholder="Asset Management" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={ctrlForm.description}
                  onChange={e => setCtrlForm({ ...ctrlForm, description: e.target.value })}
                  placeholder="What this control covers" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={resetCtrlForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{ctrlEditing ? 'Save Changes' : 'Create Control'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mapping modal */}
      {showMappings && (
        <div className="modal-overlay" onClick={closeMappings}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <h3>Map Questions to "{showMappings.control_name}"</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 12 }}>
              Select which questions this control depends on. Scores from those questions will determine the control status.
            </p>

            <div className="form-row" style={{ alignItems: 'end', gridTemplateColumns: '2fr 1fr' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Search</label>
                <div style={{ position: 'relative' }}>
                  <input value={questionFilter.search}
                    onChange={e => setQuestionFilter({ ...questionFilter, search: e.target.value })}
                    placeholder="Search questions…" style={{ paddingLeft: 38 }} />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <IconSearch size={16} />
                  </span>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Category</label>
                <select value={questionFilter.category}
                  onChange={e => setQuestionFilter({ ...questionFilter, category: e.target.value })}>
                  <option value="">All</option>
                  <option value="people">People</option>
                  <option value="process">Process</option>
                  <option value="technology">Technology</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
              {mappedIds.size} of {filteredQuestions.length} shown · {allQuestions.length} total questions
            </div>

            <div style={{
              marginTop: 8, maxHeight: 340, overflowY: 'auto',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              background: 'var(--gray-50)'
            }}>
              {filteredQuestions.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  No questions match the filter.
                </div>
              ) : (
                filteredQuestions.map(q => {
                  const checked = mappedIds.has(q.id);
                  return (
                    <label key={q.id}
                      onClick={() => toggleQuestionMapping(q.id)}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        padding: '10px 12px', borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: checked ? 'var(--brand-50)' : 'transparent',
                        transition: 'background var(--t-fast) var(--ease-out)'
                      }}>
                      <input type="checkbox" readOnly checked={checked}
                        style={{ marginTop: 3, accentColor: 'var(--brand-600)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>
                          {q.question_text}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{q.category}</span>
                          {q.subcategory && <span className="badge badge-purple">{q.subcategory}</span>}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={closeMappings}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveMappings}>
                Save Mappings ({mappedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FrameworkDetail;
