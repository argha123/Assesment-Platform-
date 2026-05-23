import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Accounts
export const getAccounts = () => api.get('/accounts');
export const getAccount = (id) => api.get(`/accounts/${id}`);
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// Assessment Scopes
export const getScopes = () => api.get('/assessments/scopes');
export const getScope = (id) => api.get(`/assessments/scopes/${id}`);
export const createScope = (data) => api.post('/assessments/scopes', data);

// Assessments
export const getAssessments = () => api.get('/assessments');
export const getAssessment = (id) => api.get(`/assessments/${id}`);
export const startAssessment = (scopeId) => api.post('/assessments/start', { scope_id: scopeId });
export const submitResponses = (id, responses) => api.post(`/assessments/${id}/responses`, { responses });
export const completeAssessment = (id) => api.post(`/assessments/${id}/complete`);

// Questions
export const getQuestions = (params) => api.get('/questions', { params });
export const getQuestionCategories = () => api.get('/questions/categories');

// Reports
export const getReports = () => api.get('/reports');
export const getReport = (id) => api.get(`/reports/${id}`);
export const generateReport = (assessmentId) => api.post(`/reports/generate/${assessmentId}`);

export default api;
