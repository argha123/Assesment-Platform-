import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { getReport } from '../services/api';

const COLORS = ['#1a237e', '#2e7d32', '#ef6c00', '#7b1fa2', '#c62828', '#00838f'];

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
    fullMark: 5
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
    { name: 'Critical', value: recommendations.filter(r => r.priority === 'critical').length, color: '#c62828' },
    { name: 'High', value: recommendations.filter(r => r.priority === 'high').length, color: '#ef6c00' },
    { name: 'Medium', value: recommendations.filter(r => r.priority === 'medium').length, color: '#1565c0' },
    { name: 'Low', value: recommendations.filter(r => r.priority === 'low').length, color: '#2e7d32' }
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="page-header">
        <h2>Assessment Report</h2>
        <p>{report.account_name} - {report.assessment_title}</p>
      </div>

      {/* Score Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className={`score-circle ${report.overall_score >= 3.5 ? 'score-high' : report.overall_score >= 2.5 ? 'score-medium' : 'score-low'}`}>
            {report.overall_score}
          </div>
          <div className="stat-info">
            <h4>Overall Score</h4>
            <p>Maturity Level {maturityLevel.level}: {maturityLevel.name}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`score-circle ${report.people_score >= 3.5 ? 'score-high' : report.people_score >= 2.5 ? 'score-medium' : 'score-low'}`}>
            {report.people_score}
          </div>
          <div className="stat-info">
            <h4>People</h4>
            <p>Skills, Leadership, Culture</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`score-circle ${report.process_score >= 3.5 ? 'score-high' : report.process_score >= 2.5 ? 'score-medium' : 'score-low'}`}>
            {report.process_score}
          </div>
          <div className="stat-info">
            <h4>Process</h4>
            <p>ITSM, Security, DevOps</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`score-circle ${report.technology_score >= 3.5 ? 'score-high' : report.technology_score >= 2.5 ? 'score-medium' : 'score-low'}`}>
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
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis domain={[0, 5]} />
                  <Radar name="Score" dataKey="score" stroke="#1a237e" fill="#1a237e" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Recommendation Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={priorityDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                    {priorityDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
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
            <h3 style={{ marginBottom: '16px', color: '#1a237e' }}>Executive Summary</h3>
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#333' }}>
              {report.executive_summary}
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className="charts-grid">
            <div className="card">
              <h3 style={{ marginBottom: '16px', color: '#2e7d32' }}>Key Strengths</h3>
              {strengths.length > 0 ? strengths.map((s, i) => (
                <div key={i} style={{ padding: '12px', border: '1px solid #e8f5e9', borderRadius: '8px', marginBottom: '8px', background: '#f9fff9' }}>
                  <div style={{ fontWeight: 500 }}>{s.area} <span className="badge badge-success">{s.score}/5</span></div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{s.description}</div>
                </div>
              )) : <p style={{ color: '#666' }}>No areas scored above 3.5/5</p>}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '16px', color: '#c62828' }}>Critical Gaps</h3>
              {gaps.length > 0 ? gaps.slice(0, 5).map((g, i) => (
                <div key={i} style={{ padding: '12px', border: '1px solid #fce4ec', borderRadius: '8px', marginBottom: '8px', background: '#fffafa' }}>
                  <div style={{ fontWeight: 500 }}>{g.area} <span className={`badge ${g.severity === 'critical' ? 'badge-danger' : 'badge-warning'}`}>{g.score}/5</span></div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{g.description}</div>
                </div>
              )) : <p style={{ color: '#666' }}>No critical gaps identified</p>}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analysis Tab */}
      {activeTab === 'details' && (
        <div>
          <div className="chart-card" style={{ marginBottom: '24px' }}>
            <h3>Subcategory Scores</h3>
            <ResponsiveContainer width="100%" height={Math.max(400, subcategoryData.length * 35)}>
              <BarChart data={subcategoryData} layout="vertical" margin={{ left: 150 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#1a237e">
                  {subcategoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.score >= 3.5 ? '#2e7d32' : entry.score >= 2.5 ? '#ef6c00' : '#c62828'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Areas */}
          {risks.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '16px', color: '#c62828' }}>Risk Areas</h3>
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
                        <td style={{ fontSize: '13px' }}>{risk.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Maturity Assessment */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', color: '#1a237e' }}>Maturity Level Assessment</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div className={`score-circle ${maturityLevel.level >= 4 ? 'score-high' : maturityLevel.level >= 3 ? 'score-medium' : 'score-low'}`}>
                {maturityLevel.level}
              </div>
              <div>
                <h4 style={{ fontSize: '20px', marginBottom: '4px' }}>{maturityLevel.name}</h4>
                <p style={{ color: '#666' }}>{maturityLevel.description}</p>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map(level => (
                  <div key={level} style={{
                    flex: 1, height: '8px', borderRadius: '4px',
                    background: level <= maturityLevel.level ? '#1a237e' : '#e0e0e0'
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
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
              <p>No specific recommendations generated</p>
            </div>
          ) : (
            recommendations.map((rec, i) => (
              <div key={i} className="card" style={{ borderLeft: `4px solid ${rec.priority === 'critical' ? '#c62828' : rec.priority === 'high' ? '#ef6c00' : '#1565c0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px' }}>{rec.title}</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className={`badge ${rec.priority === 'critical' ? 'badge-danger' : rec.priority === 'high' ? 'badge-warning' : 'badge-info'}`}>
                      {rec.priority}
                    </span>
                    <span className="badge badge-purple">{rec.category}</span>
                  </div>
                </div>
                <p style={{ color: '#555', marginBottom: '12px' }}>{rec.description}</p>
                <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#666' }}>
                  <span><strong>Effort:</strong> {rec.effort}</span>
                  <span><strong>Impact:</strong> {rec.impact}</span>
                  <span><strong>Timeline:</strong> {rec.timeline}</span>
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
          <div className="card" style={{ borderLeft: '4px solid #c62828' }}>
            <h3 style={{ color: '#c62828', marginBottom: '8px' }}>
              {actionPlan.thirtyDays?.title || 'First 30 Days'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Objectives:</h4>
              <ul style={{ paddingLeft: '20px', color: '#555' }}>
                {(actionPlan.thirtyDays?.objectives || []).map((obj, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{obj}</li>
                ))}
              </ul>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Actions:</h4>
              {(actionPlan.thirtyDays?.actions || []).map((action, i) => (
                <div key={i} style={{ padding: '12px', background: '#fafafa', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{action.title}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{action.description}</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px' }}>
                    <span className="badge badge-info">{action.category}</span>
                    <span>Effort: {action.effort}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Expected Outcomes:</h4>
              <ul style={{ paddingLeft: '20px', color: '#555' }}>
                {(actionPlan.thirtyDays?.expectedOutcomes || []).map((outcome, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{outcome}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 60 Days */}
          <div className="card" style={{ borderLeft: '4px solid #ef6c00' }}>
            <h3 style={{ color: '#ef6c00', marginBottom: '8px' }}>
              {actionPlan.sixtyDays?.title || '30-60 Days'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Objectives:</h4>
              <ul style={{ paddingLeft: '20px', color: '#555' }}>
                {(actionPlan.sixtyDays?.objectives || []).map((obj, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{obj}</li>
                ))}
              </ul>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Actions:</h4>
              {(actionPlan.sixtyDays?.actions || []).map((action, i) => (
                <div key={i} style={{ padding: '12px', background: '#fafafa', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{action.title}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{action.description}</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px' }}>
                    <span className="badge badge-info">{action.category}</span>
                    <span>Effort: {action.effort}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Expected Outcomes:</h4>
              <ul style={{ paddingLeft: '20px', color: '#555' }}>
                {(actionPlan.sixtyDays?.expectedOutcomes || []).map((outcome, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{outcome}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 90 Days */}
          <div className="card" style={{ borderLeft: '4px solid #2e7d32' }}>
            <h3 style={{ color: '#2e7d32', marginBottom: '8px' }}>
              {actionPlan.ninetyDays?.title || '60-90 Days'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Objectives:</h4>
              <ul style={{ paddingLeft: '20px', color: '#555' }}>
                {(actionPlan.ninetyDays?.objectives || []).map((obj, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{obj}</li>
                ))}
              </ul>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Actions:</h4>
              {(actionPlan.ninetyDays?.actions || []).map((action, i) => (
                <div key={i} style={{ padding: '12px', background: '#fafafa', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{action.title}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{action.description}</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px' }}>
                    <span className="badge badge-info">{action.category}</span>
                    <span>Effort: {action.effort}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Expected Outcomes:</h4>
              <ul style={{ paddingLeft: '20px', color: '#555' }}>
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
