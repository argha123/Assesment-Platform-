import React, { useEffect, useRef, useState } from 'react';
import {
  uploadEvidence, getEvidenceForQuestion, deleteEvidence, evidenceDownloadUrl
} from '../services/api';
import { IconPaperclip, IconUpload, IconDownload, IconTrash, IconAlertTriangle } from './Icons';

const MAX_BYTES = 50 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function EvidencePanel({ assessmentId, questionId }) {
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const load = async () => {
    if (!assessmentId || !questionId) return;
    try {
      const res = await getEvidenceForQuestion(assessmentId, questionId);
      setFiles(res.data || []);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line
  }, [open, assessmentId, questionId]);

  // also load count quietly so we can show the badge
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [assessmentId, questionId]);

  const handleUpload = async (file) => {
    if (!file) return;
    setError('');
    if (file.size > MAX_BYTES) {
      setError(`File too large. Max 50 MB.`);
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('assessment_id', assessmentId);
    fd.append('question_id', questionId);
    setUploading(true);
    try {
      await uploadEvidence(fd);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this evidence file?')) return;
    await deleteEvidence(id);
    load();
  };

  return (
    <div className="evidence-panel">
      <button type="button" className="evidence-toggle" onClick={() => setOpen(o => !o)}>
        <IconPaperclip size={13} />
        <span>{open ? 'Hide evidence' : 'Evidence'}</span>
        {files.length > 0 && <span className="evidence-count">{files.length}</span>}
      </button>

      {open && (
        <div className="evidence-body">
          {error && (
            <div style={{
              padding: '8px 12px', background: 'var(--danger-50)',
              border: '1px solid var(--danger-100)', borderRadius: 'var(--r-sm)',
              color: 'var(--danger-700)', fontSize: 12,
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8
            }}>
              <IconAlertTriangle size={13} /> {error}
            </div>
          )}

          {files.length > 0 && (
            <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
              {files.map(f => (
                <div key={f.id} className="evidence-row">
                  <IconPaperclip size={13} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.original_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {formatSize(f.file_size)} · {new Date(f.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                  <a href={evidenceDownloadUrl(f.id)} target="_blank" rel="noreferrer"
                    className="evidence-icon-btn" title="Download">
                    <IconDownload size={13} />
                  </a>
                  <button type="button" className="evidence-icon-btn" onClick={() => handleDelete(f.id)} title="Delete">
                    <IconTrash size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className={`evidence-dropzone ${uploading ? 'is-uploading' : ''}`}>
            <input ref={inputRef} type="file" hidden
              onChange={e => handleUpload(e.target.files?.[0])} />
            <IconUpload size={14} />
            <span>{uploading ? 'Uploading…' : 'Attach a file (max 50 MB)'}</span>
          </label>
        </div>
      )}
    </div>
  );
}

export default EvidencePanel;
