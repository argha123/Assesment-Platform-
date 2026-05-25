import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine
} from 'recharts';
import { getBenchmarkComparison, getAssessments } from '../services/api';
import { IconTrendingUp, IconTarget } from '../components/Icons';

const PERCENTILE_LABEL = {
  top_25:        { label: 'Top 25%',       cls: 'badge-success' },
  above_median:  { label: 'Above Median',  cls: 'badge-info' },
  below_median:  { label: 'Below Median',  cls: 'badge-warning' },
  bottom_25:     { label: 'Bottom 25%',    cls: 'badge-danger' }
};

function Benchmarks() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    getAssessments()
      .then(res => {
        const completed = (res.data || []).filter(a => a.status === 'completed');
        setAssessments(completed);
        if (completed.length) setSelectedAssessment(completed[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAssessment) { setComparison(null); return; }
    setComparing(true);
    getBenchmarkComparison(selectedAssessment)
      .then(res => setComparison(res.data))
      .catch(() => setComparison(null))
      .finally(() => setComparing(false));
  }, [selectedAssessment]);

  if (loading) return <div className="loading">Loading benchmarks…</div>;

  const buildChart = () => {
    if (!comparison) return [];
    return ['people', 'process', 'technology'].map(cat => {
      const b = comparison.benchmarks?.[`${cat}_overall`] || comparison.benchmarks?.[`${cat}_null`] || {};
      return {
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        Score:        comparison.assessment_scores?.[cat] || 0,
        Average:      b.avg || 0,
        TopQuartile:  b.top_quartile || 0
      };
    });
  };

  const chartData = buildChart();

  if (assessments.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h2>Industry Benchmarks</h2>
            <p>Compare your assessment scores against industry peers</p>
          </div>
        </div>
        <div className="card empty-state">
          <div className="empty-state-icon"><IconTrendingUp size={28} /></div>
          <h3>No completed assessments</h3>
          <p>Complete an assessment to compare scores against industry benchmarks.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Industry Benchmarks</h2>
          <p>Compare your assessment scores against industry peers</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row" style={{ gridTemplateColumns: '1fr', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Completed Assessment</label>
            <select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)}>
              {assessments.map(a => (
                <option key={a.id} value={a.id}>{a.title} — {a.account_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {comparing ? (
        <div className="loading">Comparing against industry benchmarks…</div>
      ) : !comparison ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><IconTrendingUp size={28} /></div>
          <p>No benchmark data available for this assessment's industry.</p>
        </div>
      ) : (() => {
        // Ensure position data always exists for rendering
        const positions = {};
        ['people', 'process', 'technology'].forEach(cat => {
          if (comparison.position?.[cat]) {
            positions[cat] = comparison.position[cat];
          } else {
            const score = comparison.assessment_scores?.[cat] || 0;
            const b = comparison.benchmarks?.[`${cat}_overall`] || comparison.benchmarks?.[`${cat}_null`] || {};
            const avg = b.avg || 5.5;
            const median = b.median || 5.2;
            const top_q = b.top_quartile || 7.5;
            const bottom_q = b.bottom_quartile || 3.5;
            positions[cat] = {
              score,
              vs_avg: score - avg,
              percentile: score >= top_q ? 'top_25' : score >= median ? 'above_median' : score >= bottom_q ? 'below_median' : 'bottom_25'
            };
          }
        });

        return (
        <>
          {/* Position cards */}
          <div className="stats-grid">
            {['people', 'process', 'technology'].map(cat => {
              const pos = positions[cat];
              if (!pos || !pos.score) return null;
              const meta = PERCENTILE_LABEL[pos.percentile] || PERCENTILE_LABEL.below_median;
              return (
                <div key={cat} className="stat-card">
                  <div className={`stat-icon ${cat === 'people' ? 'blue' : cat === 'process' ? 'green' : 'orange'}`}>
                    <IconTarget />
                  </div>
                  <div className="stat-info">
                    <h4 style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      {pos.score}/10
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: pos.vs_avg > 0 ? 'var(--success-600)' : pos.vs_avg < 0 ? 'var(--danger-600)' : 'var(--text-tertiary)'
                      }}>
                        {pos.vs_avg > 0 ? '+' : ''}{pos.vs_avg.toFixed(1)}
                      </span>
                    </h4>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="chart-card">
            <h3>Your Score vs Industry · {comparison.industry || 'All Industries'}</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} barGap={6} barCategoryGap="20%">
                <defs>
                  <linearGradient id="bScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                  <linearGradient id="bAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                  <linearGradient id="bTop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                <Legend />
                <ReferenceLine y={5} stroke="#cbd5e1" strokeDasharray="3 3" />
                <Bar dataKey="Score"        fill="url(#bScore)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Average"      fill="url(#bAvg)"   radius={[6, 6, 0, 0]} />
                <Bar dataKey="TopQuartile"  fill="url(#bTop)"   radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed comparison table */}
          <div className="card">
            <div className="card-header">
              <h3>Quartile Scoring</h3>
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
                    const b = comparison.benchmarks?.[`${cat}_overall`] || comparison.benchmarks?.[`${cat}_null`] || {};
                    const pos = positions[cat];
                    const meta = pos && (PERCENTILE_LABEL[pos.percentile] || PERCENTILE_LABEL.below_median);
                    return (
                      <tr key={cat}>
                        <td style={{ fontWeight: 500, textTransform: 'capitalize' }}>{cat}</td>
                        <td style={{ fontFeatureSettings: '"tnum"', fontWeight: 600, color: 'var(--brand-700)' }}>
                          {comparison.assessment_scores?.[cat] ?? '-'}/10
                        </td>
                        <td style={{ fontFeatureSettings: '"tnum"' }}>{b.avg ?? '-'}</td>
                        <td style={{ fontFeatureSettings: '"tnum"' }}>{b.median ?? '-'}</td>
                        <td style={{ fontFeatureSettings: '"tnum"', color: 'var(--success-700)' }}>{b.top_quartile ?? '-'}</td>
                        <td style={{ fontFeatureSettings: '"tnum"', color: 'var(--text-tertiary)' }}>{b.bottom_quartile ?? '-'}</td>
                        <td>{meta ? <span className={`badge ${meta.cls}`}>{meta.label}</span> : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
        );
      })()}
    </div>
  );
}

export default Benchmarks;
