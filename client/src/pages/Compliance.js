import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  getFrameworks, getComplianceGapReport, getAssessments
} from '../services/api';
import { IconShield, IconShieldCheck, IconShieldAlert, IconAlertTriangle, IconArrowRight } from '../components/Icons';

const STATUS_LABEL = {
  compliant:     'Compliant',
  partial:       'Partial',
  non_compliant: 'Non-compliant',
  not_assessed:  'Not assessed'
};

const STATUS_BADGE = {
  compliant:     'badge-success',
  partial:       'badge-warning',
  non_compliant: 'badge-danger',
  not_assessed:  'badge-info'
};

const STATUS_COLOR = {
  compliant:     '#10b981',
  partial:       '#f59e0b',
  non_compliant: '#ef4444',
  not_assessed:  '#94a3b8'
};

function Compliance() {
  const [frameworks, setFrameworks] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    Promise.all([getFrameworks(), getAssessments()])
      .then(([fw, asm]) => {
        setFrameworks(fw.data || []);
        const completed = (asm.data || []).filter(a => a.status === 'completed');
        setAssessments(completed);
        if (completed.length) setSelectedAssessment(completed[0].id);
      })
      .catch(e => console.error('Failed to load compliance data:', e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAssessment) { setReport(null); return; }
    // Auto-pick framework filter from assessment if it has one (and user hasn't picked one)
    const a = assessments.find(x => x.id === selectedAssessment);
    if (a?.framework_id && !selectedFramework) {
      setSelectedFramework(a.framework_id);
      return; // will trigger re-run
    }
    setReportLoading(true);
    getComplianceGapReport(selectedAssessment, selectedFramework || null)
      .then(res => setReport(res.data))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [selectedAssessment, selectedFramework, assessments]);

  if (loading) return <div className="loading">Loading compliance data…</div>;

  const summary = report?.summary;
  const controls = report?.controls || [];

  const pieData = summary ? [
    { name: 'Compliant',     value: summary.compliant,     color: STATUS_COLOR.compliant },
    { name: 'Partial',       value: summary.partial,       color: STATUS_COLOR.partial },
    { name: 'Non-compliant', value: summary.non_compliant, color: STATUS_COLOR.non_compliant },
    { name: 'Not assessed',  value: summary.not_assessed,  color: STATUS_COLOR.not_assessed }
  ].filter(d => d.value > 0) : [];

  // Group by framework for chart
  const byFramework = controls.reduce((acc, c) => {
    const key = c.framework_code || c.framework_name;
    if (!acc[key]) acc[key] = { name: key, compliant: 0, partial: 0, non_compliant: 0, not_assessed: 0 };
    acc[key][c.status] = (acc[key][c.status] || 0) + 1;
    return acc;
  }, {});
  const frameworkChart = Object.values(byFramework);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Compliance Mapping</h2>
          <p>Map assessment responses to compliance framework controls</p>
        </div>
      </div>

      {/* Frameworks overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon brand"><IconShield /></div>
          <div className="stat-info">
            <h4>{frameworks.length}</h4>
            <p>Frameworks loaded</p>
          </div>
        </div>
        {summary && (
          <>
            <div className="stat-card">
              <div className="stat-icon green"><IconShieldCheck /></div>
              <div className="stat-info">
                <h4>{summary.compliant}</h4>
                <p>Compliant controls</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><IconAlertTriangle /></div>
              <div className="stat-info">
                <h4>{summary.partial}</h4>
                <p>Partial controls</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><IconShieldAlert /></div>
              <div className="stat-info">
                <h4>{summary.compliance_percentage}%</h4>
                <p>Overall compliance</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Frameworks grid */}
      <div className="card">
        <div className="card-header">
          <h3>Compliance Frameworks</h3>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Click a framework to view controls and edit mappings</span>
        </div>
        {frameworks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconShield size={28} /></div>
            <p>No frameworks loaded yet.</p>
          </div>
        ) : (
          <div className="template-grid">
            {frameworks.map(fw => {
              const mapped = fw.mapped_count || 0;
              const total = fw.control_count || 0;
              const pct = total > 0 ? Math.round((mapped / total) * 100) : 0;
              return (
                <Link key={fw.id} to={`/compliance/${fw.id}`} className="template-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="template-card-icon"
                    style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))' }}>
                    <IconShield size={22} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {fw.name}
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12, flex: 1 }}>{fw.description}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span className="badge badge-info">{fw.code}</span>
                      {fw.version && <span className="badge badge-purple">v{fw.version}</span>}
                      <span className="badge badge-warning">{total} controls</span>
                      <span className={`badge ${mapped > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {mapped}/{total} mapped
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: 5 }}>
                      <div className={`progress-fill ${pct >= 70 ? 'green' : pct >= 30 ? 'orange' : 'blue'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: 'var(--brand-600)', fontWeight: 600 }}>
                      View framework <IconArrowRight size={12} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Gap Report */}
      <div className="card">
        <div className="card-header">
          <h3>Gap Report</h3>
          <span className="badge badge-info">{controls.length} controls</span>
        </div>

        <div className="form-row" style={{ alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Completed Assessment</label>
            <select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)}>
              {assessments.length === 0 && <option value="">No completed assessments yet</option>}
              {assessments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.title} — {a.account_name}{a.framework_code ? ` · ${a.framework_code}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Framework Filter</label>
            <select value={selectedFramework} onChange={e => setSelectedFramework(e.target.value)}>
              <option value="">All frameworks</option>
              {frameworks.map(fw => <option key={fw.id} value={fw.id}>{fw.code} — {fw.name}</option>)}
            </select>
          </div>
        </div>

        {/* Helpful tip when "Not assessed" dominates */}
        {summary && summary.not_assessed > 0 && summary.not_assessed === summary.total_controls && (
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'var(--warning-50)', border: '1px solid var(--warning-100)',
            borderRadius: 'var(--r-md)', color: 'var(--warning-700)', fontSize: 13.5,
            display: 'flex', gap: 10, alignItems: 'flex-start'
          }}>
            <IconAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>All controls show "Not assessed".</strong> This usually means the questions in this assessment
              aren't yet mapped to controls in the selected framework. Open a framework to add or adjust mappings,
              then run a new assessment scoped to that framework from the Assessment Scope page.
            </div>
          </div>
        )}

        {!selectedAssessment ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <p>Select a completed assessment to view its compliance gap report.</p>
          </div>
        ) : reportLoading ? (
          <div className="loading">Calculating compliance gaps…</div>
        ) : !summary ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <p>No compliance data available for this assessment.</p>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="charts-grid" style={{ marginTop: 20 }}>
              <div className="chart-card">
                <h3>Status Distribution</h3>
                {pieData.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                        paddingAngle={3} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-card">
                <h3>By Framework</h3>
                {frameworkChart.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={frameworkChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="compliant"     stackId="a" fill={STATUS_COLOR.compliant}     radius={[0, 0, 0, 0]} />
                      <Bar dataKey="partial"       stackId="a" fill={STATUS_COLOR.partial}       radius={[0, 0, 0, 0]} />
                      <Bar dataKey="non_compliant" stackId="a" fill={STATUS_COLOR.non_compliant} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="not_assessed"  stackId="a" fill={STATUS_COLOR.not_assessed}  radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Controls table */}
            <div style={{ marginTop: 16 }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Framework</th>
                      <th>Control ID</th>
                      <th>Control</th>
                      <th>Category</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Mapping</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controls.map(c => (
                      <tr key={c.id}>
                        <td><span className="badge badge-info">{c.framework_code}</span></td>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{c.ctrl_id || c.control_id}</td>
                        <td style={{ fontWeight: 500 }}>{c.control_name}</td>
                        <td style={{ color: 'var(--text-tertiary)' }}>{c.category || '-'}</td>
                        <td style={{ fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                          {c.score == null ? '-' : `${c.score}/10`}
                        </td>
                        <td><span className={`badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                          {c.questions_answered || 0}/{c.questions_mapped || 0} questions
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Compliance;
