import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessments, getAssessment, submitResponses, completeAssessment, generateReport } from '../services/api';

const RATING_LABELS = {
  1: { label: 'Non-Existent', description: 'No capability or process exists', color: '#b71c1c' },
  2: { label: 'Initial', description: 'Ad hoc, reactive with no formal structure', color: '#c62828' },
  3: { label: 'Developing', description: 'Basic processes emerging but inconsistent', color: '#e65100' },
  4: { label: 'Repeatable', description: 'Processes exist and followed in most cases', color: '#ef6c00' },
  5: { label: 'Defined', description: 'Standardized and documented across the organization', color: '#f9a825' },
  6: { label: 'Managed', description: 'Measured with KPIs and actively managed', color: '#9e9d24' },
  7: { label: 'Effective', description: 'Consistently delivering expected outcomes', color: '#558b2f' },
  8: { label: 'Integrated', description: 'Fully integrated with business strategy and goals', color: '#2e7d32' },
  9: { label: 'Optimizing', description: 'Continuous improvement with proactive innovation', color: '#1b5e20' },
  10: { label: 'World-Class', description: 'Industry-leading practices setting benchmarks', color: '#004d40' }
};

function Assessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentCategory, setCurrentCategory] = useState('people');
  const [currentSubcategory, setCurrentSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [hoveredRating, setHoveredRating] = useState({});
  const autoSaveTimer = useRef(null);
  const lastSavedResponses = useRef({});

  useEffect(() => {
    if (id) {
      loadAssessment(id);
    } else {
      loadAssessments();
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
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

      const existingResponses = {};
      (res.data.responses || []).forEach(r => {
        existingResponses[r.question_id] = { score: r.score, notes: r.notes };
      });
      setResponses(existingResponses);
      lastSavedResponses.current = JSON.parse(JSON.stringify(existingResponses));
    } catch (error) {
      console.error('Failed to load assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save logic
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const currentJson = JSON.stringify(responses);
      const lastJson = JSON.stringify(lastSavedResponses.current);
      if (currentJson === lastJson) return;

      setAutoSaveStatus('saving');
      try {
        const responseArray = Object.entries(responses)
          .filter(([, data]) => data.score)
          .map(([qId, data]) => ({
            question_id: qId,
            answer: String(data.score || 0),
            score: data.score || 0,
            notes: data.notes || ''
          }));
        if (responseArray.length > 0) {
          await submitResponses(id, responseArray);
          lastSavedResponses.current = JSON.parse(JSON.stringify(responses));
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus(''), 3000);
        }
      } catch (error) {
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus(''), 5000);
      }
    }, 2000);
  }, [responses, id]);

  const handleRating = (questionId, score) => {
    setResponses(prev => {
      const updated = {
        ...prev,
        [questionId]: { ...prev[questionId], score, question_id: questionId }
      };
      return updated;
    });
    setTimeout(() => triggerAutoSave(), 0);
  };

  const handleNotes = (questionId, notes) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], notes, question_id: questionId }
    }));
    triggerAutoSave();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const responseArray = Object.entries(responses)
        .filter(([, data]) => data.score)
        .map(([qId, data]) => ({
          question_id: qId,
          answer: String(data.score || 0),
          score: data.score || 0,
          notes: data.notes || ''
        }));
      await submitResponses(id, responseArray);
      lastSavedResponses.current = JSON.parse(JSON.stringify(responses));
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to save responses:', error);
      alert('Failed to save responses');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    const unanswered = questions.filter(q => !responses[q.id]?.score);
    if (unanswered.length > 0) {
      setShowCompletionModal(true);
      return;
    }
    await finalizeAssessment();
  };

  const finalizeAssessment = async () => {
    setShowCompletionModal(false);
    setSaving(true);
    try {
      const responseArray = Object.entries(responses)
        .filter(([, data]) => data.score)
        .map(([qId, data]) => ({
          question_id: qId,
          answer: String(data.score || 0),
          score: data.score || 0,
          notes: data.notes || ''
        }));
      await submitResponses(id, responseArray);
      await completeAssessment(id);
      const reportRes = await generateReport(id);
      navigate(`/reports/${reportRes.data.id}`);
    } catch (error) {
      console.error('Failed to complete assessment:', error);
      alert('Failed to complete assessment: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Navigation helpers
  const getSubcategories = (cat) => {
    const catQuestions = questions.filter(q => q.category.toLowerCase() === cat);
    return [...new Set(catQuestions.map(q => q.subcategory))];
  };

  const navigateToNextCategory = () => {
    const categories = ['people', 'process', 'technology'];
    const currentIdx = categories.indexOf(currentCategory);
    if (currentIdx < categories.length - 1) {
      setCurrentCategory(categories[currentIdx + 1]);
      setCurrentSubcategory(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToPrevCategory = () => {
    const categories = ['people', 'process', 'technology'];
    const currentIdx = categories.indexOf(currentCategory);
    if (currentIdx > 0) {
      setCurrentCategory(categories[currentIdx - 1]);
      setCurrentSubcategory(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
                      <td>{a.overall_score ? `${a.overall_score}/10` : '-'}</td>
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

  // Assessment execution view
  const categories = ['people', 'process', 'technology'];
  const subcategories = getSubcategories(currentCategory);
  const categoryQuestions = questions.filter(q => {
    const matchesCat = q.category.toLowerCase() === currentCategory;
    if (currentSubcategory) {
      return matchesCat && q.subcategory === currentSubcategory;
    }
    return matchesCat;
  });

  const totalAnswered = Object.keys(responses).filter(k => responses[k].score).length;
  const progress = questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0;

  const getCategoryCount = (cat) => questions.filter(q => q.category.toLowerCase() === cat).length;
  const getCategoryAnswered = (cat) => {
    const catQuestions = questions.filter(q => q.category.toLowerCase() === cat);
    return catQuestions.filter(q => responses[q.id]?.score).length;
  };
  const getSubcategoryAnswered = (subcat) => {
    const subQuestions = questions.filter(q => q.category.toLowerCase() === currentCategory && q.subcategory === subcat);
    return subQuestions.filter(q => responses[q.id]?.score).length;
  };
  const getSubcategoryCount = (subcat) => {
    return questions.filter(q => q.category.toLowerCase() === currentCategory && q.subcategory === subcat).length;
  };

  const unansweredCount = questions.filter(q => !responses[q.id]?.score).length;
  const categoryProgress = (cat) => {
    const count = getCategoryCount(cat);
    const answered = getCategoryAnswered(cat);
    return count > 0 ? Math.round((answered / count) * 100) : 0;
  };

  return (
    <div>
      <div className="page-header">
        <h2>{assessment?.title || 'Assessment'}</h2>
        <p>{assessment?.account_name} - {assessment?.scope_name}</p>
      </div>

      {/* Auto-save indicator */}
      {autoSaveStatus && (
        <div style={{
          position: 'fixed', top: '16px', right: '16px', padding: '8px 16px',
          borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 1000,
          background: autoSaveStatus === 'saved' ? '#e8f5e9' : autoSaveStatus === 'error' ? '#fce4ec' : '#e3f2fd',
          color: autoSaveStatus === 'saved' ? '#2e7d32' : autoSaveStatus === 'error' ? '#c62828' : '#1565c0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.3s ease'
        }}>
          {autoSaveStatus === 'saving' && '... Auto-saving'}
          {autoSaveStatus === 'saved' && 'All changes saved'}
          {autoSaveStatus === 'error' && 'Auto-save failed - save manually'}
        </div>
      )}

      {/* Overall Progress Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 600, fontSize: '16px' }}>
            Overall Progress: {totalAnswered} of {questions.length} questions answered
          </span>
          <span style={{ fontWeight: 700, color: progress === 100 ? '#2e7d32' : '#1a237e', fontSize: '18px' }}>{progress}%</span>
        </div>
        <div className="progress-bar" style={{ height: '10px' }}>
          <div className="progress-fill blue" style={{ width: `${progress}%`, background: progress === 100 ? 'linear-gradient(90deg, #2e7d32, #66bb6a)' : undefined }}></div>
        </div>

        {/* Per-category mini progress */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
          {categories.map(cat => (
            <div key={cat} style={{ padding: '12px', background: '#f8f9ff', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{cat}</span>
                <span style={{ fontSize: '12px', color: '#666' }}>{getCategoryAnswered(cat)}/{getCategoryCount(cat)}</span>
              </div>
              <div className="progress-bar" style={{ height: '6px' }}>
                <div className={`progress-fill ${cat === 'people' ? 'blue' : cat === 'process' ? 'green' : 'orange'}`}
                  style={{ width: `${categoryProgress(cat)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {assessment?.status === 'completed' ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
            <h3 style={{ color: '#2e7d32', marginBottom: '16px' }}>Assessment Completed!</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a237e' }}>{assessment.overall_score}/10</div>
                <div style={{ color: '#666', fontSize: '13px' }}>Overall</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a237e' }}>{assessment.people_score}/10</div>
                <div style={{ color: '#666', fontSize: '13px' }}>People</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#2e7d32' }}>{assessment.process_score}/10</div>
                <div style={{ color: '#666', fontSize: '13px' }}>Process</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef6c00' }}>{assessment.technology_score}/10</div>
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
            {categories.map(cat => {
              const answered = getCategoryAnswered(cat);
              const total = getCategoryCount(cat);
              const complete = answered === total && total > 0;
              return (
                <div key={cat}
                  className={`tab ${currentCategory === cat ? 'active' : ''}`}
                  onClick={() => { setCurrentCategory(cat); setCurrentSubcategory(null); }}
                  style={{ position: 'relative' }}>
                  {complete && <span style={{ color: '#2e7d32', marginRight: '4px' }}>&#10003;</span>}
                  {cat.charAt(0).toUpperCase() + cat.slice(1)} ({answered}/{total})
                </div>
              );
            })}
          </div>

          {/* Subcategory filter pills */}
          {subcategories.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                className={`btn btn-sm ${!currentSubcategory ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCurrentSubcategory(null)}
                style={{ padding: '6px 14px', fontSize: '12px' }}>
                All ({getCategoryCount(currentCategory)})
              </button>
              {subcategories.map(sub => {
                const subAnswered = getSubcategoryAnswered(sub);
                const subTotal = getSubcategoryCount(sub);
                const subComplete = subAnswered === subTotal;
                return (
                  <button key={sub}
                    className={`btn btn-sm ${currentSubcategory === sub ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setCurrentSubcategory(sub)}
                    style={{ padding: '6px 14px', fontSize: '12px' }}>
                    {subComplete && <span style={{ marginRight: '4px' }}>&#10003;</span>}
                    {sub} ({subAnswered}/{subTotal})
                  </button>
                );
              })}
            </div>
          )}

          {/* Rating Legend */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>Rating Scale:</span>
              {Object.entries(RATING_LABELS).map(([score, info]) => (
                <div key={score} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '6px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                    background: info.color, color: 'white'
                  }}>{score}</span>
                  <span style={{ fontSize: '12px', color: '#555' }}>{info.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div>
            {categoryQuestions.length === 0 ? (
              <div className="card empty-state">
                <p>No questions available for this category in the current scope</p>
              </div>
            ) : (
              categoryQuestions.map((question, idx) => {
                const selectedScore = responses[question.id]?.score;
                const hoverScore = hoveredRating[question.id];
                const displayScore = hoverScore || selectedScore;

                return (
                  <div key={question.id} className="question-card" style={{
                    borderColor: selectedScore ? '#c8e6c9' : undefined,
                    background: selectedScore ? '#fafffe' : undefined
                  }}>
                    {/* Question header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div className="question-meta">
                        <span className="badge badge-info">{question.subcategory}</span>
                        <span className="badge badge-purple">Weight: {question.weight}x</span>
                        {selectedScore && <span className="badge badge-success">Answered</span>}
                      </div>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        Q{idx + 1} of {categoryQuestions.length}
                      </span>
                    </div>

                    {/* Question text */}
                    <div className="question-text" style={{ fontSize: '15px', lineHeight: '1.5' }}>
                      {question.question_text}
                    </div>

                    {/* Rating section */}
                    <div style={{ marginTop: '16px' }}>
                      <div className="rating-selector" style={{ gap: '0' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
                          const ratingInfo = RATING_LABELS[score];
                          const isSelected = selectedScore === score;
                          const isHovered = hoverScore === score;
                          return (
                            <button key={score} type="button"
                              className={`rating-btn ${isSelected ? 'selected' : ''}`}
                              onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [question.id]: score }))}
                              onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [question.id]: null }))}
                              onClick={() => handleRating(question.id, score)}
                              style={{
                                width: '52px', height: '48px', borderRadius: '6px',
                                margin: '0 2px', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: '1px',
                                background: isSelected ? ratingInfo.color : isHovered ? `${ratingInfo.color}20` : 'white',
                                borderColor: isSelected ? ratingInfo.color : isHovered ? ratingInfo.color : '#e0e0e0',
                                color: isSelected ? 'white' : '#333',
                                transition: 'all 0.15s ease',
                                cursor: 'pointer'
                              }}>
                              <span style={{ fontSize: '14px', fontWeight: 700 }}>{score}</span>
                              <span style={{ fontSize: '8px', fontWeight: 500, opacity: 0.85, lineHeight: '1' }}>{ratingInfo.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Rating description tooltip */}
                      {displayScore && (
                        <div style={{
                          marginTop: '8px', padding: '8px 12px', borderRadius: '6px',
                          background: `${RATING_LABELS[displayScore].color}10`,
                          borderLeft: `3px solid ${RATING_LABELS[displayScore].color}`,
                          fontSize: '12px', color: '#555', transition: 'all 0.2s ease'
                        }}>
                          <strong style={{ color: RATING_LABELS[displayScore].color }}>
                            Level {displayScore} - {RATING_LABELS[displayScore].label}:
                          </strong>{' '}
                          {RATING_LABELS[displayScore].description}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div style={{ marginTop: '12px' }}>
                      <input type="text"
                        placeholder="Add observation notes, evidence, or comments..."
                        value={responses[question.id]?.notes || ''}
                        onChange={e => handleNotes(question.id, e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', border: '1px solid #e0e0e0',
                          borderRadius: '6px', fontSize: '13px', background: '#fafafa',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.target.style.borderColor = '#1a237e'}
                        onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Navigation between categories */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', marginBottom: '8px' }}>
            <button className="btn btn-outline btn-sm"
              onClick={navigateToPrevCategory}
              disabled={currentCategory === 'people'}
              style={{ opacity: currentCategory === 'people' ? 0.4 : 1 }}>
              &larr; Previous Section
            </button>
            <button className="btn btn-outline btn-sm"
              onClick={navigateToNextCategory}
              disabled={currentCategory === 'technology'}
              style={{ opacity: currentCategory === 'technology' ? 0.4 : 1 }}>
              Next Section &rarr;
            </button>
          </div>

          {/* Sticky action bar */}
          <div style={{
            display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px',
            position: 'sticky', bottom: '16px',
            background: 'white', padding: '16px 20px', borderRadius: '12px',
            boxShadow: '0 -2px 16px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0'
          }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            <button className="btn btn-success" onClick={handleComplete} disabled={totalAnswered === 0 || saving}>
              Complete Assessment & Generate Report
            </button>
            <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#666' }}>
              {unansweredCount > 0 ? (
                <span style={{ color: '#ef6c00' }}>{unansweredCount} question{unansweredCount > 1 ? 's' : ''} remaining</span>
              ) : (
                <span style={{ color: '#2e7d32', fontWeight: 600 }}>&#10003; All questions answered!</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Completion Confirmation Modal */}
      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ color: '#ef6c00' }}>Incomplete Assessment</h3>
            <p style={{ margin: '16px 0', color: '#555', lineHeight: '1.6' }}>
              You have <strong>{unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}</strong> out of {questions.length} total.
              Unanswered questions will not be included in the scoring.
            </p>
            <div style={{ background: '#fff3e0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
              <strong style={{ color: '#e65100' }}>Unanswered by category:</strong>
              <ul style={{ margin: '8px 0 0 16px', color: '#555', fontSize: '14px' }}>
                {categories.map(cat => {
                  const catUnanswered = questions.filter(q => q.category.toLowerCase() === cat && !responses[q.id]?.score).length;
                  if (catUnanswered === 0) return null;
                  return <li key={cat}><strong>{cat.charAt(0).toUpperCase() + cat.slice(1)}:</strong> {catUnanswered} questions</li>;
                })}
              </ul>
            </div>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Do you want to complete the assessment with partial responses, or continue answering?
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowCompletionModal(false)}>
                Continue Answering
              </button>
              <button className="btn btn-warning" onClick={finalizeAssessment}>
                Complete Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assessment;
