import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  getActionItems, createActionItem, updateActionItem, deleteActionItem,
  getBurnDown, getAssessments
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
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    assignee_name: '', due_date: '', phase: '', category: '', effort: '', impact: ''
  });

  // Load assessments once
  useEffect(() => {
    getAssessments()
      .then(res => {
        setAssessments(res.data || []);
        if (res.data?.length) setSelectedAssessment(res.data[0].id);
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
      const [itemsRes, bdRes] = await Promise.all([
        getActionItems({ assessment_id: selectedAssessment }),
        getBurnDown(selectedAssessment)
      ]);
      setItems(itemsRes.data || []);
      setBurndown(bdRes.data);
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
        <button className="btn btn-primary" onClick={() => setShowForm(true)} disabled={!selectedAssessment}>
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
            <div className="form-row" style={{ gridTemplateColumns: '1fr', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Assessment</label>
                <select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)}>
                  {assessments.map(a => (
                    <option key={a.id} value={a.id}>{a.title} — {a.account_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats + Burn-down + Status mix */}
          {burndown && burndown.total > 0 && (
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
          {showForm && (
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
                        <div className="kanban-title">{item.title}</div>
                        {item.description && (
                          <div className="kanban-desc">{item.description}</div>
                        )}

                        {item.progress > 0 && item.progress < 100 && (
                          <div className="progress-bar" style={{ height: 4, marginTop: 10 }}>
                            <div className="progress-fill blue" style={{ width: `${item.progress}%` }} />
                          </div>
                        )}

                        <div className="kanban-meta">
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
        </>
      )}
    </div>
  );
}

export default ActionItems;
