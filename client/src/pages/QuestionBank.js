import React, { useEffect, useMemo, useState } from 'react';
import {
  getQuestions, getQuestionCategories, createQuestion, updateQuestion, deleteQuestion
} from '../services/api';
import {
  IconPlus, IconEdit, IconTrash, IconSearch, IconCheckCircle,
  IconAlertTriangle, IconClipboard
} from '../components/Icons';

const CATEGORIES = ['People', 'Process', 'Technology'];

function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', subcategory: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  function blankForm() {
    return {
      category: 'People', subcategory: '', question_text: '',
      question_type: 'rating', weight: 1.0, maturity_level: '',
      applicable_to: '', tags: ''
    };
  }

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [qRes, catRes] = await Promise.all([getQuestions(), getQuestionCategories()]);
      setQuestions(qRes.data || []);
      setSubcategories(catRes.data || []);
    } catch (e) {
      console.error('Failed to load questions:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (filter.category && q.category.toLowerCase() !== filter.category.toLowerCase()) return false;
      if (filter.subcategory && q.subcategory !== filter.subcategory) return false;
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const blob = `${q.question_text} ${q.subcategory} ${q.tags || ''}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [questions, filter]);

  const subcatOptions = useMemo(() => {
    if (!filter.category) return [...new Set(questions.map(q => q.subcategory))].sort();
    return [...new Set(questions.filter(q => q.category.toLowerCase() === filter.category.toLowerCase()).map(q => q.subcategory))].sort();
  }, [questions, filter.category]);

  const stats = useMemo(() => ({
    total: questions.length,
    people: questions.filter(q => q.category.toLowerCase() === 'people').length,
    process: questions.filter(q => q.category.toLowerCase() === 'process').length,
    technology: questions.filter(q => q.category.toLowerCase() === 'technology').length,
  }), [questions]);

  const resetForm = () => {
    setForm(blankForm());
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (q) => {
    setEditing(q);
    let appTo = '';
    try { appTo = JSON.parse(q.applicable_to || '[]').join(', '); } catch {}
    let tgs = '';
    try { tgs = JSON.parse(q.tags || '[]').join(', '); } catch {}
    setForm({
      category: q.category || 'People',
      subcategory: q.subcategory || '',
      question_text: q.question_text || '',
      question_type: q.question_type || 'rating',
      weight: q.weight || 1.0,
      maturity_level: q.maturity_level || '',
      applicable_to: appTo,
      tags: tgs
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      weight: parseFloat(form.weight) || 1.0,
      applicable_to: form.applicable_to ? form.applicable_to.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : []
    };
    try {
      if (editing) {
        await updateQuestion(editing.id, payload);
        showFeedback('success', 'Question updated.');
      } else {
        await createQuestion(payload);
        showFeedback('success', 'Question created.');
      }
      resetForm();
      load();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to save question.');
    }
  };

  const handleDelete = async (q) => {
    if (!window.confirm(`Delete this question?\n\n"${q.question_text.substring(0, 80)}…"`)) return;
    try {
      await deleteQuestion(q.id);
      showFeedback('success', 'Question deleted.');
      load();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to delete question.');
    }
  };

  if (loading) return <div className="loading">Loading question bank…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Question Bank</h2>
          <p>Manage assessment questions across People, Process & Technology</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <IconPlus size={14} /> New Question
        </button>
      </div>

      {feedback.text && (
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 16,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: feedback.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
          color: feedback.type === 'success' ? 'var(--success-700)' : 'var(--danger-700)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--success-100)' : 'var(--danger-100)'}`,
          fontSize: 13
        }}>
          {feedback.type === 'success' ? <IconCheckCircle size={14} /> : <IconAlertTriangle size={14} />}
          {feedback.text}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon brand"><IconClipboard /></div>
          <div className="stat-info"><h4>{stats.total}</h4><p>Total Questions</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><IconClipboard /></div>
          <div className="stat-info"><h4>{stats.people}</h4><p>People</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><IconClipboard /></div>
          <div className="stat-info"><h4>{stats.process}</h4><p>Process</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><IconClipboard /></div>
          <div className="stat-info"><h4>{stats.technology}</h4><p>Technology</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
              <input value={filter.search}
                onChange={e => setFilter({ ...filter, search: e.target.value })}
                placeholder="Search question text, subcategory, tags…"
                style={{ paddingLeft: 38 }} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <IconSearch size={16} />
              </span>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Category</label>
            <select value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value, subcategory: '' })}>
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Subcategory</label>
            <select value={filter.subcategory} onChange={e => setFilter({ ...filter, subcategory: e.target.value })}>
              <option value="">All</option>
              {subcatOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Questions table */}
      <div className="card">
        <div className="card-header">
          <h3>Questions ({filtered.length})</h3>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconClipboard size={28} /></div>
            <h3>No questions match the filter</h3>
            <p>Try clearing the filters or add a new question.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Question</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Weight</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.id}>
                    <td>
                      <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                        {q.question_text}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${q.category.toLowerCase() === 'people' ? 'badge-info' : q.category.toLowerCase() === 'process' ? 'badge-success' : 'badge-warning'}`}>
                        {q.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{q.subcategory}</td>
                    <td style={{ fontFeatureSettings: '"tnum"', fontWeight: 500 }}>{q.weight}x</td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{q.question_type}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(q)} style={{ marginRight: 6 }}>
                        <IconEdit size={12} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q)}>
                        <IconTrash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>{editing ? 'Edit Question' : 'New Question'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select required value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subcategory *</label>
                  <input required value={form.subcategory}
                    onChange={e => setForm({ ...form, subcategory: e.target.value })}
                    placeholder="e.g. Leadership & Governance" />
                </div>
              </div>
              <div className="form-group">
                <label>Question Text *</label>
                <textarea required value={form.question_text}
                  onChange={e => setForm({ ...form, question_text: e.target.value })}
                  placeholder="Write the assessment question…"
                  style={{ minHeight: 100 }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Question Type</label>
                  <select value={form.question_type}
                    onChange={e => setForm({ ...form, question_type: e.target.value })}>
                    <option value="rating">Rating (1-10)</option>
                    <option value="yes_no">Yes / No</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="text">Free Text</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Weight (multiplier)</label>
                  <input type="number" step="0.1" min="0.1" max="5"
                    value={form.weight}
                    onChange={e => setForm({ ...form, weight: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Maturity Level</label>
                  <select value={form.maturity_level}
                    onChange={e => setForm({ ...form, maturity_level: e.target.value })}>
                    <option value="">Any level</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Applicable To (comma-separated)</label>
                  <input value={form.applicable_to}
                    onChange={e => setForm({ ...form, applicable_to: e.target.value })}
                    placeholder="e.g. AWS, Azure, Kubernetes" />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. security, cloud, governance" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Save Changes' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionBank;
