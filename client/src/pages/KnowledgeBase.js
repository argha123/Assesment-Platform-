import React, { useEffect, useMemo, useState } from 'react';
import {
  getArticles, createArticle, updateArticle, deleteArticle
} from '../services/api';
import {
  IconBookOpen, IconPlus, IconSearch, IconTrash, IconEdit, IconArrowLeft
} from '../components/Icons';

const CATEGORIES = ['', 'Getting Started', 'People', 'Process', 'Technology'];

function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState({ search: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reading, setReading] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: '', subcategory: '' });

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.search) params.search = filter.search;
      if (filter.category) params.category = filter.category;
      const res = await getArticles(params);
      setArticles(res.data || []);
    } catch (e) {
      console.error('Failed to load articles:', e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', content: '', category: '', subcategory: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await updateArticle(editing.id, form);
      else await createArticle(form);
      resetForm();
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save article.');
    }
  };

  const handleEdit = (article) => {
    setEditing(article);
    setForm({
      title: article.title || '',
      content: article.content || '',
      category: article.category || '',
      subcategory: article.subcategory || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this article?')) return;
    await deleteArticle(id);
    if (reading?.id === id) setReading(null);
    load();
  };

  const categories = useMemo(() => {
    const set = new Set();
    articles.forEach(a => a.category && set.add(a.category));
    return ['', ...Array.from(set)];
  }, [articles]);

  // ---- Reading view ----
  if (reading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <button className="btn btn-outline btn-sm" onClick={() => setReading(null)} style={{ marginBottom: 12 }}>
              <IconArrowLeft size={13} /> Back to library
            </button>
            <h2>{reading.title}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {reading.category && <span className="badge badge-info">{reading.category}</span>}
              {reading.subcategory && <span className="badge badge-purple">{reading.subcategory}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => handleEdit(reading)}>
              <IconEdit size={13} /> Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(reading.id)}>
              <IconTrash size={13} /> Delete
            </button>
          </div>
        </div>
        <div className="card">
          <div style={{
            whiteSpace: 'pre-wrap', lineHeight: 1.75, color: 'var(--text-secondary)',
            fontSize: 15
          }}>
            {reading.content}
          </div>
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-tertiary)' }}>
            Last updated · {new Date(reading.updated_at).toLocaleString()}
          </div>
        </div>

        {showForm && editing && editing.id === reading.id && (
          <ArticleModal form={form} setForm={setForm} editing={editing}
            onClose={resetForm} onSubmit={handleSubmit} />
        )}
      </div>
    );
  }

  // ---- Library view ----
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Knowledge Base</h2>
          <p>Best practices library · Search articles by keyword or category</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <IconPlus size={14} /> New Article
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Title, content or tags…"
                value={filter.search}
                onChange={e => setFilter({ ...filter, search: e.target.value })}
                style={{ paddingLeft: 38 }} />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <IconSearch size={16} />
              </span>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Category</label>
            <select value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}>
              {categories.map(c => <option key={c || 'all'} value={c}>{c || 'All categories'}</option>)}
              {CATEGORIES.filter(c => c && !categories.includes(c)).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading articles…</div>
      ) : articles.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><IconBookOpen size={28} /></div>
          <h3>No articles found</h3>
          <p>Try a different search or create a new article.</p>
        </div>
      ) : (
        <div className="kb-grid">
          {articles.map(a => (
            <div key={a.id} className="kb-card" onClick={() => setReading(a)}>
              <div className="kb-card-icon"><IconBookOpen size={22} /></div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.01em' }}>{a.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12, lineHeight: 1.55,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {a.content}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {a.category && <span className="badge badge-info">{a.category}</span>}
                  {a.subcategory && <span className="badge badge-purple">{a.subcategory}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ArticleModal form={form} setForm={setForm} editing={editing}
          onClose={resetForm} onSubmit={handleSubmit} />
      )}
    </div>
  );
}

function ArticleModal({ form, setForm, editing, onClose, onSubmit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <h3>{editing ? 'Edit Article' : 'New Article'}</h3>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input required value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Article title" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Process, Technology" />
            </div>
            <div className="form-group">
              <label>Subcategory</label>
              <input value={form.subcategory}
                onChange={e => setForm({ ...form, subcategory: e.target.value })}
                placeholder="e.g. ITSM, Cloud" />
            </div>
          </div>
          <div className="form-group">
            <label>Content *</label>
            <textarea required value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Write your article in plain text or markdown…"
              style={{ minHeight: 220 }} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Publish'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default KnowledgeBase;
