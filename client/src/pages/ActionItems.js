import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  getActionItems, createActionItem, updateActionItem, deleteActionItem,
  getBurnDown, getAssessments, getActionItemLogs, addActionItemNote
} from '../services/api';
import {
  IconLayout, IconPlus, IconTrash, IconCalendar, IconUser, IconEdit
} from '../components/Icons';

const COLUMNS = [
  { id: 'todo',        title: 'Todo',        color: 'var(--gray-500)',    bg: 'var(--gray-50)' },
  { id: 'in_progress', title: 'In Progress', color: 'var(--info-600)',    bg: 'var(--info-50)' },
  { id: 'review',      title: 'Review',      color: 'var(--warning-600)', bg: 'var(--warning-50)' },
  { id: 'done',        title: 'Done',        color: 'var(--success-600)', bg: 'var(--success-50)' }
];

const PRIORITY_BADGE = {
  critical: 'badge-danger',
  high:     'badge-warning',
  medium:   'badge-info',
  low:      'badge-success'
};

function ActionItems() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [items, setItems] = useState([]);
  const [burndown, setBurndown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLogs, setDetailLogs] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    assignee_name: '', due_date: '', phase: '', category: '', effort: '', impact: ''
  });

  // Load assessments once
  useEffect(() => {
    getAssessments()
      .then(res => {
        const all = res.data || [];
        setAssessments(all);
        if (all.length) setSelectedAssessment(all[0].id);
      })
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, []);

  // Load items + burndown when assessment changes
  useEffect(() => {
    if (!selectedAssessment) { setItems([]); setBurndown(null); return; }
    loadItems();
    // eslint-disable-next-line
  }, [selectedAssessment]);

  const loadItems = async () => {
    try {
      if (selectedAssessment === '__all__') {
        // Load items for ALL assessments
        const itemsRes = await getActionItems({});
        setItems(itemsRes.data || []);
        setBurndown(null);
      } else {
        const [itemsRes, bdRes] = await Promise.all([
          getActionItems({ assessment_id: selectedAssessment }),
          getBurnDown(selectedAssessment)
        ]);
        setItems(itemsRes.data || []);
        setBurndown(bdRes.data);
      }
    } catch (e) {
      console.error('Failed to load action items:', e);
    }
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', priority: 'medium',
      assignee_name: '', due_date: '', phase: '', category: '', effort: '', impact: ''
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateActionItem(editing.id, form);
      } else {
        await createActionItem({ ...form, assessment_id: selectedAssessment });
      }
      resetForm();
      loadItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save action item.');
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      priority: item.priority || 'medium',
      assignee_name: item.assignee_name || '',
      due_date: item.due_date ? item.due_date.split('T')[0] : '',
      phase: item.phase || '',
      category: item.category || '',
      effort: item.effort || '',
      impact: item.impact || ''
    });
    setShowForm(true);
  };

  const openDetail = async (item) => {
    setDetailItem(item);
    setLoadingLogs(true);
    try {
      const res = await getActionItemLogs(item.id);
      setDetailLogs(res.data || []);
    } catch {
      setDetailLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const closeDetail = () => {
    setDetailItem(null);
    setDetailLogs([]);
    setNewNote('');
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !detailItem) return;
    try {
      await addActionItemNote(detailItem.id, { note: newNote.trim(), user_name: 'Reviewer' });
      setNewNote('');
      // Reload logs
      const res = await getActionItemLogs(detailItem.id);
      setDetailLogs(res.data || []);
      loadItems();
    } catch (err) {
      alert('Failed to add note');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this action item?')) return;
    await deleteActionItem(id);
    loadItems();
  };

  const moveItem = async (id, status) => {
    const item = items.find(i => i.id === id);
    if (!item || item.status === status) return;
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    try {
      const progress = status === 'done' ? 100 : status === 'review' ? 75 : status === 'in_progress' ? 40 : 0;
      await updateActionItem(id, { status, progress });
      loadItems();
    } catch {
      loadItems();
    }
  };

  const grouped = useMemo(() => {
    const out = { todo: [], in_progress: [], review: [], done: [] };
    items.forEach(i => {
      if (out[i.status]) out[i.status].push(i);
      else out.todo.push(i);
    });
    return out;
  }, [items]);

  const burnChart = burndown ? [
    { name: 'Start',    remaining: burndown.total },
    { name: 'Current',  remaining: Math.max(0, burndown.total - burndown.completed) },
    { name: 'Target',   remaining: 0 }
  ] : [];

  const statusPie = burndown ? Object.entries(burndown.byStatus)
    .map(([k, v]) => ({
      name: COLUMNS.find(c => c.id === k)?.title || k,
      value: v,
      color: COLUMNS.find(c => c.id === k)?.color || '#94a3b8'
    }))
    .filter(d => d.value > 0) : [];

  if (loading) return <div className="loading">Loading action items…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Action Items</h2>
          <p>Kanban tracking for remediation tasks · Drag cards or use status buttons</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)} disabled={!selectedAssessment || selectedAssessment === '__all__'}>
          <IconPlus size={14} /> New Action Item
        </button>
      </div>

      {/* Assessment selector */}
      {assessments.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><IconLayout size={28} /></div>
          <h3>No assessments available</h3>
          <p>Action items belong to an assessment. Create an assessment first.</p>
          <Link to="/scope" className="btn btn-primary">Define Scope</Link>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-row" style={{ gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Assessment</label>
                <select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)}>
                  <option value="__all__">All Assessments (Correlation View)</option>
                  {assessments.map(a => (
                    <option key={a.id} value={a.id}>{a.title} — {a.account_name} {a.status === 'completed' ? '✓' : ''}</option>
                  ))}
                </select>
              </div>
              {selectedAssessment && selectedAssessment !== '__all__' && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingBottom: 4 }}>
                  {(() => {
                    const a = assessments.find(x => x.id === selectedAssessment);
                    return a ? `Score: ${a.overall_score || 'N/A'} | Status: ${a.status}` : '';
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Correlation View - when "All Assessments" is selected */}
          {selectedAssessment === '__all__' && (
            <div style={{ marginBottom: 20 }}>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 650, marginBottom: 14 }}>Action Items Across Assessments</h3>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                  View and compare action items across all assessments to identify common patterns and cross-cutting concerns.
                </p>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Assessment</th>
                        <th>Account</th>
                        <th style={{ textAlign: 'center' }}>Total</th>
                        <th style={{ textAlign: 'center' }}>Todo</th>
                        <th style={{ textAlign: 'center' }}>In Progress</th>
                        <th style={{ textAlign: 'center' }}>Review</th>
                        <th style={{ textAlign: 'center' }}>Done</th>
                        <th style={{ textAlign: 'center' }}>Completion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map(a => {
                        const aItems = items.filter(i => i.assessment_id === a.id);
                        const done = aItems.filter(i => i.status === 'done').length;
                        const pct = aItems.length > 0 ? Math.round((done / aItems.length) * 100) : 0;
                        return (
                          <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedAssessment(a.id)}>
                            <td style={{ fontWeight: 500, fontSize: 13 }}>{a.title}</td>
                            <td style={{ fontSize: 13 }}>{a.account_name}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{aItems.length}</td>
                            <td style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{aItems.filter(i => i.status === 'todo').length || '-'}</td>
                            <td style={{ textAlign: 'center', color: 'var(--info-600)' }}>{aItems.filter(i => i.status === 'in_progress').length || '-'}</td>
                            <td style={{ textAlign: 'center', color: 'var(--warning-600)' }}>{aItems.filter(i => i.status === 'review').length || '-'}</td>
                            <td style={{ textAlign: 'center', color: 'var(--success-600)' }}>{done || '-'}</td>
                            <td style={{ textAlign: 'center' }}>
                              {aItems.length > 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                  <div className="progress-bar" style={{ width: 60, height: 6 }}>
                                    <div className="progress-fill green" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 600 }}>{pct}%</span>
                                </div>
                              ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No items</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Stats + Burn-down + Status mix */}
          {selectedAssessment !== '__all__' && burndown && burndown.total > 0 && (
            <div className="charts-grid" style={{ marginBottom: 20 }}>
              <div className="chart-card">
                <h3>Burn-down</h3>
                <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFeatureSettings: '"tnum"' }}>{burndown.completed}/{burndown.total}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Completed</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success-600)', fontFeatureSettings: '"tnum"' }}>{burndown.percentage}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Progress</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={burnChart}>
                    <defs>
                      <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="remaining" stroke="#6366f1" strokeWidth={2}
                      fill="url(#burnFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Status Distribution</h3>
                {statusPie.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>No status data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                        paddingAngle={3} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}>
                        {statusPie.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Form modal */}
          {showForm && selectedAssessment !== '__all__' && (
            <div className="modal-overlay" onClick={resetForm}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>{editing ? 'Edit Action Item' : 'New Action Item'}</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Title *</label>
                    <input required value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="What needs to be done?" />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Add context, success criteria, etc." />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Priority</label>
                      <select value={form.priority}
                        onChange={e => setForm({ ...form, priority: e.target.value })}>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Phase</label>
                      <select value={form.phase}
                        onChange={e => setForm({ ...form, phase: e.target.value })}>
                        <option value="">None</option>
                        <option value="30">First 30 days</option>
                        <option value="60">30-60 days</option>
                        <option value="90">60-90 days</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Assignee</label>
                      <input value={form.assignee_name}
                        onChange={e => setForm({ ...form, assignee_name: e.target.value })}
                        placeholder="Team member name" />
                    </div>
                    <div className="form-group">
                      <label>Due Date</label>
                      <input type="date" value={form.due_date}
                        onChange={e => setForm({ ...form, due_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <input value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        placeholder="e.g. Security, Process" />
                    </div>
                    <div className="form-group">
                      <label>Effort</label>
                      <select value={form.effort}
                        onChange={e => setForm({ ...form, effort: e.target.value })}>
                        <option value="">Select…</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Kanban */}
          {selectedAssessment !== '__all__' && (
          <div className="kanban">
            {COLUMNS.map(col => (
              <div key={col.id} className="kanban-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId) moveItem(draggedId, col.id);
                  setDraggedId(null);
                }}>
                <div className="kanban-col-header" style={{ background: col.bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <strong style={{ color: col.color }}>{col.title}</strong>
                  </div>
                  <span className="kanban-count">{grouped[col.id].length}</span>
                </div>
                <div className="kanban-col-body">
                  {grouped[col.id].length === 0 ? (
                    <div className="kanban-empty">No items</div>
                  ) : (
                    grouped[col.id].map(item => (
                      <div key={item.id} className="kanban-card"
                        draggable
                        onDragStart={() => setDraggedId(item.id)}
                        onDragEnd={() => setDraggedId(null)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                          <span className={`badge ${PRIORITY_BADGE[item.priority] || 'badge-info'}`}>{item.priority}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="kanban-icon-btn" title="Edit" onClick={() => handleEdit(item)}>
                              <IconEdit size={14} />
                            </button>
                            <button className="kanban-icon-btn" title="Delete" onClick={() => handleDelete(item.id)}>
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="kanban-title" style={{ cursor: 'pointer' }} onClick={() => openDetail(item)}>{item.title}</div>
                        {item.description && (
                          <div className="kanban-desc">{item.description}</div>
                        )}

                        {item.progress > 0 && item.progress < 100 && (
                          <div className="progress-bar" style={{ height: 4, marginTop: 10 }}>
                            <div className="progress-fill blue" style={{ width: `${item.progress}%` }} />
                          </div>
                        )}

                        <div className="kanban-meta">
                          {item.assessment_title && selectedAssessment === '__all__' && (
                            <span style={{ fontSize: 10, color: 'var(--brand-600)', fontWeight: 500 }}>{item.assessment_title}</span>
                          )}
                          {item.assignee_name && (
                            <span><IconUser size={11} /> {item.assignee_name}</span>
                          )}
                          {item.due_date && (
                            <span><IconCalendar size={11} /> {new Date(item.due_date).toLocaleDateString()}</span>
                          )}
                          {item.phase && (
                            <span className="badge badge-purple">{item.phase}d</span>
                          )}
                        </div>

                        {/* Quick status switcher */}
                        <div className="kanban-actions">
                          {COLUMNS.filter(c => c.id !== item.status).map(c => (
                            <button key={c.id} className="kanban-mini-btn"
                              onClick={() => moveItem(item.id, c.id)}
                              style={{ color: c.color }}>
                              → {c.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Detail Modal with Notes & Logs */}
          {detailItem && (
            <div className="modal-overlay" onClick={closeDetail}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '85vh', overflow: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 17, marginBottom: 6 }}>{detailItem.title}</h3>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`badge ${PRIORITY_BADGE[detailItem.priority] || 'badge-info'}`}>{detailItem.priority}</span>
                      <span className={`badge ${detailItem.status === 'done' ? 'badge-success' : detailItem.status === 'in_progress' ? 'badge-info' : detailItem.status === 'review' ? 'badge-warning' : 'badge-purple'}`}>{detailItem.status}</span>
                      {detailItem.category && <span className="badge badge-purple">{detailItem.category}</span>}
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={closeDetail}>✕</button>
                </div>

                {/* Details */}
                {detailItem.description && (
                  <div style={{ marginBottom: 16, padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {detailItem.description}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
                  <div><strong style={{ color: 'var(--text-tertiary)' }}>Assignee:</strong> {detailItem.assignee_name || 'Unassigned'}</div>
                  <div><strong style={{ color: 'var(--text-tertiary)' }}>Due Date:</strong> {detailItem.due_date ? new Date(detailItem.due_date).toLocaleDateString() : 'Not set'}</div>
                  <div><strong style={{ color: 'var(--text-tertiary)' }}>Phase:</strong> {detailItem.phase ? `${detailItem.phase} days` : 'Not set'}</div>
                  <div><strong style={{ color: 'var(--text-tertiary)' }}>Effort:</strong> {detailItem.effort || 'Not set'}</div>
                  <div><strong style={{ color: 'var(--text-tertiary)' }}>Created:</strong> {new Date(detailItem.created_at).toLocaleString()}</div>
                  <div><strong style={{ color: 'var(--text-tertiary)' }}>Created By:</strong> {detailItem.created_by || 'System'}</div>
                </div>

                {/* Notes */}
                {detailItem.notes && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes</h4>
                    <div style={{ padding: 12, background: 'var(--warning-50)', border: '1px solid var(--warning-100)', borderRadius: 'var(--r-md)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                      {detailItem.notes}
                    </div>
                  </div>
                )}

                {/* Add Note */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Note</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddNote(); }}
                      placeholder="Add a note or comment..."
                      style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13 }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleAddNote} disabled={!newNote.trim()}>Add</button>
                  </div>
                </div>

                {/* Activity Log */}
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity Log</h4>
                  {loadingLogs ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading logs...</div>
                  ) : detailLogs.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No activity recorded yet</div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: 20 }}>
                      <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: 'var(--gray-200)' }} />
                      {detailLogs.map((log, i) => (
                        <div key={log.id || i} style={{ position: 'relative', marginBottom: 12, paddingLeft: 16 }}>
                          <div style={{
                            position: 'absolute', left: -4, top: 5, width: 10, height: 10, borderRadius: '50%',
                            background: log.action === 'status_change' ? 'var(--info-500)' :
                              log.action === 'created' ? 'var(--success-500)' :
                              log.action === 'assigned' ? 'var(--purple-500)' :
                              log.action === 'note_added' ? 'var(--warning-500)' : 'var(--gray-400)',
                            border: '2px solid white', boxShadow: '0 0 0 2px var(--gray-100)'
                          }} />
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            <strong>{log.user_name || 'System'}</strong>
                            {' — '}
                            <span>{log.note || log.action}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActionItems;
