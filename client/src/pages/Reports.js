import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReports } from '../services/api';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const res = await getReports();
      setReports(res.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading reports...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Reports</h2>
        <p>Generated assessment reports with recommendations and action plans</p>
      </div>

      {reports.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No Reports Generated</h3>
            <p>Complete an assessment to generate a comprehensive report</p>
            <Link to="/assessments" className="btn btn-primary">Go to Assessments</Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Account</th>
                  <th>Overall Score</th>
                  <th>Generated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id}>
                    <td style={{ fontWeight: 500 }}>{report.assessment_title}</td>
                    <td>{report.account_name}</td>
                    <td>
                      <span className={`badge ${report.overall_score >= 7 ? 'badge-success' : report.overall_score >= 5 ? 'badge-warning' : 'badge-danger'}`}>
                        {report.overall_score}/10
                      </span>
                    </td>
                    <td>{new Date(report.generated_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/reports/${report.id}`} className="btn btn-primary btn-sm">View Full Report</Link>
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

export default Reports;
