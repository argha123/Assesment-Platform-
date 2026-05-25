import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// ---- Auth token interceptor ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // Token invalid/expired
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Avoid redirect loops on the login page itself
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ===========================================
// Auth
// ===========================================
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const changeOwnPassword = (current_password, new_password) =>
  api.put('/auth/password', { current_password, new_password });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, new_password) => api.post('/auth/reset-password', { token, new_password });

// ===========================================
// Admin user management
// ===========================================
export const getPrivilegeCatalogue = () => api.get('/auth/privileges');
export const listUsers = () => api.get('/auth/users');
export const createUser = (data) => api.post('/auth/users', data);
export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data);
export const updateUserRole = (id, role) => api.put(`/auth/users/${id}/role`, { role });
export const adminResetUserPassword = (id, new_password) =>
  api.put(`/auth/users/${id}/password`, { new_password });
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);

// ===========================================
// Accounts
// ===========================================
export const getAccounts = () => api.get('/accounts');
export const getAccount = (id) => api.get(`/accounts/${id}`);
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// ===========================================
// Assessment Scopes
// ===========================================
export const getScopes = () => api.get('/assessments/scopes');
export const getScope = (id) => api.get(`/assessments/scopes/${id}`);
export const createScope = (data) => api.post('/assessments/scopes', data);

// ===========================================
// Assessments
// ===========================================
export const getAssessments = () => api.get('/assessments');
export const getAssessment = (id) => api.get(`/assessments/${id}`);
export const startAssessment = (scopeId) => api.post('/assessments/start', { scope_id: scopeId });
export const submitResponses = (id, responses) => api.post(`/assessments/${id}/responses`, { responses });
export const completeAssessment = (id) => api.post(`/assessments/${id}/complete`);

// ===========================================
// Questions
// ===========================================
export const getQuestions = (params) => api.get('/questions', { params });
export const getQuestion = (id) => api.get(`/questions/${id}`);
export const getQuestionCategories = () => api.get('/questions/categories');
export const createQuestion = (data) => api.post('/questions', data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

// ===========================================
// Reports
// ===========================================
export const getReports = () => api.get('/reports');
export const getReport = (id) => api.get(`/reports/${id}`);
export const generateReport = (assessmentId) => api.post(`/reports/generate/${assessmentId}`);

// ===========================================
// Audit Log
// ===========================================
export const getAuditLogs = (params) => api.get('/audit-log', { params });

// ===========================================
// Evidence (file uploads)
// ===========================================
export const uploadEvidence = (formData) =>
  api.post('/evidence/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getEvidenceForAssessment = (assessmentId) => api.get(`/evidence/assessment/${assessmentId}`);
export const getEvidenceForQuestion = (assessmentId, questionId) =>
  api.get(`/evidence/question/${assessmentId}/${questionId}`);
export const deleteEvidence = (id) => api.delete(`/evidence/${id}`);
export const evidenceDownloadUrl = (id) => `${API_BASE}/evidence/download/${id}`;

// ===========================================
// Action Items (Kanban)
// ===========================================
export const getActionItems = (params) => api.get('/action-items', { params });
export const createActionItem = (data) => api.post('/action-items', data);
export const updateActionItem = (id, data) => api.put(`/action-items/${id}`, data);
export const deleteActionItem = (id) => api.delete(`/action-items/${id}`);
export const getBurnDown = (assessmentId) => api.get(`/action-items/burndown/${assessmentId}`);

// ===========================================
// Templates
// ===========================================
export const getTemplates = (params) => api.get('/templates', { params });
export const getTemplate = (id) => api.get(`/templates/${id}`);
export const createTemplate = (data) => api.post('/templates', data);

// ===========================================
// Knowledge Base
// ===========================================
export const getArticles = (params) => api.get('/knowledge-base', { params });
export const getArticle = (id) => api.get(`/knowledge-base/${id}`);
export const createArticle = (data) => api.post('/knowledge-base', data);
export const updateArticle = (id, data) => api.put(`/knowledge-base/${id}`, data);
export const deleteArticle = (id) => api.delete(`/knowledge-base/${id}`);
export const getKnowledgeCategories = () => api.get('/knowledge-base/meta/categories');

// ===========================================
// Gamification
// ===========================================
export const getBadges = () => api.get('/gamification/badges');
export const getUserBadges = (userId) => api.get(`/gamification/user/${userId}`);
export const getLeaderboard = () => api.get('/gamification/leaderboard');
export const checkAchievements = (userId) => api.post(`/gamification/check-achievements/${userId}`);

export default api;

// ===========================================
// Collaboration: Comments / Assignments / Notifications
// ===========================================
export const getComments = (assessmentId) => api.get(`/collaboration/comments/${assessmentId}`);
export const addComment = (data) => api.post('/collaboration/comments', data);
export const getAssignments = (assessmentId) => api.get(`/collaboration/assignments/${assessmentId}`);
export const createAssignment = (data) => api.post('/collaboration/assignments', data);
export const updateAssignment = (id, data) => api.put(`/collaboration/assignments/${id}`, data);
export const getNotifications = (userId) => api.get(`/collaboration/notifications/${userId}`);
export const markNotificationRead = (id) => api.put(`/collaboration/notifications/${id}/read`);

// ===========================================
// Compliance
// ===========================================
export const getFrameworks = () => api.get('/compliance/frameworks');
export const getFramework = (id) => api.get(`/compliance/frameworks/${id}`);
export const updateFramework = (id, data) => api.put(`/compliance/frameworks/${id}`, data);
export const getFrameworkControls = (id) => api.get(`/compliance/frameworks/${id}/controls`);
export const createControl = (frameworkId, data) => api.post(`/compliance/frameworks/${frameworkId}/controls`, data);
export const updateControl = (id, data) => api.put(`/compliance/controls/${id}`, data);
export const deleteControl = (id) => api.delete(`/compliance/controls/${id}`);
export const getControlMappings = (id) => api.get(`/compliance/controls/${id}/mappings`);
export const setControlMappings = (id, question_ids) => api.put(`/compliance/controls/${id}/mappings`, { question_ids });
export const getComplianceGapReport = (assessmentId, frameworkId) =>
  api.get(`/compliance/gap-report/${assessmentId}`, { params: frameworkId ? { framework_id: frameworkId } : {} });

// ===========================================
// Risk Register
// ===========================================
export const getRiskRegister = (assessmentId) => api.get(`/risks/${assessmentId}`);
export const createRisk = (data) => api.post('/risks', data);
export const updateRisk = (id, data) => api.put(`/risks/${id}`, data);
export const calculateRoi = (data) => api.post('/risks/roi-calculate', data);

// ===========================================
// Benchmarks
// ===========================================
export const getBenchmarks = (industry, params) => api.get(`/benchmarks/${encodeURIComponent(industry)}`, { params });
export const getBenchmarkComparison = (assessmentId) => api.get(`/benchmarks/compare/${assessmentId}`);

// ===========================================
// Integrations
// ===========================================
export const getWebhooks = () => api.get('/integrations/webhooks');
export const createWebhook = (data) => api.post('/integrations/webhooks', data);
export const deleteWebhook = (id) => api.delete(`/integrations/webhooks/${id}`);
export const triggerWebhook = (data) => api.post('/integrations/webhooks/trigger', data);
export const createJiraIssue = (data) => api.post('/integrations/jira/create-issue', data);
export const sendSlackNotification = (data) => api.post('/integrations/slack/notify', data);
export const getJsonExportUrl = (assessmentId) => `${API_BASE}/integrations/export/json/${assessmentId}`;

// ===========================================
// Export URLs (downloads)
// ===========================================
export const pdfExportUrl = (reportId) => `${API_BASE}/export/pdf/${reportId}`;
export const excelExportUrl = (assessmentId) => `${API_BASE}/export/excel/${assessmentId}`;
export const csvExportUrl = (assessmentId) => `${API_BASE}/export/csv/${assessmentId}`;
