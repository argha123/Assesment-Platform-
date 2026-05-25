import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccounts, getScopes, createScope, startAssessment, getFrameworks } from '../services/api';
import { IconPlus, IconPlay, IconTarget, IconShield } from '../components/Icons';

const TECH_DOMAINS = {
  'DWP': {
    label: 'DWP (Digital Workplace)',
    clusters: {
      'WPE': {
        label: 'WPE (Work Place Engg.)',
        technologies: [
          'Application Packaging', 'Citrix', 'VDI', 'Workplace Virtualization',
          'Imaging Solution', 'JAMF', 'Intune', 'SCCM', 'Big Fix',
          'Image Engineering', 'MAC', 'AVD', 'Software Packaging',
          'Airwatch', 'MDT - Image Management', 'Mobility',
          'Enterprise Mobility Management', 'Workstation Management',
          'W365', 'Tanium', 'Print & File Services'
        ]
      },
      'UMC': {
        label: 'UMC (Unified Messaging & Collaboration)',
        technologies: [
          'Collaboration Services', 'Email Workflow SMTP', 'Messaging Services',
          'MS Exchange', 'SharePoint', 'Active Directory', 'MS Teams',
          'M365 Suite', 'O365 Suite', 'Messaging & Collaboration',
          'MS Defender', 'Dominio', 'GPO', 'G-Suite', 'Tanium',
          'Collaboration support Atmus', 'Zoom', 'PowerApps', 'Right Fax'
        ]
      }
    }
  },
  'HCBU': {
    label: 'HCBU (Hybrid Cloud & Backup)',
    clusters: {}
  },
  'Networks Data & Voice': {
    label: 'Networks Data & Voice',
    clusters: {}
  },
  'Middleware': {
    label: 'Middleware',
    clusters: {}
  }
};

const DEPARTMENTS = [
  'IT Operations', 'Development', 'Security', 'Network',
  'Database Administration', 'Help Desk', 'Project Management',
  'Architecture', 'Cloud Operations', 'DevOps', 'QA/Testing',
  'Business Intelligence', 'Data Science', 'Compliance'
];

const FOCUS_AREAS = [
  { id: 'people', label: 'People', description: 'Skills, leadership, culture, training' },
  { id: 'process', label: 'Process', description: 'ITSM, security, DevOps, compliance' },
  { id: 'technology', label: 'Technology', description: 'Infrastructure, cloud, security tools' }
];

const INFRASTRUCTURE_TYPES = [
  'Primarily On-Premises', 'Hybrid (On-Prem + Cloud)', 'Cloud-First',
  'Multi-Cloud', 'Fully Cloud-Native', 'Legacy/Mainframe'
];

function AssessmentScope() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    account_id: '', name: '', description: '',
    assessment_type: 'comprehensive',
    technology_stack: [], domains: [], infrastructure_type: '',
    team_size: '', departments: [], focus_areas: ['people', 'process', 'technology'],
    framework_id: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [accRes, scopeRes, fwRes] = await Promise.all([getAccounts(), getScopes(), getFrameworks()]);
      setAccounts(accRes.data);
      setScopes(scopeRes.data);
      setFrameworks(fwRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (field, item) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createScope(form);
      setShowForm(false);
      loadData();
      setForm({ account_id: '', name: '', description: '', assessment_type: 'comprehensive', technology_stack: [], domains: [], infrastructure_type: '', team_size: '', departments: [], focus_areas: ['people', 'process', 'technology'], framework_id: '' });
    } catch (error) {
      console.error('Failed to create scope:', error);
    }
  };

  const handleStartAssessment = async (scopeId) => {
    try {
      const res = await startAssessment(scopeId);
      navigate(`/assessments/${res.data.id}`);
    } catch (error) {
      console.error('Failed to start assessment:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Assessment Scope</h2>
        <p>Define what to assess - technology stack, teams, and focus areas</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><IconPlus size={14} /> Define New Scope</>}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Define Assessment Scope</h3>
          {accounts.length === 0 ? (
            <div className="empty-state">
              <p>You need to create an account first</p>
              <button className="btn btn-primary" onClick={() => navigate('/accounts')}>Go to Accounts</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Account *</label>
                  <select required value={form.account_id} onChange={e => setForm({...form, account_id: e.target.value})}>
                    <option value="">Select Account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assessment Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Q1 2024 Infrastructure Assessment" />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the scope and objectives of this assessment" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Infrastructure Type</label>
                  <select value={form.infrastructure_type} onChange={e => setForm({...form, infrastructure_type: e.target.value})}>
                    <option value="">Select Type</option>
                    {INFRASTRUCTURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>IT Team Size</label>
                  <select value={form.team_size} onChange={e => setForm({...form, team_size: e.target.value})}>
                    <option value="">Select Size</option>
                    <option value="1-10">1-10 people</option>
                    <option value="11-25">11-25 people</option>
                    <option value="26-50">26-50 people</option>
                    <option value="51-100">51-100 people</option>
                    <option value="100+">100+ people</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Compliance Framework (optional)</label>
                <select value={form.framework_id} onChange={e => setForm({ ...form, framework_id: e.target.value })}>
                  <option value="">No framework — assess everything in scope</option>
                  {frameworks.map(fw => (
                    <option key={fw.id} value={fw.id} disabled={fw.mapped_count === 0}>
                      {fw.code} — {fw.name}{fw.mapped_count === 0 ? ' (no mappings yet)' : ` · ${fw.mapped_count} mapped`}
                    </option>
                  ))}
                </select>
                {form.framework_id && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px',
                    background: 'var(--brand-50)', border: '1px solid var(--brand-100)',
                    borderRadius: 'var(--r-sm)', fontSize: 12.5, color: 'var(--brand-800)',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}>
                    <IconShield size={13} />
                    Only questions mapped to this framework's controls will be included.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Focus Areas *</label>
                <div className="checkbox-grid">
                  {FOCUS_AREAS.map(area => (
                    <div key={area.id} className={`checkbox-item ${form.focus_areas.includes(area.id) ? 'selected' : ''}`} onClick={() => toggleArrayItem('focus_areas', area.id)}>
                      <input type="checkbox" checked={form.focus_areas.includes(area.id)} readOnly />
                      <div>
                        <strong>{area.label}</strong>
                        <div style={{ fontSize: '11px', color: '#666' }}>{area.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Technology Stack — Domains</label>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: -4, marginBottom: 10 }}>
                  Select one or more domains, then choose clusters and technologies within each.
                </p>

                {/* Domain selector */}
                <div className="checkbox-grid" style={{ marginBottom: 16 }}>
                  {Object.entries(TECH_DOMAINS).map(([domainKey, domain]) => (
                    <div key={domainKey}
                      className={`checkbox-item ${form.domains.includes(domainKey) ? 'selected' : ''}`}
                      onClick={() => toggleArrayItem('domains', domainKey)}>
                      <input type="checkbox" checked={form.domains.includes(domainKey)} readOnly />
                      <strong>{domain.label}</strong>
                    </div>
                  ))}
                </div>

                {/* Cluster & Technology detail for selected domains */}
                {form.domains.map(domainKey => {
                  const domain = TECH_DOMAINS[domainKey];
                  if (!domain) return null;
                  const clusters = Object.entries(domain.clusters || {});
                  if (clusters.length === 0) return (
                    <div key={domainKey} style={{
                      padding: '12px 14px', background: 'var(--gray-50)',
                      border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                      marginBottom: 12, fontSize: 13, color: 'var(--text-tertiary)'
                    }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{domain.label}</strong> — clusters & technologies coming soon.
                    </div>
                  );
                  return (
                    <div key={domainKey} style={{
                      padding: '14px', background: 'var(--gray-50)',
                      border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                      marginBottom: 12
                    }}>
                      <div style={{ fontWeight: 650, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>
                        {domain.label}
                      </div>
                      {clusters.map(([clusterKey, cluster]) => (
                        <div key={clusterKey} style={{ marginBottom: 14 }}>
                          <div style={{
                            fontSize: 12.5, fontWeight: 600, color: 'var(--brand-700)',
                            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8,
                            paddingBottom: 6, borderBottom: '1px dashed var(--border)'
                          }}>
                            {cluster.label}
                          </div>
                          <div className="checkbox-grid">
                            {cluster.technologies.map(tech => (
                              <div key={tech}
                                className={`checkbox-item ${form.technology_stack.includes(tech) ? 'selected' : ''}`}
                                onClick={() => toggleArrayItem('technology_stack', tech)}>
                                <input type="checkbox" checked={form.technology_stack.includes(tech)} readOnly />
                                <span>{tech}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="form-group">
                <label>Departments in Scope</label>
                <div className="checkbox-grid">
                  {DEPARTMENTS.map(dept => (
                    <div key={dept} className={`checkbox-item ${form.departments.includes(dept) ? 'selected' : ''}`} onClick={() => toggleArrayItem('departments', dept)}>
                      <input type="checkbox" checked={form.departments.includes(dept)} readOnly />
                      <span>{dept}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-success">Create Assessment Scope</button>
            </form>
          )}
        </div>
      )}

      {scopes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><IconTarget size={28} /></div>
            <h3>No Assessment Scopes Defined</h3>
            <p>Define your first assessment scope to start evaluating infrastructure</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Defined Scopes</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Framework</th>
                  <th>Infrastructure</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scopes.map(scope => {
                  const fw = frameworks.find(f => f.id === scope.framework_id);
                  return (
                    <tr key={scope.id}>
                      <td style={{ fontWeight: 500 }}>{scope.name}</td>
                      <td>{scope.account_name}</td>
                      <td><span className="badge badge-info">{scope.assessment_type}</span></td>
                      <td>{fw ? <span className="badge badge-purple">{fw.code}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td>{scope.infrastructure_type || '-'}</td>
                      <td><span className={`badge ${scope.status === 'draft' ? 'badge-warning' : 'badge-success'}`}>{scope.status}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleStartAssessment(scope.id)}>
                          <IconPlay size={12} /> Start Assessment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentScope;
