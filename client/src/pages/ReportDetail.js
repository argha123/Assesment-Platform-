import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { getReport, pdfExportUrl, excelExportUrl, csvExportUrl } from '../services/api';
import { IconFileText, IconDownload } from '../components/Icons';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadReport(); }, [id]);

  const loadReport = async () => {
    try {
      const res = await getReport(id);
      setReport(res.data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading report...</div>;
  if (!report) return <div className="empty-state"><h3>Report not found</h3></div>;

  const reportData = report.report_data || {};
  const recommendations = report.recommendations || [];
  const actionPlan = report.action_plan || {};
  const scores = reportData.scores || {};
  const categoryBreakdown = scores.categoryBreakdown || {};
  const subcategoryBreakdown = scores.subcategoryBreakdown || {};

  // Chart data
  const categoryData = Object.entries(categoryBreakdown).map(([cat, data]) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    score: data.avgScore,
    fullMark: 10
  }));

  const subcategoryData = Object.entries(subcategoryBreakdown).map(([key, data]) => ({
    name: data.subcategory,
    score: data.avgScore,
    category: data.category
  })).sort((a, b) => a.score - b.score);

  const maturityLevel = reportData.maturityLevel || { level: 0, name: 'Unknown' };
  const gaps = reportData.gaps || [];
  const strengths = reportData.strengths || [];
  const risks = reportData.riskAreas || [];

  const priorityDistribution = [
    { name: 'Critical', value: recommendations.filter(r => r.priority === 'critical').length, color: '#ef4444' },
    { name: 'High',     value: recommendations.filter(r => r.priority === 'high').length,     color: '#f59e0b' },
    { name: 'Medium',   value: recommendations.filter(r => r.priority === 'medium').length,   color: '#3b82f6' },
    { name: 'Low',      value: recommendations.filter(r => r.priority === 'low').length,      color: '#10b981' }
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Assessment Report</h2>
          <p>{report.account_name} - {report.assessment_title}</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <a className="btn btn-outline btn-sm" href={pdfExportUrl(report.id)} target="_blank" rel="noreferrer">
            <IconDownload size={13} /> PDF
          </a>
          <a className="btn btn-outline btn-sm" href={excelExportUrl(report.assessment_id)} target="_blank" rel="noreferrer">
            <IconDownload size={13} /> Excel
          </a>
          <a className="btn btn-outline btn-sm" href={csvExportUrl(report.assessment_id)} target="_blank" rel="noreferrer">
            <IconDownload size={13} /> CSV
          </a>
        </div>
      </div>

      {/* Score Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className={`score-circle ${report.overall_score >= 7 ? 'score-high' : report.overall_score >= 5 ? 'score-medium' : 'score-low'}`}>
            {report.overall_score}
          </div>
          <div className="stat-info">
            <h4>Overall Score</h4>
            <p>Maturity Level {maturityLevel.level}: {maturityLevel.name}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`score-circle ${report.people_score >= 7 ? 'score-high' : report.people_score >= 5 ? 'score-medium' : 'score-low'}`}>
            {report.people_score}
          </div>
          <div className="stat-info">
            <h4>People</h4>
            <p>Skills, Leadership, Culture</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`score-circle ${report.process_score >= 7 ? 'score-high' : report.process_score >= 5 ? 'score-medium' : 'score-low'}`}>
            {report.process_score}
          </div>
          <div className="stat-info">
            <h4>Process</h4>
            <p>ITSM, Security, DevOps</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`score-circle ${report.technology_score >= 7 ? 'score-high' : report.technology_score >= 5 ? 'score-medium' : 'score-low'}`}>
            {report.technology_score}
          </div>
          <div className="stat-info">
            <h4>Technology</h4>
            <p>Infrastructure, Cloud, Security</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</div>
        <div className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Detailed Analysis</div>
        <div className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>Recommendations</div>
        <div className={`tab ${activeTab === 'actionplan' ? 'active' : ''}`} onClick={() => setActiveTab('actionplan')}>30-60-90 Day Plan</div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Category Scores (Radar)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={categoryData}>
                  <defs>
                    <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                  <PolarRadiusAxis domain={[0, 10]} stroke="#cbd5e1" />
                  <Radar name="Score" dataKey="score" stroke="#6366f1" strokeWidth={2}
                    fill="url(#radarFill)" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Recommendation Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={priorityDistribution} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={3} dataKey="value"
                    label={({name, value}) => `${name}: ${value}`}>
                    {priorityDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="card">
            <h3 style={{ marginBottom: '14px', color: 'var(--text-primary)' }}>Executive Summary</h3>
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
              {report.executive_summary}
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className="charts-grid">
            <div className="card">
              <h3 style={{ marginBottom: '14px', color: 'var(--success-700)' }}>Key Strengths</h3>
              {strengths.length > 0 ? strengths.map((s, i) => (
                <div key={i} style={{
                  padding: '12px 14px', border: '1px solid var(--success-100)',
                  borderRadius: 'var(--r-md)', marginBottom: '8px',
                  background: 'var(--success-50)'
                }}>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {s.area} <span className="badge badge-success">{s.score}/10</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{s.description}</div>
                </div>
              )) : <p style={{ color: 'var(--text-tertiary)' }}>No areas scored above 7/10</p>}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '14px', color: 'var(--danger-700)' }}>Critical Gaps</h3>
              {gaps.length > 0 ? gaps.slice(0, 5).map((g, i) => (
                <div key={i} style={{
                  padding: '12px 14px', border: '1px solid var(--danger-100)',
                  borderRadius: 'var(--r-md)', marginBottom: '8px',
                  background: 'var(--danger-50)'
                }}>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {g.area} <span className={`badge ${g.severity === 'critical' ? 'badge-danger' : 'badge-warning'}`}>{g.score}/10</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{g.description}</div>
                </div>
              )) : <p style={{ color: 'var(--text-tertiary)' }}>No critical gaps identified</p>}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analysis Tab */}
      {activeTab === 'details' && (
        <div>
          <div className="chart-card" style={{ marginBottom: '20px' }}>
            <h3>Subcategory Scores</h3>
            <ResponsiveContainer width="100%" height={Math.max(400, subcategoryData.length * 35)}>
              <BarChart data={subcategoryData} layout="vertical" margin={{ left: 150 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 10]} tick={{ fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {subcategoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.score >= 7 ? '#10b981' : entry.score >= 5 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Areas */}
          {risks.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '14px', color: 'var(--danger-700)' }}>Risk Areas</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Risk</th>
                      <th>Impact</th>
                      <th>Likelihood</th>
                      <th>Category</th>
                      <th>Mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.map((risk, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{risk.risk}</td>
                        <td><span className={`badge ${risk.impact === 'High' ? 'badge-danger' : 'badge-warning'}`}>{risk.impact}</span></td>
                        <td><span className={`badge ${risk.likelihood === 'High' ? 'badge-danger' : 'badge-warning'}`}>{risk.likelihood}</span></td>
                        <td>{risk.category}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{risk.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Maturity Assessment */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Maturity Level Assessment</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div className={`score-circle ${maturityLevel.level >= 4 ? 'score-high' : maturityLevel.level >= 3 ? 'score-medium' : 'score-low'}`}>
                {maturityLevel.level}
              </div>
              <div>
                <h4 style={{ fontSize: '20px', marginBottom: '4px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{maturityLevel.name}</h4>
                <p style={{ color: 'var(--text-tertiary)' }}>{maturityLevel.description}</p>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map(level => (
                  <div key={level} style={{
                    flex: 1, height: '8px', borderRadius: 'var(--r-full)',
                    background: level <= maturityLevel.level
                      ? 'linear-gradient(90deg, var(--brand-600), var(--brand-400))'
                      : 'var(--gray-100)',
                    transition: 'all 600ms cubic-bezier(0.22, 1, 0.36, 1)'
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                <span>Initial</span><span>Repeatable</span><span>Defined</span><span>Managed</span><span>Optimizing</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div>
          {recommendations.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><IconFileText size={28} /></div>
              <p>No specific recommendations generated</p>
            </div>
          ) : (
            recommendations.map((rec, i) => (
              <div key={i} className="card" style={{
                borderLeft: `4px solid ${rec.priority === 'critical' ? 'var(--danger-500)' : rec.priority === 'high' ? 'var(--warning-500)' : 'var(--info-500)'}`,
                paddingLeft: 24
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: 12, flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{rec.title}</h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className={`badge ${rec.priority === 'critical' ? 'badge-danger' : rec.priority === 'high' ? 'badge-warning' : 'badge-info'}`}>
                      {rec.priority}
                    </span>
                    <span className="badge badge-purple">{rec.category}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: 14 }}>{rec.description}</p>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                  <span><strong style={{ color: 'var(--text-secondary)' }}>Effort:</strong> {rec.effort}</span>
                  <span><strong style={{ color: 'var(--text-secondary)' }}>Impact:</strong> {rec.impact}</span>
                  <span><strong style={{ color: 'var(--text-secondary)' }}>Timeline:</strong> {rec.timeline}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Action Plan Tab */}
      {activeTab === 'actionplan' && (
        <div>
          {/* 30 Days */}
          <div className="card" style={{ borderLeft: '4px solid var(--danger-500)', paddingLeft: 24 }}>
            <h3 style={{ color: 'var(--danger-700)', marginBottom: '8px', fontSize: 16, fontWeight: 650 }}>
              {actionPlan.thirtyDays?.title || 'First 30 Days'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Objectives</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                {(actionPlan.thirtyDays?.objectives || []).map((obj, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{obj}</li>
                ))}
              </ul>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Actions</h4>
              {(actionPlan.thirtyDays?.actions || []).map((action, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{action.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{action.description}</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-info">{action.category}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>Effort: <strong style={{ color: 'var(--text-secondary)' }}>{action.effort}</strong></span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Expected Outcomes</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                {(actionPlan.thirtyDays?.expectedOutcomes || []).map((outcome, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{outcome}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 60 Days */}
          <div className="card" style={{ borderLeft: '4px solid var(--warning-500)', paddingLeft: 24 }}>
            <h3 style={{ color: 'var(--warning-700)', marginBottom: '8px', fontSize: 16, fontWeight: 650 }}>
              {actionPlan.sixtyDays?.title || '30-60 Days'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Objectives</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                {(actionPlan.sixtyDays?.objectives || []).map((obj, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{obj}</li>
                ))}
              </ul>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Actions</h4>
              {(actionPlan.sixtyDays?.actions || []).map((action, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{action.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{action.description}</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-info">{action.category}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>Effort: <strong style={{ color: 'var(--text-secondary)' }}>{action.effort}</strong></span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Expected Outcomes</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                {(actionPlan.sixtyDays?.expectedOutcomes || []).map((outcome, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{outcome}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 90 Days */}
          <div className="card" style={{ borderLeft: '4px solid var(--success-500)', paddingLeft: 24 }}>
            <h3 style={{ color: 'var(--success-700)', marginBottom: '8px', fontSize: 16, fontWeight: 650 }}>
              {actionPlan.ninetyDays?.title || '60-90 Days'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Objectives</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                {(actionPlan.ninetyDays?.objectives || []).map((obj, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{obj}</li>
                ))}
              </ul>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Actions</h4>
              {(actionPlan.ninetyDays?.actions || []).map((action, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{action.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{action.description}</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-info">{action.category}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>Effort: <strong style={{ color: 'var(--text-secondary)' }}>{action.effort}</strong></span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Expected Outcomes</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                {(actionPlan.ninetyDays?.expectedOutcomes || []).map((outcome, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{outcome}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportDetail;
