import React, { useEffect, useState } from 'react';
import {
  getWebhooks, createWebhook, deleteWebhook,
  createJiraIssue, sendSlackNotification, getJsonExportUrl, getAssessments
} from '../services/api';
import {
  IconLink, IconPlus, IconTrash, IconZap, IconShare, IconAlertTriangle, IconCheckCircle, IconDownload
} from '../components/Icons';

const AVAILABLE_EVENTS = [
  'assessment.started',
  'assessment.completed',
  'report.generated',
  'action_item.created',
  'action_item.completed',
  'risk.created'
];

function Integrations() {
  const [tab, setTab] = useState('webhooks');
  const [webhooks, setWebhooks] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [whForm, setWhForm] = useState({ name: '', url: '', events: ['assessment.completed'] });
  const [jiraForm, setJiraForm] = useState({
    title: '', description: '', priority: 'Medium', assignee: '', project_key: 'ASSESS'
  });
  const [slackForm, setSlackForm] = useState({ channel: '#assessments', message: '' });
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [exportAssessment, setExportAssessment] = useState('');

  useEffect(() => {
    Promise.all([getWebhooks(), getAssessments()])
      .then(([w, a]) => {
        setWebhooks(w.data || []);
        setAssessments(a.data || []);
        if (a.data?.length) setExportAssessment(a.data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  // ---- Webhooks ----
  const toggleEvent = (ev) => {
    setWhForm(prev => ({
      ...prev,
      events: prev.events.includes(ev)
        ? prev.events.filter(x => x !== ev)
        : [...prev.events, ev]
    }));
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    try {
      await createWebhook(whForm);
      setWhForm({ name: '', url: '', events: ['assessment.completed'] });
      setShowWebhookForm(false);
      const res = await getWebhooks();
      setWebhooks(res.data || []);
      showFeedback('success', 'Webhook created.');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to create webhook.');
    }
  };

  const handleDeleteWebhook = async (id) => {
    if (!window.confirm('Delete this webhook?')) return;
    await deleteWebhook(id);
    const res = await getWebhooks();
    setWebhooks(res.data || []);
    showFeedback('success', 'Webhook deleted.');
  };

  // ---- Jira ----
  const handleCreateJira = async (e) => {
    e.preventDefault();
    try {
      const res = await createJiraIssue(jiraForm);
      const issue = res.data?.issue;
      showFeedback('success', `Created (mock) Jira issue ${issue?.key} — ${issue?.url}`);
      setJiraForm({ title: '', description: '', priority: 'Medium', assignee: '', project_key: 'ASSESS' });
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to create Jira issue.');
    }
  };

  // ---- Slack ----
  const handleSendSlack = async (e) => {
    e.preventDefault();
    try {
      await sendSlackNotification(slackForm);
      showFeedback('success', `Slack notification sent (mock) to ${slackForm.channel}.`);
      setSlackForm({ ...slackForm, message: '' });
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to send Slack notification.');
    }
  };

  if (loading) return <div className="loading">Loading integrations…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Integration Hub</h2>
          <p>Webhooks, Jira, Slack, and JSON export for downstream systems</p>
        </div>
      </div>

      {feedback.text && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--r-md)', marginBottom: 16,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: feedback.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
          color:      feedback.type === 'success' ? 'var(--success-700)' : 'var(--danger-700)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--success-100)' : 'var(--danger-100)'}`,
          fontSize: 13
        }}>
          {feedback.type === 'success' ? <IconCheckCircle size={14} /> : <IconAlertTriangle size={14} />}
          {feedback.text}
        </div>
      )}

      <div className="tabs">
        <div className={`tab ${tab === 'webhooks'  ? 'active' : ''}`} onClick={() => setTab('webhooks')}>Webhooks</div>
        <div className={`tab ${tab === 'jira'      ? 'active' : ''}`} onClick={() => setTab('jira')}>Jira</div>
        <div className={`tab ${tab === 'slack'     ? 'active' : ''}`} onClick={() => setTab('slack')}>Slack</div>
        <div className={`tab ${tab === 'export'    ? 'active' : ''}`} onClick={() => setTab('export')}>JSON Export</div>
      </div>

      {/* Webhooks tab */}
      {tab === 'webhooks' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowWebhookForm(!showWebhookForm)}>
              <IconPlus size={14} /> {showWebhookForm ? 'Cancel' : 'New Webhook'}
            </button>
          </div>

          {showWebhookForm && (
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Register Webhook</h3>
              <form onSubmit={handleCreateWebhook}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input required value={whForm.name}
                      onChange={e => setWhForm({ ...whForm, name: e.target.value })}
                      placeholder="e.g. Internal Reporting Hook" />
                  </div>
                  <div className="form-group">
                    <label>Endpoint URL *</label>
                    <input required type="url" value={whForm.url}
                      onChange={e => setWhForm({ ...whForm, url: e.target.value })}
                      placeholder="https://..." />
                  </div>
                </div>
                <div className="form-group">
                  <label>Subscribed Events</label>
                  <div className="checkbox-grid">
                    {AVAILABLE_EVENTS.map(ev => (
                      <div key={ev}
                        className={`checkbox-item ${whForm.events.includes(ev) ? 'selected' : ''}`}
                        onClick={() => toggleEvent(ev)}>
                        <input type="checkbox" readOnly checked={whForm.events.includes(ev)} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-success">Create Webhook</button>
              </form>
            </div>
          )}

          {webhooks.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><IconLink size={28} /></div>
              <h3>No webhooks yet</h3>
              <p>Add a webhook to receive event notifications from the platform.</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3>Registered Webhooks ({webhooks.length})</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>URL</th>
                      <th>Events</th>
                      <th>Last Triggered</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map(w => {
                      let events = [];
                      try { events = JSON.parse(w.events || '[]'); } catch {}
                      return (
                        <tr key={w.id}>
                          <td style={{ fontWeight: 500 }}>{w.name}</td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {events.length === 0 ? '-' : events.slice(0, 3).map(e => (
                                <span key={e} className="badge badge-info" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{e}</span>
                              ))}
                              {events.length > 3 && <span className="badge badge-purple">+{events.length - 3}</span>}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-tertiary)' }}>
                            {w.last_triggered ? new Date(w.last_triggered).toLocaleString() : 'Never'}
                          </td>
                          <td>
                            <span className={`badge ${w.is_active ? 'badge-success' : 'badge-warning'}`}>
                              {w.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteWebhook(w.id)}>
                              <IconTrash size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Jira tab */}
      {tab === 'jira' && (
        <div className="card">
          <h3 style={{ marginBottom: 6 }}>Create Jira Issue</h3>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 16, fontSize: 13.5 }}>
            Sends a mock request to the Jira REST API. Connect your real Jira credentials in production.
          </p>
          <form onSubmit={handleCreateJira}>
            <div className="form-row">
              <div className="form-group">
                <label>Project Key</label>
                <input value={jiraForm.project_key}
                  onChange={e => setJiraForm({ ...jiraForm, project_key: e.target.value })}
                  placeholder="ASSESS" />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={jiraForm.priority} onChange={e => setJiraForm({ ...jiraForm, priority: e.target.value })}>
                  <option>Highest</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input required value={jiraForm.title}
                onChange={e => setJiraForm({ ...jiraForm, title: e.target.value })}
                placeholder="Summary of the issue" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={jiraForm.description}
                onChange={e => setJiraForm({ ...jiraForm, description: e.target.value })}
                placeholder="Acceptance criteria, links, evidence" />
            </div>
            <div className="form-group">
              <label>Assignee</label>
              <input value={jiraForm.assignee}
                onChange={e => setJiraForm({ ...jiraForm, assignee: e.target.value })}
                placeholder="Optional Jira user" />
            </div>
            <button type="submit" className="btn btn-primary"><IconShare size={14} /> Create Issue</button>
          </form>
        </div>
      )}

      {/* Slack tab */}
      {tab === 'slack' && (
        <div className="card">
          <h3 style={{ marginBottom: 6 }}>Send Slack Notification</h3>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 16, fontSize: 13.5 }}>
            Sends a mock notification. Add a real incoming webhook in production to deliver to Slack.
          </p>
          <form onSubmit={handleSendSlack}>
            <div className="form-group">
              <label>Channel</label>
              <input value={slackForm.channel}
                onChange={e => setSlackForm({ ...slackForm, channel: e.target.value })}
                placeholder="#assessments" />
            </div>
            <div className="form-group">
              <label>Message *</label>
              <textarea required value={slackForm.message}
                onChange={e => setSlackForm({ ...slackForm, message: e.target.value })}
                placeholder="What do you want to send?" />
            </div>
            <button type="submit" className="btn btn-primary"><IconZap size={14} /> Send Notification</button>
          </form>
        </div>
      )}

      {/* JSON Export tab */}
      {tab === 'export' && (
        <div className="card">
          <h3 style={{ marginBottom: 6 }}>JSON Export</h3>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 16, fontSize: 13.5 }}>
            Export full assessment data as JSON for downstream pipelines, BI tools, or custom integrations.
          </p>
          {assessments.length === 0 ? (
            <div className="empty-state">
              <p>No assessments available yet.</p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Assessment</label>
                <select value={exportAssessment} onChange={e => setExportAssessment(e.target.value)}>
                  {assessments.map(a => (
                    <option key={a.id} value={a.id}>{a.title} — {a.account_name}</option>
                  ))}
                </select>
              </div>
              <a className="btn btn-primary" href={getJsonExportUrl(exportAssessment)} target="_blank" rel="noreferrer">
                <IconDownload size={14} /> Download JSON
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Integrations;
