import React from 'react';
import {
  BrowserRouter as Router, Routes, Route, Link,
  useLocation, Navigate, useNavigate
} from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import AssessmentScope from './pages/AssessmentScope';
import Assessment from './pages/Assessment';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import ActionItems from './pages/ActionItems';
import Templates from './pages/Templates';
import KnowledgeBase from './pages/KnowledgeBase';
import Gamification from './pages/Gamification';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import QuestionBank from './pages/QuestionBank';
import Compliance from './pages/Compliance';
import FrameworkDetail from './pages/FrameworkDetail';
import RiskRegister from './pages/RiskRegister';
import Benchmarks from './pages/Benchmarks';
import Integrations from './pages/Integrations';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Account from './pages/Account';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

/* ---------- Icons ---------- */
const Icon = ({ d, viewBox = '0 0 24 24', children, ...rest }) => (
  <svg width="18" height="18" viewBox={viewBox} fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

const navIcons = {
  brand: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 6v6c0 5 3.4 9.3 8 10 4.6-.7 8-5 8-10V6l-8-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  dashboard: (<Icon><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Icon>),
  accounts: (<Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>),
  scope: (<Icon><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></Icon>),
  assessment: (<Icon><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></Icon>),
  reports: (<Icon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 17v-3" /><path d="M12 17v-6" /><path d="M15 17v-4" /></Icon>),
  kanban: (<Icon><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></Icon>),
  templates: (<Icon><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></Icon>),
  kb: (<Icon><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Icon>),
  award: (<Icon><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></Icon>),
  users: (<Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>),
  audit: (<Icon><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Icon>),
  shield: (<Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>),
  alert: (<Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Icon>),
  trend: (<Icon><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Icon>),
  link: (<Icon><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Icon>),
  logout: (<Icon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>),
};

const ROLE_BADGE = {
  admin:    { label: 'Admin',    color: 'var(--purple-600)'  },
  assessor: { label: 'Assessor', color: 'var(--info-600)'    },
  reviewer: { label: 'Reviewer', color: 'var(--warning-600)' },
  client:   { label: 'Client',   color: 'var(--success-600)' }
};

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const workspaceLinks = [
    { to: '/',            label: 'Dashboard',        icon: navIcons.dashboard },
    { to: '/accounts',    label: 'Accounts',         icon: navIcons.accounts },
    { to: '/scope',       label: 'Assessment Scope', icon: navIcons.scope },
    { to: '/assessments', label: 'Assessments',      icon: navIcons.assessment },
    { to: '/reports',     label: 'Reports',          icon: navIcons.reports },
    { to: '/action-items',label: 'Action Items',     icon: navIcons.kanban },
    { to: '/risks',       label: 'Risk Register',    icon: navIcons.alert },
    { to: '/compliance',  label: 'Compliance',       icon: navIcons.shield },
    { to: '/benchmarks',  label: 'Benchmarks',       icon: navIcons.trend },
  ];

  const resourceLinks = [
    { to: '/templates',     label: 'Templates',      icon: navIcons.templates },
    { to: '/knowledge-base',label: 'Knowledge Base', icon: navIcons.kb },
    { to: '/achievements',  label: 'Achievements',   icon: navIcons.award },
    { to: '/integrations',  label: 'Integrations',   icon: navIcons.link },
  ];

  const adminLinks = [
    { to: '/users',         label: 'Users & Roles',   icon: navIcons.users },
    { to: '/question-bank', label: 'Question Bank',   icon: navIcons.assessment },
    { to: '/audit-log',     label: 'Audit Log',       icon: navIcons.audit },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role && ROLE_BADGE[user.role];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">{navIcons.brand}</span>
          <div>
            <h1>IT Assessment</h1>
            <p>Enterprise Platform</p>
          </div>
        </div>
      </div>

      <div className="nav-section-title">Workspace</div>
      <ul className="nav-links">
        {workspaceLinks.map((link) => (
          <li key={link.to} className={isActive(link.to) ? 'active' : ''}>
            <Link to={link.to}>
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-section-title">Resources</div>
      <ul className="nav-links">
        {resourceLinks.map((link) => (
          <li key={link.to} className={isActive(link.to) ? 'active' : ''}>
            <Link to={link.to}>
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {hasRole('admin') && (
        <>
          <div className="nav-section-title">Administration</div>
          <ul className="nav-links">
            {adminLinks.map((link) => (
              <li key={link.to} className={isActive(link.to) ? 'active' : ''}>
                <Link to={link.to}>
                  <span className="nav-icon">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="sidebar-footer">
        <Link to="/account" className="footer-user" title="Account settings">
          <div className="footer-avatar">{(user?.name || '?').charAt(0).toUpperCase()}</div>
          <div className="footer-text">
            <p>{user?.name || 'User'}</p>
            <span className="footer-version" style={{ color: role?.color }}>
              {role?.label || user?.role || 'Member'}
            </span>
          </div>
        </Link>
        <button onClick={handleLogout} className="footer-logout" title="Sign out">
          {navIcons.logout}
        </button>
      </div>
    </nav>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading" style={{ minHeight: '100vh' }}>Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/scope" element={<AssessmentScope />} />
          <Route path="/assessments" element={<Assessment />} />
          <Route path="/assessments/:id" element={<Assessment />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/action-items" element={<ActionItems />} />
          <Route path="/risks" element={<RiskRegister />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/compliance/:id" element={<FrameworkDetail />} />
          <Route path="/benchmarks" element={<Benchmarks />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/achievements" element={<Gamification />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/users" element={<AdminOnly><Users /></AdminOnly>} />
          <Route path="/question-bank" element={<AdminOnly><QuestionBank /></AdminOnly>} />
          <Route path="/audit-log" element={<AdminOnly><AuditLog /></AdminOnly>} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminOnly({ children }) {
  const { hasRole } = useAuth();
  if (!hasRole('admin')) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
