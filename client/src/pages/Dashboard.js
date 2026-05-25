import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { getAccounts, getAssessments, getReports } from '../services/api';
import {
  IconBuilding, IconClipboard, IconCheckCircle, IconFileText, IconArrowRight, IconInbox
} from '../components/Icons';

function Dashboard() {
  const [stats, setStats] = useState({ accounts: 0, assessments: 0, completed: 0, reports: 0 });
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsRes, assessmentsRes, reportsRes] = await Promise.all([
        getAccounts(),
        getAssessments(),
        getReports()
      ]);

      setStats({
        accounts: accountsRes.data.length,
        assessments: assessmentsRes.data.length,
        completed: assessmentsRes.data.filter(a => a.status === 'completed').length,
        reports: reportsRes.data.length
      });
      setAssessments(assessmentsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedAssessments = assessments.filter(a => a.status === 'completed');

  const scoreData = completedAssessments.slice(0, 5).map(a => ({
    name: a.account_name?.substring(0, 15) || 'N/A',
    People: a.people_score || 0,
    Process: a.process_score || 0,
    Technology: a.technology_score || 0,
  }));

  const categoryAvg = completedAssessments.length > 0 ? [
    { name: 'People',     value: completedAssessments.reduce((s, a) => s + (a.people_score || 0),     0) / completedAssessments.length },
    { name: 'Process',    value: completedAssessments.reduce((s, a) => s + (a.process_score || 0),    0) / completedAssessments.length },
    { name: 'Technology', value: completedAssessments.reduce((s, a) => s + (a.technology_score || 0), 0) / completedAssessments.length }
  ] : [];

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Enterprise IT Infrastructure Assessment Overview</p>
        </div>
        <Link to="/scope" className="btn btn-primary">
          Start Assessment
          <IconArrowRight size={14} />
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><IconBuilding /></div>
          <div className="stat-info">
            <h4>{stats.accounts}</h4>
            <p>Total Accounts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><IconClipboard /></div>
          <div className="stat-info">
            <h4>{stats.assessments}</h4>
            <p>Total Assessments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><IconCheckCircle /></div>
          <div className="stat-info">
            <h4>{stats.completed}</h4>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><IconFileText /></div>
          <div className="stat-info">
            <h4>{stats.reports}</h4>
            <p>Reports Generated</p>
          </div>
        </div>
      </div>

      {completedAssessments.length > 0 ? (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Assessment Scores by Account</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreData} barGap={4} barCategoryGap="20%">
                <defs>
                  <linearGradient id="gPeople" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gProcess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gTech" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <Bar dataKey="People"     fill="url(#gPeople)"  radius={[6, 6, 0, 0]} />
                <Bar dataKey="Process"    fill="url(#gProcess)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Technology" fill="url(#gTech)"    radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Average Category Scores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={categoryAvg}>
                <defs>
                  <linearGradient id="gRadar" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis domain={[0, 10]} stroke="#cbd5e1" />
                <Radar name="Score" dataKey="value" stroke="#6366f1" strokeWidth={2}
                  fill="url(#gRadar)" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><IconInbox size={28} /></div>
            <h3>Welcome to IT Assessment Platform</h3>
            <p>Get started by creating an account and running your first assessment</p>
            <Link to="/accounts" className="btn btn-primary">
              Create Account
              <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {assessments.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Recent Assessments</h3>
            <Link to="/assessments" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {assessments.slice(0, 5).map(a => (
                  <tr key={a.id}>
                    <td><Link to={`/assessments/${a.id}`}>{a.title}</Link></td>
                    <td>{a.account_name}</td>
                    <td>
                      <span className={`badge ${a.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ fontFeatureSettings: '"tnum"', fontWeight: 500 }}>
                      {a.overall_score ? `${a.overall_score}/10` : '-'}
                    </td>
                    <td style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(a.started_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
