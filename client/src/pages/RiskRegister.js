import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, Cell, ZAxis
} from 'recharts';
import {
  getRiskRegister, createRisk, updateRisk, calculateRoi, getAssessments
} from '../services/api';
import {
  IconShieldAlert, IconPlus, IconDollar, IconChartGauge, IconEdit, IconAlertTriangle
} from '../components/Icons';

const RISK_COLOR = (score) => {
  if (score >= 8) return '#ef4444';
  if (score >= 6) return '#f59e0b';
  if (score >= 4) return '#3b82f6';
  return '#10b981';
};

const RISK_BADGE = (score) => {
  if (score >= 8) return 'badge-danger';
  if (score >= 6) return 'badge-warning';
  if (score >= 4) return 'badge-info';
  return 'badge-success';
};

const RISK_LABEL = (score) => {
  if (score >= 8) return 'Critical';
  if (score >= 6) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
};

const STATUS_BADGE = {
  open:      'badge-warning',
  mitigated: 'badge-success',
  accepted:  'badge-info',
  closed:    'badge-purple'
};

function formatMoney(n) {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n}`;
}

function RiskRegister() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [data, setData] = useState({ summary: null, risks: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showRoi, setShowRoi] = useState(false);
  const [roiResult, setRoiResult] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [form, setForm] = useState({
    risk_title: '', description: '', category: '',
    likelihood: 5, impact: 5, financial_impact: 0, mitigation: '', status: 'open'
  });

  useEffect(() => {
    getAssessments()
      .then(res => {
        setAssessments(res.data || []);
        if (res.data?.length) setSelectedAssessment(res.data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAssessment) { setData({ summary: null, risks: [] }); return; }
    loadRisks();
    // eslint-disable-next-line
  }, [selectedAssessment]);

  const loadRisks = async () => {
    try {
      const res = await getRiskRegister(selectedAssessment);
      setData(res.data);
    } catch (e) {
      console.error('Failed to load risks:', e);
    }
  };

  const resetForm = () => {
    setForm({
      risk_title: '', description: '', category: '',
      likelihood: 5, impact: 5, financial_impact: 0, mitigation: '', status: 'open'
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await updateRisk(editing.id, form);
      else await createRisk({ ...form, assessment_id: selectedAssessment });
      resetForm();
      loadRisks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save risk.');
    }
  };

  const handleEdit = (risk) => {
    setEditing(risk);
    setForm({
      risk_title: risk.risk_title || '',
      description: risk.description || '',
      category: risk.category || '',
      likelihood: risk.likelihood || 5,
      impact: risk.impact || 5,
      financial_impact: risk.financial_impact || 0,
      mitigation: risk.mitigation || '',
      status: risk.status || 'open'
    });
    setShowForm(true);
  };

  const runRoi = async () => {
    setRoiResult(null);
    try {
      const res = await calculateRoi({
        risks: data.risks,
        investments: [{ cost: Number(investmentAmount) || 0 }]
      });
      setRoiResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to calculate ROI.');
    }
  };

  const matrixData = useMemo(() => data.risks.map(r => ({
    x: r.likelihood, y: r.impact, score: r.risk_score, name: r.risk_title, id: r.id
  })), [data.risks]);

  if (loading) return <div className="loading">Loading risks…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Risk Register</h2>
          <p>Track risks, financial exposure, and ROI of mitigations</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setShowRoi(true)} disabled={!selectedAssessment}>
            <IconDollar size={14} /> ROI Calculator
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} disabled={!selectedAssessment}>
            <IconPlus size={14} /> New Risk
          </button>
        </div>
      </div>

      {assessments.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><IconShieldAlert size={28} /></div>
          <h3>No assessments available</h3>
          <p>Create an assessment first, then add risks against it.</p>
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

          {/* Summary */}
          {data.summary && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple"><IconShieldAlert /></div>
                <div className="stat-info">
                  <h4>{data.summary.total}</h4>
                  <p>Total risks</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange"><IconAlertTriangle /></div>
                <div className="stat-info">
                  <h4>{data.summary.critical + data.summary.high}</h4>
                  <p>Critical & High</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><IconChartGauge /></div>
                <div className="stat-info">
                  <h4>{data.summary.mitigated}</h4>
                  <p>Mitigated</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><IconDollar /></div>
                <div className="stat-info">
                  <h4>{formatMoney(data.summary.total_financial_exposure)}</h4>
                  <p>Total exposure</p>
                </div>
              </div>
            </div>
          )}

          {/* Heatmap matrix */}
          {data.risks.length > 0 && (
            <div className="chart-card" style={{ marginBottom: 20 }}>
              <h3>Risk Matrix · Likelihood × Impact</h3>
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="x" name="Likelihood" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]}
                    label={{ value: 'Likelihood', position: 'insideBottom', offset: -5, fill: '#64748b' }} />
                  <YAxis type="number" dataKey="y" name="Impact" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]}
                    label={{ value: 'Impact', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                  <ZAxis type="number" dataKey="score" range={[80, 360]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const p = payload[0].payload;
                      return (
                        <div style={{ background: '#0f172a', color: 'white', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                          <div>Likelihood: {p.x} · Impact: {p.y}</div>
                          <div>Score: {p.score?.toFixed(1)}</div>
                        </div>
                      );
                    }} />
                  {/* Quadrant tints */}
                  <ReferenceArea x1={6} y1={6} x2={10} y2={10} fill="#ef4444" fillOpacity={0.08} />
                  <ReferenceArea x1={3} y1={3} x2={6}  y2={6}  fill="#f59e0b" fillOpacity={0.08} />
                  <ReferenceArea x1={0} y1={0} x2={3}  y2={3}  fill="#10b981" fillOpacity={0.08} />
                  <Scatter data={matrixData}>
                    {matrixData.map((entry, i) => (
                      <Cell key={i} fill={RISK_COLOR(entry.score)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Risks table */}
          <div className="card">
            <div className="card-header">
              <h3>All Risks ({data.risks.length})</h3>
            </div>
            {data.risks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><IconShieldAlert size={28} /></div>
                <h3>No risks yet</h3>
                <p>Add risks to start quantifying exposure and ROI.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Risk</th>
                      <th>Category</th>
                      <th>Likelihood</th>
                      <th>Impact</th>
                      <th>Score</th>
                      <th>Financial</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.risks.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{r.risk_title}</div>
                          {r.description && (
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                              {r.description.length > 80 ? r.description.substring(0, 80) + '…' : r.description}
                            </div>
                          )}
                        </td>
                        <td>{r.category || '-'}</td>
                        <td style={{ fontFeatureSettings: '"tnum"' }}>{r.likelihood}/10</td>
                        <td style={{ fontFeatureSettings: '"tnum"' }}>{r.impact}/10</td>
                        <td>
                          <span className={`badge ${RISK_BADGE(r.risk_score)}`}>{RISK_LABEL(r.risk_score)} · {r.risk_score?.toFixed(1)}</span>
                        </td>
                        <td style={{ fontFeatureSettings: '"tnum"', fontWeight: 500 }}>{formatMoney(r.financial_impact)}</td>
                        <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-info'}`}>{r.status || 'open'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEdit(r)}>
                            <IconEdit size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Risk modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Risk' : 'New Risk'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Risk Title *</label>
                <input required value={form.risk_title}
                  onChange={e => setForm({ ...form, risk_title: e.target.value })}
                  placeholder="Briefly describe the risk" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Details, context, scenarios" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Cyber, Compliance" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="open">Open</option>
                    <option value="mitigated">Mitigated</option>
                    <option value="accepted">Accepted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Likelihood (1–10) · {form.likelihood}</label>
                  <input type="range" min={1} max={10} value={form.likelihood}
                    onChange={e => setForm({ ...form, likelihood: Number(e.target.value) })}
                    style={{ accentColor: 'var(--brand-600)' }} />
                </div>
                <div className="form-group">
                  <label>Impact (1–10) · {form.impact}</label>
                  <input type="range" min={1} max={10} value={form.impact}
                    onChange={e => setForm({ ...form, impact: Number(e.target.value) })}
                    style={{ accentColor: 'var(--brand-600)' }} />
                </div>
              </div>
              <div className="form-group">
                <label>Financial Impact (annualised, USD)</label>
                <input type="number" min={0} value={form.financial_impact}
                  onChange={e => setForm({ ...form, financial_impact: Number(e.target.value) })}
                  placeholder="Estimated annual loss exposure" />
              </div>
              <div className="form-group">
                <label>Mitigation</label>
                <textarea value={form.mitigation}
                  onChange={e => setForm({ ...form, mitigation: e.target.value })}
                  placeholder="Planned mitigation actions" />
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: 12, fontSize: 13 }}>
                <strong>Computed risk score:</strong> {((form.likelihood * form.impact) / 10).toFixed(1)} / 10
                <span style={{ marginLeft: 10 }} className={`badge ${RISK_BADGE((form.likelihood * form.impact) / 10)}`}>
                  {RISK_LABEL((form.likelihood * form.impact) / 10)}
                </span>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Risk'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROI modal */}
      {showRoi && (
        <div className="modal-overlay" onClick={() => { setShowRoi(false); setRoiResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>ROI Calculator</h3>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: 14, fontSize: 13.5 }}>
              Estimate ROI of mitigation investments. Assumes a 60% reduction in financial exposure
              from the risks in this register.
            </p>
            <div className="form-group">
              <label>Mitigation Investment (USD)</label>
              <input type="number" min={0} value={investmentAmount}
                onChange={e => setInvestmentAmount(e.target.value)}
                placeholder="Enter total proposed investment" />
            </div>
            <button type="button" className="btn btn-primary" onClick={runRoi}>Calculate ROI</button>

            {roiResult && (
              <div style={{ marginTop: 16 }}>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="stat-card">
                    <div className="stat-icon green"><IconChartGauge /></div>
                    <div className="stat-info">
                      <h4>{roiResult.roi_percentage}%</h4>
                      <p>Estimated ROI</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon blue"><IconDollar /></div>
                    <div className="stat-info">
                      <h4>{formatMoney(roiResult.net_benefit)}</h4>
                      <p>Net Benefit</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon orange"><IconAlertTriangle /></div>
                    <div className="stat-info">
                      <h4>{formatMoney(roiResult.estimated_risk_reduction)}</h4>
                      <p>Risk Reduction</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon purple"><IconChartGauge /></div>
                    <div className="stat-info">
                      <h4>{roiResult.payback_months || '—'}</h4>
                      <p>Months to payback</p>
                    </div>
                  </div>
                </div>
                <div style={{
                  marginTop: 8, padding: '10px 14px',
                  background: 'var(--brand-50)', border: '1px solid var(--brand-100)',
                  borderRadius: 'var(--r-md)', color: 'var(--brand-800)', fontSize: 13.5
                }}>
                  <strong>Recommendation:</strong> {roiResult.recommendation}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => { setShowRoi(false); setRoiResult(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskRegister;
