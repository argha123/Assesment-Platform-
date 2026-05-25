import React, { useEffect, useState } from 'react';
import { getComments, addComment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { IconMessageSquare, IconUser } from './Icons';

function CommentsPanel({ assessmentId, questionId = null }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!assessmentId) return;
    try {
      const res = await getComments(assessmentId);
      const filtered = questionId
        ? res.data.filter(c => c.question_id === questionId)
        : res.data.filter(c => !c.question_id);
      setComments(filtered);
    } catch {}
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [assessmentId, questionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await addComment({
        assessment_id: assessmentId,
        question_id: questionId,
        user_id: user?.id,
        user_name: user?.name || 'Anonymous',
        content: text.trim()
      });
      setText('');
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'transparent', border: 'none', cursor: 'pointer',
          width: '100%', textAlign: 'left', padding: 0, fontFamily: 'inherit'
        }}>
        <IconMessageSquare size={16} />
        <h3 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)' }}>
          {questionId ? 'Question Discussion' : 'Assessment Comments'}
        </h3>
        <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{comments.length}</span>
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))',
                color: 'white', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, fontWeight: 700
              }}>
                {(user?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <textarea value={text} onChange={e => setText(e.target.value)}
                  placeholder="Share an observation, finding, or question…"
                  style={{ width: '100%', minHeight: 70, padding: 10,
                    border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)',
                    fontFamily: 'inherit', fontSize: 13.5 }} />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !text.trim()}>
                    {submitting ? 'Posting…' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {comments.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comments.map(c => (
                <div key={c.id} style={{
                  display: 'flex', gap: 10,
                  padding: 12, background: 'var(--gray-50)',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-md)'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))',
                    color: 'white', display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, fontWeight: 700
                  }}>
                    {(c.user_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>{c.user_name || 'User'}</strong>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {comments.length === 0 && (
            <div style={{ marginTop: 14, padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No comments yet. Start the discussion above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentsPanel;
