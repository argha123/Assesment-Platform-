import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getReport, getBenchmarkComparison, pdfExportUrl, excelExportUrl, csvExportUrl } from '../services/api';
import { IconFileText, IconDownload } from '../components/Icons';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

// Health score color helper
function getHealthColor(score, max = 10) {
  const pct = (score / max) * 100;
  if (pct >= 90) return { bg: '#059669', text: '#ffffff', label: 'Green' };
  if (pct >= 70) return { bg: '#d97706', text: '#ffffff', label: 'Amber' };
  return { bg: '#dc2626', text: '#ffffff', label: 'Red' };
}

function getHealthBadge(score, max = 10) {
  const pct = (score / max) * 100;
  if (pct >= 90) return 'badge-success';
  if (pct >= 70) return 'badge-warning';
  return 'badge-danger';
}

// Donut score component
function ScoreDonut({ score, max = 10, size = 120, label, sublabel }) {
  const pct = (score / max) * 100;
  const color = getHealthColor(score, max);
  const strokeW = size > 100 ? 12 : 8;
  const radius = (size - strokeW * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke="#e2e8f0" strokeWidth={strokeW} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color.bg} strokeWidth={strokeW} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontWeight: 700, fontSize: size > 100 ? 24 : 15, color: color.bg
        }}>
          {typeof score === 'number' ? score.toFixed(1) : score}
        </div>
      </div>
      {label && <div style={{ fontWeight: 600, fontSize: 11, marginTop: 6, lineHeight: 1.3,
        maxWidth: size + 20, overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word' }}>{label}</div>}
      {sublabel && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{sublabel}</div>}
    </div>
  );
}

function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('executive');

  useEffect(() => { loadReport(); }, [id]);

  const loadReport = async () => {
    try {
      const res = await getReport(id);
      setReport(res.data);
      // Also fetch benchmark comparison
      if (res.data && res.data.assessment_id) {
        try {
          const bRes = await getBenchmarkComparison(res.data.assessment_id);
          setBenchmark(bRes.data);
        } catch (e) { /* benchmarks optional */ }
      }
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
  const maturityLevel = reportData.maturityLevel || { level: 0, name: 'Unknown' };
  const gaps = reportData.gaps || [];
  const strengths = reportData.strengths || [];
  const risks = reportData.riskAreas || [];

  // Prepare track-level data from subcategories
  const trackData = Object.entries(subcategoryBreakdown).map(([key, data]) => ({
    name: data.subcategory,
    category: data.category,
    score: data.avgScore,
    pct: (data.avgScore / 10) * 100
  })).sort((a, b) => a.score - b.score);

  // Category chart data
  const categoryData = Object.entries(categoryBreakdown).map(([cat, data]) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    score: data.avgScore,
    fullMark: 10
  }));

  // Findings categorized by priority
  const highFindings = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high');
  const mediumFindings = recommendations.filter(r => r.priority === 'medium');
  const lowFindings = recommendations.filter(r => r.priority === 'low');

  const overallPct = report.overall_score ? (report.overall_score / 10) * 100 : 0;
  const overallHealth = getHealthColor(report.overall_score || 0);

  return (
    <div className="report-detail-enterprise">
      {/* Report Header */}
      <div className="report-header-banner">
        <div className="report-header-content">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              IT Infrastructure Assessment Report
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>
              {report.account_name} — {report.assessment_title}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Generated: {new Date(report.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
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
      </div>

      {/* Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <div className={`tab ${activeTab === 'executive' ? 'active' : ''}`} onClick={() => setActiveTab('executive')}>Executive Summary</div>
        <div className={`tab ${activeTab === 'heatmap' ? 'active' : ''}`} onClick={() => setActiveTab('heatmap')}>Heatmap & Mitigation</div>
        <div className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Detailed Analysis</div>
        <div className={`tab ${activeTab === 'benchmarks' ? 'active' : ''}`} onClick={() => setActiveTab('benchmarks')}>Benchmarks</div>
        <div className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>Recommendations</div>
        <div className={`tab ${activeTab === 'actionplan' ? 'active' : ''}`} onClick={() => setActiveTab('actionplan')}>30-60-90 Day Plan</div>
      </div>

      {/* ===== EXECUTIVE SUMMARY TAB ===== */}
      {activeTab === 'executive' && (
        <div>
          {/* Health Score Legend */}
          <div className="card" style={{ marginBottom: 20, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>Health Score Legend:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#dc2626' }}></span>
              <span style={{ fontSize: 12 }}>Red: &lt;70%</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#d97706' }}></span>
              <span style={{ fontSize: 12 }}>Amber: 70% – 90%</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#059669' }}></span>
              <span style={{ fontSize: 12 }}>Green: &gt;90%</span>
            </span>
          </div>

          {/* Overall Score + Category Scores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
            {/* Account Level Score */}
            <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Level</h3>
              <ScoreDonut score={report.overall_score || 0} size={160} />
              <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, color: overallHealth.bg }}>
                {overallPct.toFixed(2)}%
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Overall Score</div>
              <div style={{ marginTop: 12 }}>
                <span className={`badge ${getHealthBadge(report.overall_score || 0)}`} style={{ fontSize: 12, padding: '4px 12px' }}>
                  {overallHealth.label} State
                </span>
              </div>
            </div>

            {/* Track Level Scores */}
            <div className="card" style={{ padding: '24px', overflow: 'auto' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Track Level Scores</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 20, justifyItems: 'center' }}>
                {trackData.map((track, i) => (
                  <ScoreDonut key={i} score={track.score} size={70}
                    label={track.name} sublabel={`${track.pct.toFixed(0)}%`} />
                ))}
              </div>
            </div>
          </div>

          {/* Assessment Methodology */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 650, marginBottom: 14, color: 'var(--text-primary)' }}>Assessment Methodology & Process</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--brand-50)', borderRadius: 'var(--r-md)', border: '1px solid var(--brand-100)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand-700)', marginBottom: 6 }}>Assessment Inputs</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Workshop with operations team, review of current runbooks by respective technical SMEs
                </div>
              </div>
              <div style={{ padding: 16, background: 'var(--purple-50)', borderRadius: 'var(--r-md)', border: '1px solid var(--purple-100)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--purple-600)', marginBottom: 6 }}>Assessment Process</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Recorded & reviewed in the assessment tool against industry best practices across Technology, Process, and People dimensions
                </div>
              </div>
              <div style={{ padding: 16, background: 'var(--success-50)', borderRadius: 'var(--r-md)', border: '1px solid var(--success-100)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--success-700)', marginBottom: 6 }}>Scoring</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Maturity Level {maturityLevel.level}/5 ({maturityLevel.name}). Assessment evaluated across {Object.keys(subcategoryBreakdown).length} subcategories.
                </div>
              </div>
            </div>
          </div>

          {/* Gaps Findings Summary Table */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 650, marginBottom: 14, color: 'var(--text-primary)' }}>Gap Findings Summary</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }}></span>
                        High (30 days)
                      </span>
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }}></span>
                        Medium (60 days)
                      </span>
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }}></span>
                        Low (90 days)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ fontWeight: 600, background: 'var(--gray-50)' }}>
                    <td>Total</td>
                    <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{highFindings.length}</td>
                    <td style={{ textAlign: 'center', color: '#d97706', fontWeight: 700 }}>{mediumFindings.length}</td>
                    <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{lowFindings.length}</td>
                  </tr>
                  {['technology', 'process', 'people'].map(cat => {
                    const catHigh = highFindings.filter(r => r.category === cat).length;
                    const catMed = mediumFindings.filter(r => r.category === cat).length;
                    const catLow = lowFindings.filter(r => r.category === cat).length;
                    if (catHigh + catMed + catLow === 0) return null;
                    return (
                      <tr key={cat}>
                        <td style={{ textTransform: 'capitalize' }}>{cat}</td>
                        <td style={{ textAlign: 'center' }}>{catHigh || '-'}</td>
                        <td style={{ textAlign: 'center' }}>{catMed || '-'}</td>
                        <td style={{ textAlign: 'center' }}>{catLow || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Findings */}
          <div className="charts-grid">
            <div className="card">
              <h3 style={{ marginBottom: 14, color: 'var(--success-700)', fontSize: 14, fontWeight: 650 }}>Key Strengths</h3>
              {strengths.length > 0 ? strengths.slice(0, 5).map((s, i) => (
                <div key={i} style={{ padding: '10px 14px', border: '1px solid var(--success-100)', borderRadius: 'var(--r-md)', marginBottom: 8, background: 'var(--success-50)' }}>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                    {s.area} <span className="badge badge-success">{s.score}/10</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{s.description}</div>
                </div>
              )) : <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No areas scored above 7/10</p>}
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 14, color: 'var(--danger-700)', fontSize: 14, fontWeight: 650 }}>Critical Gaps</h3>
              {gaps.length > 0 ? gaps.slice(0, 5).map((g, i) => (
                <div key={i} style={{ padding: '10px 14px', border: '1px solid var(--danger-100)', borderRadius: 'var(--r-md)', marginBottom: 8, background: 'var(--danger-50)' }}>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                    {g.area} <span className={`badge ${g.severity === 'critical' ? 'badge-danger' : 'badge-warning'}`}>{g.score}/10</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{g.description}</div>
                </div>
              )) : <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No critical gaps identified</p>}
            </div>
          </div>

          {/* Executive Summary Text */}
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ marginBottom: 14, color: 'var(--text-primary)', fontSize: 15, fontWeight: 650 }}>Executive Summary</h3>
            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: 14 }}>
              {report.executive_summary}
            </div>
          </div>
        </div>
      )}

      {/* ===== HEATMAP & MITIGATION TAB ===== */}
      {activeTab === 'heatmap' && (
        <div>
          {/* Overall Status Banner */}
          <div className="card" style={{ marginBottom: 20, padding: '16px 24px', background: `linear-gradient(135deg, ${overallHealth.bg}11, ${overallHealth.bg}05)`, border: `1px solid ${overallHealth.bg}33` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Project Score: </span>
                <span style={{ fontWeight: 800, fontSize: 18, color: overallHealth.bg }}>{overallPct.toFixed(2)}%</span>
                <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Overall, the account is in <strong style={{ color: overallHealth.bg }}>{overallHealth.label}</strong> state.
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 24, height: 8, borderRadius: 2, background: '#dc2626' }}></span> 0% to 70%
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 24, height: 8, borderRadius: 2, background: '#d97706' }}></span> 71% to 89%
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 24, height: 8, borderRadius: 2, background: '#059669' }}></span> 90% to 100%
                </span>
              </div>
            </div>
          </div>

          {/* ZDO Plan Legend */}
          <div className="card" style={{ marginBottom: 20, padding: '12px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>ZDO Plan (Zero Defective Operations):</span>
              <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#dc2626' }}></span> 30 days — High
              </span>
              <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#d97706' }}></span> 60 days — Medium
              </span>
              <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669' }}></span> 90 days — Low
              </span>
            </div>
          </div>

          {/* Heatmap Table */}
          <div className="card">
            <div className="table-container">
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th style={{ width: 160 }}>Tower</th>
                    <th style={{ width: 100, textAlign: 'center' }}>Heatmap</th>
                    <th>Summary & Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  {trackData.map((track, i) => {
                    const trackColor = getHealthColor(track.score);
                    const trackFindings = recommendations.filter(r =>
                      r.title.toLowerCase().includes(track.name.toLowerCase()) ||
                      r.category === track.category
                    );
                    const trackHigh = trackFindings.filter(r => r.priority === 'critical' || r.priority === 'high');
                    const trackMed = trackFindings.filter(r => r.priority === 'medium');
                    const trackLow = trackFindings.filter(r => r.priority === 'low');

                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{track.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-block', padding: '6px 14px', borderRadius: 'var(--r-sm)',
                            background: trackColor.bg, color: trackColor.text, fontWeight: 700, fontSize: 14,
                            minWidth: 70
                          }}>
                            {track.pct.toFixed(1)}%
                          </div>
                        </td>
                        <td style={{ fontSize: 13, lineHeight: 1.7 }}>
                          <div style={{ marginBottom: 6 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Areas of opportunity: <strong>{trackFindings.length}</strong>
                              {trackHigh.length > 0 && <span style={{ color: '#dc2626' }}> (30 Days: {trackHigh.length})</span>}
                              {trackMed.length > 0 && <span style={{ color: '#d97706' }}> (60 Days: {trackMed.length})</span>}
                              {trackLow.length > 0 && <span style={{ color: '#059669' }}> (90 Days: {trackLow.length})</span>}
                            </span>
                          </div>
                          {trackFindings.slice(0, 3).map((f, fi) => (
                            <div key={fi} style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 3, paddingLeft: 8, borderLeft: '2px solid var(--border)' }}>
                              • {f.description}
                            </div>
                          ))}
                          {trackFindings.length > 3 && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 8, fontStyle: 'italic' }}>
                              +{trackFindings.length - 3} more findings...
                            </div>
                          )}
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

      {/* ===== DETAILED ANALYSIS TAB ===== */}
      {activeTab === 'details' && (
        <div>
          {/* Category Radar + Maturity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
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
                  <Radar name="Score" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#radarFill)" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Maturity Level */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 32 }}>
              <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 650 }}>Maturity Level Assessment</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                <div className={`score-circle ${maturityLevel.level >= 4 ? 'score-high' : maturityLevel.level >= 3 ? 'score-medium' : 'score-low'}`}>
                  {maturityLevel.level}
                </div>
                <div>
                  <h4 style={{ fontSize: 20, marginBottom: 4, letterSpacing: '-0.01em' }}>{maturityLevel.name}</h4>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{maturityLevel.description}</p>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map(level => (
                    <div key={level} style={{
                      flex: 1, height: 10, borderRadius: 'var(--r-full)',
                      background: level <= maturityLevel.level
                        ? 'linear-gradient(90deg, var(--brand-600), var(--brand-400))'
                        : 'var(--gray-100)'
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  <span>Initial</span><span>Repeatable</span><span>Defined</span><span>Managed</span><span>Optimizing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subcategory Bar Chart */}
          <div className="chart-card" style={{ marginBottom: 20 }}>
            <h3>Subcategory Scores</h3>
            <ResponsiveContainer width="100%" height={Math.max(400, trackData.length * 38)}>
              <BarChart data={trackData} layout="vertical" margin={{ left: 160 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 10]} tick={{ fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {trackData.map((entry, index) => (
                    <Cell key={index} fill={entry.score >= 7 ? '#10b981' : entry.score >= 5 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Areas */}
          {risks.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 14, color: 'var(--danger-700)', fontSize: 15, fontWeight: 650 }}>Risk Register</h3>
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
                        <td style={{ fontWeight: 500, fontSize: 13 }}>{risk.risk}</td>
                        <td><span className={`badge ${risk.impact === 'High' ? 'badge-danger' : 'badge-warning'}`}>{risk.impact}</span></td>
                        <td><span className={`badge ${risk.likelihood === 'High' ? 'badge-danger' : 'badge-warning'}`}>{risk.likelihood}</span></td>
                        <td style={{ textTransform: 'capitalize', fontSize: 13 }}>{risk.category}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 300 }}>{risk.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== BENCHMARKS TAB ===== */}
      {activeTab === 'benchmarks' && (
        <div>
          {!benchmark ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><IconFileText size={28} /></div>
              <h3>No Benchmark Data Available</h3>
              <p>Benchmark comparison data is not available for this assessment's industry.</p>
            </div>
          ) : (
            <>
              {/* Benchmark Position Cards */}
              <div className="stats-grid" style={{ marginBottom: 20 }}>
                {['people', 'process', 'technology'].map(cat => {
                  const pos = benchmark.position?.[cat];
                  const score = benchmark.assessment_scores?.[cat] || 0;
                  const b = benchmark.benchmarks?.[`${cat}_overall`] || benchmark.benchmarks?.[`${cat}_null`] || {};
                  const vsAvg = pos ? pos.vs_avg : (score - (b.avg || 5.5));
                  return (
                    <div key={cat} className="stat-card">
                      <div className={`stat-icon ${cat === 'people' ? 'blue' : cat === 'process' ? 'green' : 'orange'}`}>
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{score.toFixed(1)}</span>
                      </div>
                      <div className="stat-info">
                        <h4 style={{ textTransform: 'capitalize', fontSize: 14 }}>{cat}</h4>
                        <p style={{ fontSize: 12, marginTop: 2 }}>
                          vs Industry Avg: <strong style={{ color: vsAvg >= 0 ? 'var(--success-600)' : 'var(--danger-600)' }}>
                            {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(1)}
                          </strong>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Benchmark Comparison Chart */}
              <div className="chart-card" style={{ marginBottom: 20 }}>
                <h3>Your Score vs Industry — {benchmark.industry || 'All Industries'}</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={['people', 'process', 'technology'].map(cat => {
                    const b = benchmark.benchmarks?.[`${cat}_overall`] || benchmark.benchmarks?.[`${cat}_null`] || {};
                    return {
                      name: cat.charAt(0).toUpperCase() + cat.slice(1),
                      'Your Score': benchmark.assessment_scores?.[cat] || 0,
                      'Industry Avg': b.avg || 0,
                      'Top Quartile': b.top_quartile || 0
                    };
                  })} barGap={6} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tickLine={false} />
                    <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                    <Legend />
                    <Bar dataKey="Your Score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Industry Avg" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Top Quartile" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Benchmark Table */}
              <div className="card">
                <div className="card-header">
                  <h3>Quartile Scoring & Industry Position</h3>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Your Score</th>
                        <th>Industry Average</th>
                        <th>Median</th>
                        <th>Top Quartile</th>
                        <th>Bottom Quartile</th>
                        <th>Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['people', 'process', 'technology'].map(cat => {
                        const b = benchmark.benchmarks?.[`${cat}_overall`] || benchmark.benchmarks?.[`${cat}_null`] || {};
                        const score = benchmark.assessment_scores?.[cat] || 0;
                        const pos = benchmark.position?.[cat];
                        const percentile = pos?.percentile || (score >= (b.top_quartile || 7.5) ? 'top_25' : score >= (b.median || 5.2) ? 'above_median' : 'below_median');
                        const labels = { top_25: 'Top 25%', above_median: 'Above Median', below_median: 'Below Median', bottom_25: 'Bottom 25%' };
                        const badgeCls = { top_25: 'badge-success', above_median: 'badge-info', below_median: 'badge-warning', bottom_25: 'badge-danger' };
                        return (
                          <tr key={cat}>
                            <td style={{ fontWeight: 500, textTransform: 'capitalize' }}>{cat}</td>
                            <td style={{ fontWeight: 700, color: 'var(--brand-700)' }}>{score}/10</td>
                            <td>{b.avg ?? '-'}</td>
                            <td>{b.median ?? '-'}</td>
                            <td style={{ color: 'var(--success-700)' }}>{b.top_quartile ?? '-'}</td>
                            <td style={{ color: 'var(--text-tertiary)' }}>{b.bottom_quartile ?? '-'}</td>
                            <td><span className={`badge ${badgeCls[percentile] || 'badge-warning'}`}>{labels[percentile] || percentile}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== RECOMMENDATIONS TAB ===== */}
      {activeTab === 'recommendations' && (
        <div>
          {/* Priority Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
            <div className="chart-card">
              <h3>Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Critical/High', value: highFindings.length, color: '#ef4444' },
                      { name: 'Medium', value: mediumFindings.length, color: '#f59e0b' },
                      { name: 'Low', value: lowFindings.length, color: '#10b981' }
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    paddingAngle={3} dataKey="value"
                    label={({name, value}) => `${name}: ${value}`}>
                    {[
                      { name: 'Critical/High', value: highFindings.length, color: '#ef4444' },
                      { name: 'Medium', value: mediumFindings.length, color: '#f59e0b' },
                      { name: 'Low', value: lowFindings.length, color: '#10b981' }
                    ].filter(d => d.value > 0).map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 650 }}>Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 16, background: 'var(--danger-50)', borderRadius: 'var(--r-md)', textAlign: 'center', border: '1px solid var(--danger-100)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>{highFindings.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>High Priority</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Action within 30 days</div>
                </div>
                <div style={{ padding: 16, background: 'var(--warning-50)', borderRadius: 'var(--r-md)', textAlign: 'center', border: '1px solid var(--warning-100)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>{mediumFindings.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Medium Priority</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Action within 60 days</div>
                </div>
                <div style={{ padding: 16, background: 'var(--success-50)', borderRadius: 'var(--r-md)', textAlign: 'center', border: '1px solid var(--success-100)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{lowFindings.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Low Priority</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Action within 90 days</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Total of <strong>{recommendations.length}</strong> recommendations identified across Technology, Process, and People dimensions.
                Findings are categorized based on their impact and mitigation timelines follow the ZDO (Zero Defective Operations) framework.
              </p>
            </div>
          </div>

          {/* Recommendations List */}
          {recommendations.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><IconFileText size={28} /></div>
              <p>No specific recommendations generated</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>#</th>
                      <th>Recommendation</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Effort</th>
                      <th>Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((rec, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-tertiary)' }}>{i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{rec.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{rec.description}</div>
                        </td>
                        <td><span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>{rec.category}</span></td>
                        <td>
                          <span className={`badge ${rec.priority === 'critical' ? 'badge-danger' : rec.priority === 'high' ? 'badge-warning' : rec.priority === 'medium' ? 'badge-info' : 'badge-success'}`}>
                            {rec.priority}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>{rec.effort}</td>
                        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{rec.timeline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 30-60-90 DAY PLAN TAB ===== */}
      {activeTab === 'actionplan' && (
        <div>
          {/* Timeline Visual */}
          <div className="card" style={{ marginBottom: 20, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderRadius: 'var(--r-md) 0 0 var(--r-md)', border: '1px solid #fecaca' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#dc2626' }}>30 Days</div>
                <div style={{ fontSize: 11, color: '#991b1b' }}>Critical & High Priority</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{actionPlan.thirtyDays?.actions?.length || 0} Actions</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#d97706' }}>60 Days</div>
                <div style={{ fontSize: 11, color: '#92400e' }}>Medium Priority</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706', marginTop: 4 }}>{actionPlan.sixtyDays?.actions?.length || 0} Actions</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: '0 var(--r-md) var(--r-md) 0', border: '1px solid #a7f3d0' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#059669' }}>90 Days</div>
                <div style={{ fontSize: 11, color: '#065f46' }}>Low Priority & Optimization</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', marginTop: 4 }}>{actionPlan.ninetyDays?.actions?.length || 0} Actions</div>
              </div>
            </div>
          </div>

          {/* 30 Days */}
          <div className="card" style={{ borderLeft: '5px solid #dc2626', paddingLeft: 24, marginBottom: 16 }}>
            <h3 style={{ color: '#dc2626', marginBottom: 12, fontSize: 16, fontWeight: 700 }}>
              {actionPlan.thirtyDays?.title || 'First 30 Days - Quick Wins & Critical Fixes'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Objectives</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8 }}>
                {(actionPlan.thirtyDays?.objectives || []).map((obj, i) => <li key={i}>{obj}</li>)}
              </ul>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Actions</h4>
              {(actionPlan.thirtyDays?.actions || []).map((action, i) => (
                <div key={i} style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r-md)', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{action.description}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11 }}>
                    <span className="badge badge-purple">{action.category}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Effort: {action.effort}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Expected Outcomes</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8 }}>
                {(actionPlan.thirtyDays?.expectedOutcomes || []).map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          </div>

          {/* 60 Days */}
          <div className="card" style={{ borderLeft: '5px solid #d97706', paddingLeft: 24, marginBottom: 16 }}>
            <h3 style={{ color: '#d97706', marginBottom: 12, fontSize: 16, fontWeight: 700 }}>
              {actionPlan.sixtyDays?.title || '30-60 Days - Foundation Building'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Objectives</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8 }}>
                {(actionPlan.sixtyDays?.objectives || []).map((obj, i) => <li key={i}>{obj}</li>)}
              </ul>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Actions</h4>
              {(actionPlan.sixtyDays?.actions || []).map((action, i) => (
                <div key={i} style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--r-md)', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{action.description}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11 }}>
                    <span className="badge badge-purple">{action.category}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Effort: {action.effort}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Expected Outcomes</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8 }}>
                {(actionPlan.sixtyDays?.expectedOutcomes || []).map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          </div>

          {/* 90 Days */}
          <div className="card" style={{ borderLeft: '5px solid #059669', paddingLeft: 24 }}>
            <h3 style={{ color: '#059669', marginBottom: 12, fontSize: 16, fontWeight: 700 }}>
              {actionPlan.ninetyDays?.title || '60-90 Days - Optimization & Scale'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Objectives</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8 }}>
                {(actionPlan.ninetyDays?.objectives || []).map((obj, i) => <li key={i}>{obj}</li>)}
              </ul>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Actions</h4>
              {(actionPlan.ninetyDays?.actions || []).map((action, i) => (
                <div key={i} style={{ padding: '12px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--r-md)', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{action.description}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11 }}>
                    <span className="badge badge-purple">{action.category}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Effort: {action.effort}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Expected Outcomes</h4>
              <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8 }}>
                {(actionPlan.ninetyDays?.expectedOutcomes || []).map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportDetail;
