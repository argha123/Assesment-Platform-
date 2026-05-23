import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAccount } from '../services/api';

function AccountDetail() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccount();
  }, [id]);

  const loadAccount = async () => {
    try {
      const res = await getAccount(id);
      setAccount(res.data);
    } catch (error) {
      console.error('Failed to load account:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading account details...</div>;
  if (!account) return <div className="empty-state"><h3>Account not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <h2>{account.name}</h2>
        <p>Account Details & Assessment History</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">&#9632;</div>
          <div className="stat-info">
            <h4>{account.industry || 'N/A'}</h4>
            <p>Industry</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">&#9632;</div>
          <div className="stat-info">
            <h4>{account.company_size || 'N/A'}</h4>
            <p>Company Size</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">&#9632;</div>
          <div className="stat-info">
            <h4>{account.scopes?.length || 0}</h4>
            <p>Assessment Scopes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">&#9632;</div>
          <div className="stat-info">
            <h4>{account.assessments?.length || 0}</h4>
            <p>Assessments</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Contact Information</h3>
        </div>
        <div className="form-row">
          <div><strong>Name:</strong> {account.contact_name || 'Not provided'}</div>
          <div><strong>Email:</strong> {account.contact_email || 'Not provided'}</div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <strong>Phone:</strong> {account.contact_phone || 'Not provided'}
        </div>
        {account.description && (
          <div style={{ marginTop: '12px' }}>
            <strong>Description:</strong> {account.description}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Assessment History</h3>
          <Link to="/scope" className="btn btn-primary btn-sm">+ New Assessment</Link>
        </div>
        {account.assessments && account.assessments.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Overall Score</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {account.assessments.map(a => (
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td><span className={`badge ${a.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{a.status}</span></td>
                    <td>{a.overall_score ? `${a.overall_score}/10` : '-'}</td>
                    <td>{new Date(a.started_at).toLocaleDateString()}</td>
                    <td><Link to={`/assessments/${a.id}`} className="btn btn-outline btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No assessments yet for this account</p>
            <Link to="/scope" className="btn btn-primary btn-sm">Start Assessment</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountDetail;
