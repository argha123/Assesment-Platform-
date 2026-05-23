import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { getAccounts, getAssessments, getReports } from '../services/api';

const COLORS = ['#1a237e', '#2e7d32', '#ef6c00', '#7b1fa2', '#c62828'];

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
    people: a.people_score || 0,
    process: a.process_score || 0,
    technology: a.technology_score || 0,
    overall: a.overall_score || 0
  }));

  const categoryAvg = completedAssessments.length > 0 ? [
    { name: 'People', value: completedAssessments.reduce((s, a) => s + (a.people_score || 0), 0) / completedAssessments.length },
    { name: 'Process', value: completedAssessments.reduce((s, a) => s + (a.process_score || 0), 0) / completedAssessments.length },
    { name: 'Technology', value: completedAssessments.reduce((s, a) => s + (a.technology_score || 0), 0) / completedAssessments.length }
  ] : [];

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Enterprise IT Infrastructure Assessment Overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">&#9632;</div>
          <div className="stat-info">
            <h4>{stats.accounts}</h4>
            <p>Total Accounts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">&#9632;</div>
          <div className="stat-info">
            <h4>{stats.assessments}</h4>
            <p>Total Assessments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">&#9632;</div>
          <div className="stat-info">
            <h4>{stats.completed}</h4>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">&#9632;</div>
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
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="people" fill="#1a237e" name="People" />
                <Bar dataKey="process" fill="#2e7d32" name="Process" />
                <Bar dataKey="technology" fill="#ef6c00" name="Technology" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Average Category Scores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={categoryAvg}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis domain={[0, 5]} />
                <Radar name="Score" dataKey="value" stroke="#1a237e" fill="#1a237e" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <h3>Welcome to IT Assessment Platform</h3>
            <p>Get started by creating an account and running your first assessment</p>
            <Link to="/accounts" className="btn btn-primary">Create Account</Link>
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
                    <td>{a.overall_score ? `${a.overall_score}/5` : '-'}</td>
                    <td>{new Date(a.started_at).toLocaleDateString()}</td>
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
