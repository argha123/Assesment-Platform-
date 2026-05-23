import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessments, getAssessment, submitResponses, completeAssessment, generateReport } from '../services/api';

function Assessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentCategory, setCurrentCategory] = useState('people');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadAssessment(id);
    } else {
      loadAssessments();
    }
  }, [id]);

  const loadAssessments = async () => {
    try {
      const res = await getAssessments();
      setAssessments(res.data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssessment = async (assessmentId) => {
    try {
      const res = await getAssessment(assessmentId);
      setAssessment(res.data);
      setQuestions(res.data.questions?.questions || []);
      
      // Load existing responses
      const existingResponses = {};
      (res.data.responses || []).forEach(r => {
        existingResponses[r.question_id] = { score: r.score, notes: r.notes };
      });
      setResponses(existingResponses);
    } catch (error) {
      console.error('Failed to load assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (questionId, score) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], score, question_id: questionId }
    }));
  };

  const handleNotes = (questionId, notes) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], notes, question_id: questionId }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const responseArray = Object.entries(responses).map(([qId, data]) => ({
        question_id: qId,
        answer: String(data.score || 0),
        score: data.score || 0,
        notes: data.notes || ''
      }));
      await submitResponses(id, responseArray);
      alert('Responses saved successfully!');
    } catch (error) {
      console.error('Failed to save responses:', error);
      alert('Failed to save responses');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Are you sure you want to complete this assessment? Make sure all questions are answered.')) return;
    
    try {
      // Save first
      const responseArray = Object.entries(responses).map(([qId, data]) => ({
        question_id: qId,
        answer: String(data.score || 0),
        score: data.score || 0,
        notes: data.notes || ''
      }));
      await submitResponses(id, responseArray);
      
      // Complete
      await completeAssessment(id);
      
      // Generate report
      const reportRes = await generateReport(id);
      navigate(`/reports/${reportRes.data.id}`);
    } catch (error) {
      console.error('Failed to complete assessment:', error);
      alert('Failed to complete assessment: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  // List view
  if (!id) {
    return (
      <div>
        <div className="page-header">
          <h2>Assessments</h2>
          <p>View and manage all assessments</p>
        </div>

        {assessments.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <h3>No Assessments Yet</h3>
              <p>Define an assessment scope and start your first assessment</p>
              <button className="btn btn-primary" onClick={() => navigate('/scope')}>Define Scope</button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Account</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.title}</td>
                      <td>{a.account_name}</td>
                      <td>{a.scope_name}</td>
                      <td>
                        <span className={`badge ${a.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>{a.overall_score ? `${a.overall_score}/5` : '-'}</td>
                      <td>{new Date(a.started_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/assessments/${a.id}`)}>
                          {a.status === 'completed' ? 'View' : 'Continue'}
                        </button>
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

  // Assessment detail/execution view
  const categoryQuestions = questions.filter(q => q.category.toLowerCase() === currentCategory);
  const totalAnswered = Object.keys(responses).filter(k => responses[k].score).length;
  const progress = questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0;

  const categories = ['people', 'process', 'technology'];
  const getCategoryCount = (cat) => questions.filter(q => q.category.toLowerCase() === cat).length;
  const getCategoryAnswered = (cat) => {
    const catQuestions = questions.filter(q => q.category.toLowerCase() === cat);
    return catQuestions.filter(q => responses[q.id]?.score).length;
  };

  return (
    <div>
      <div className="page-header">
        <h2>{assessment?.title || 'Assessment'}</h2>
        <p>{assessment?.account_name} - {assessment?.scope_name}</p>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600 }}>Overall Progress: {totalAnswered}/{questions.length} questions</span>
          <span style={{ fontWeight: 600, color: '#1a237e' }}>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill blue" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {assessment?.status === 'completed' ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3 style={{ color: '#2e7d32', marginBottom: '16px' }}>Assessment Completed!</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a237e' }}>{assessment.overall_score}/5</div>
                <div style={{ color: '#666', fontSize: '13px' }}>Overall</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a237e' }}>{assessment.people_score}/5</div>
                <div style={{ color: '#666', fontSize: '13px' }}>People</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#2e7d32' }}>{assessment.process_score}/5</div>
                <div style={{ color: '#666', fontSize: '13px' }}>Process</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef6c00' }}>{assessment.technology_score}/5</div>
                <div style={{ color: '#666', fontSize: '13px' }}>Technology</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/reports')}>View Reports</button>
          </div>
        </div>
      ) : (
        <>
          {/* Category Tabs */}
          <div className="tabs">
            {categories.map(cat => (
              <div key={cat} className={`tab ${currentCategory === cat ? 'active' : ''}`} onClick={() => setCurrentCategory(cat)}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)} ({getCategoryAnswered(cat)}/{getCategoryCount(cat)})
              </div>
            ))}
          </div>

          {/* Questions */}
          <div>
            {categoryQuestions.length === 0 ? (
              <div className="card empty-state">
                <p>No questions available for this category in the current scope</p>
              </div>
            ) : (
              categoryQuestions.map((question, idx) => (
                <div key={question.id} className="question-card">
                  <div className="question-meta">
                    <span className="badge badge-info">{question.subcategory}</span>
                    <span className="badge badge-purple">Weight: {question.weight}</span>
                  </div>
                  <div className="question-text">
                    {idx + 1}. {question.question_text}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Rate 1 (Poor) to 5 (Excellent):</div>
                      <div className="rating-selector">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button key={score} type="button"
                            className={`rating-btn ${responses[question.id]?.score === score ? 'selected' : ''}`}
                            onClick={() => handleRating(question.id, score)}>
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <input type="text" placeholder="Notes (optional)"
                        value={responses[question.id]?.notes || ''}
                        onChange={e => handleNotes(question.id, e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px' }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', position: 'sticky', bottom: '20px', background: '#f0f2f5', padding: '16px', borderRadius: '12px' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            <button className="btn btn-success" onClick={handleComplete} disabled={totalAnswered === 0}>
              Complete Assessment & Generate Report
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Assessment;
