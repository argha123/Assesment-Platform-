import React, { useEffect, useState } from 'react';
import { getTemplates, createTemplate } from '../services/api';
import { IconLayout, IconPlus, IconCheck } from '../components/Icons';

const TEMPLATE_ICON_BG = {
  comprehensive:        'linear-gradient(135deg, #6366f1, #818cf8)',
  cloud:                'linear-gradient(135deg, #06b6d4, #38bdf8)',
  security:             'linear-gradient(135deg, #ef4444, #f87171)',
  devops:               'linear-gradient(135deg, #10b981, #34d399)',
  vendor_risk:          'linear-gradient(135deg, #f59e0b, #fbbf24)',
  digital_transformation:'linear-gradient(135deg, #a855f7, #c084fc)',
  default:              'linear-gradient(135deg, #64748b, #94a3b8)'
};

const INDUSTRIES = [
  '', 'Technology', 'LSH-Healthcare', 'Financial Services',
  'Manufacturing', 'RCTH', 'Education', 'Government',
  'E&UPS', 'Telecommunications', 'APMEA', 'F&G'
];

const FOCUS_OPTIONS = [
  { id: 'people',     label: 'People' },
  { id: 'process',    label: 'Process' },
  { id: 'technology', label: 'Technology' }
];

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', template_type: 'custom', industry: '',
    focus_areas: ['people', 'process', 'technology']
  });

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [industry]);

  const load = async () => {
    setLoading(true);
    try {
      const params = industry ? { industry } : {};
      const res = await getTemplates(params);
      setTemplates(res.data || []);
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFocus = (id) => {
    setForm(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(id)
        ? prev.focus_areas.filter(x => x !== id)
        : [...prev.focus_areas, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTemplate(form);
      setShowForm(false);
      setForm({ name: '', description: '', template_type: 'custom', industry: '', focus_areas: ['people', 'process', 'technology'] });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create template.');
    }
  };

  const parseFocus = (raw) => {
    try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || []); } catch { return []; }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Assessment Templates</h2>
          <p>Pre-built and custom assessment configurations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <IconPlus size={14} /> Custom Template
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row" style={{ gridTemplateColumns: '1fr', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filter by Industry</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)}>
              {INDUSTRIES.map(i => (
                <option key={i || 'all'} value={i}>{i || 'All industries'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create Custom Template</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. PCI DSS Quick Check" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this template for?" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Template Type</label>
                  <input value={form.template_type}
                    onChange={e => setForm({ ...form, template_type: e.target.value })}
                    placeholder="custom, security, cloud..." />
                </div>
                <div className="form-group">
                  <label>Industry (optional)</label>
                  <select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
                    {INDUSTRIES.map(i => <option key={i || 'any'} value={i}>{i || 'Any industry'}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Focus Areas</label>
                <div className="checkbox-grid">
                  {FOCUS_OPTIONS.map(f => (
                    <div key={f.id}
                      className={`checkbox-item ${form.focus_areas.includes(f.id) ? 'selected' : ''}`}
                      onClick={() => toggleFocus(f.id)}>
                      <input type="checkbox" readOnly checked={form.focus_areas.includes(f.id)} />
                      <strong>{f.label}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading templates…</div>
      ) : templates.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><IconLayout size={28} /></div>
          <h3>No templates found</h3>
          <p>Try clearing the industry filter or create a custom template.</p>
        </div>
      ) : (
        <div className="template-grid">
          {templates.map(t => {
            const focus = parseFocus(t.focus_areas);
            const bg = TEMPLATE_ICON_BG[t.template_type] || TEMPLATE_ICON_BG.default;
            return (
              <div key={t.id} className="template-card">
                <div className="template-card-icon" style={{ background: bg }}>
                  <IconLayout size={22} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{t.name}</h4>
                    {t.is_default ? <span className="badge badge-success"><IconCheck size={10} /> Default</span> : null}
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)', marginBottom: 14, flex: 1 }}>{t.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span className="badge badge-info">{t.template_type}</span>
                    {t.industry && <span className="badge badge-purple">{t.industry}</span>}
                    {focus.map(f => (
                      <span key={f} className="badge badge-warning" style={{ textTransform: 'capitalize' }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Templates;
