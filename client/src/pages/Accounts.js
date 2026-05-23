import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAccounts, createAccount, deleteAccount } from '../services/api';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Financial Services', 'Manufacturing',
  'Retail', 'Education', 'Government', 'Energy', 'Telecommunications',
  'Transportation', 'Media & Entertainment', 'Professional Services', 'Other'
];

const COMPANY_SIZES = [
  '1-50 employees', '51-200 employees', '201-500 employees',
  '501-1000 employees', '1001-5000 employees', '5000+ employees'
];

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', industry: '', company_size: '',
    contact_name: '', contact_email: '', contact_phone: '', description: ''
  });

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    try {
      const res = await getAccounts();
      setAccounts(res.data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAccount(form);
      setForm({ name: '', industry: '', company_size: '', contact_name: '', contact_email: '', contact_phone: '', description: '' });
      setShowForm(false);
      loadAccounts();
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account? All associated data will be removed.')) {
      try {
        await deleteAccount(id);
        loadAccounts();
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  if (loading) return <div className="loading">Loading accounts...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Accounts</h2>
        <p>Manage organizations and their assessment profiles</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: '#1a237e' }}>New Account</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Organization Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Enter organization name" />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <select value={form.industry} onChange={e => setForm({...form, industry: e.target.value})}>
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Company Size</label>
                <select value={form.company_size} onChange={e => setForm({...form, company_size: e.target.value})}>
                  <option value="">Select Size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Contact Name</label>
                <input type="text" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} placeholder="Primary contact" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contact Email</label>
                <input type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} placeholder="email@company.com" />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input type="tel" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description of the organization and IT landscape" />
            </div>
            <button type="submit" className="btn btn-success">Create Account</button>
          </form>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No Accounts Yet</h3>
            <p>Create your first account to start assessments</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Industry</th>
                  <th>Size</th>
                  <th>Contact</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => (
                  <tr key={account.id}>
                    <td><Link to={`/accounts/${account.id}`} style={{ color: '#1a237e', fontWeight: 500 }}>{account.name}</Link></td>
                    <td>{account.industry || '-'}</td>
                    <td>{account.company_size || '-'}</td>
                    <td>{account.contact_name || '-'}</td>
                    <td>{new Date(account.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/accounts/${account.id}`} className="btn btn-outline btn-sm" style={{ marginRight: '8px' }}>View</Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(account.id)}>Delete</button>
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

export default Accounts;
