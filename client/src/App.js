import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import AssessmentScope from './pages/AssessmentScope';
import Assessment from './pages/Assessment';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import './App.css';

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">&#9881;</span>
          <div>
            <h1>IT Assessment</h1>
            <p>Enterprise Platform</p>
          </div>
        </div>
      </div>
      <ul className="nav-links">
        <li className={isActive('/') ? 'active' : ''}>
          <Link to="/">&#9632; Dashboard</Link>
        </li>
        <li className={isActive('/accounts') ? 'active' : ''}>
          <Link to="/accounts">&#9632; Accounts</Link>
        </li>
        <li className={isActive('/scope') ? 'active' : ''}>
          <Link to="/scope">&#9632; Assessment Scope</Link>
        </li>
        <li className={isActive('/assessments') ? 'active' : ''}>
          <Link to="/assessments">&#9632; Assessments</Link>
        </li>
        <li className={isActive('/reports') ? 'active' : ''}>
          <Link to="/reports">&#9632; Reports</Link>
        </li>
      </ul>
      <div className="sidebar-footer">
        <p>v1.0.0 Enterprise</p>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
