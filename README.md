# Enterprise IT Infrastructure Assessment Platform

A comprehensive full-stack application for conducting deep-dive assessments of IT infrastructure across **People**, **Process**, and **Technology** dimensions. Features industry benchmarking, compliance mapping, risk quantification, and 30-60-90 day action plans.

## Features

### Core Assessment Engine
- **Account Management** - Create and manage client organizations with industry, size, and contact details
- **Assessment Scope Definition** - Define what to assess including technology stack, departments, infrastructure type, and focus areas
- **Dynamic Question Bank** - 100+ weighted questions across People, Process, and Technology categories
- **Automated Assessment Engine** - Generates tailored questions based on scope configuration
- **10-Point Rating Scale** - Granular maturity levels from Non-Existent (1) to World-Class (10)
- **Auto-Save** - Responses auto-saved every 2 seconds with visual indicator

### Authentication & Security
- **JWT Authentication** - Secure token-based auth with 7-day expiry
- **Role-Based Access Control (RBAC)** - Admin, Assessor, Reviewer, Client roles
- **Audit Logging** - Full activity tracking for all data changes
- **Password Hashing** - bcrypt with salt rounds

### Collaborative Assessment
- **Multi-User Assignments** - Assign different sections to subject matter experts
- **Comments & Discussions** - Per-question threaded comments
- **Notifications** - User notification system for assignments and updates
- **Real-time Status** - Track assignment completion per category

### Evidence Management
- **File Attachments** - Upload evidence per question (screenshots, policies, diagrams)
- **50MB File Support** - Large document uploads via multer
- **Evidence Repository** - Centralized evidence linked to responses
- **Download & Delete** - Full lifecycle management

### Compliance Mapping
- **8 Frameworks Pre-loaded**: NIST CSF, ISO 27001, CIS Controls v8, SOC 2, HIPAA, PCI DSS, GDPR, COBIT
- **40+ Controls** mapped across frameworks
- **Gap Reports** - Show compliance status per control (Compliant/Partial/Non-Compliant)
- **Question-to-Control Mapping** - Link assessment questions to compliance requirements

### Risk Quantification
- **Risk Register** - Track risks with likelihood, impact, and financial exposure
- **Risk Scoring** - Automated risk score calculation (1-10)
- **Financial Impact Modeling** - Estimate annual loss exposure
- **ROI Calculator** - Calculate return on investment for mitigation investments
- **Payback Period** - Months to recover investment

### Industry Benchmarking
- **5 Industries** - Technology, Healthcare, Financial Services, Manufacturing, Retail
- **Peer Comparison** - Compare scores against industry averages
- **Percentile Position** - Top 25%, Above Median, Below Median, Bottom 25%
- **Quartile Scoring** - Top/bottom quartile benchmarks

### Comprehensive Reporting
- **10-Point Maturity Scale** with descriptive levels
- **Radar, Bar & Pie Charts** via Recharts
- **Gap Analysis** identifying critical weaknesses (score < 5/10)
- **Strength Identification** highlighting high-performing areas (score >= 7/10)
- **Risk Assessment** with impact/likelihood matrix
- **Prioritized Recommendations** (Critical/High/Medium/Low)
- **30-60-90 Day Action Plan** with objectives, actions, and expected outcomes
- **Executive Summary** auto-generated

### Advanced Export
- **PDF Export** - Professional multi-page report with PDFKit
- **Excel Export** - Multi-sheet workbook (Summary, Responses, Category Analysis)
- **CSV Export** - Raw data export for analysis tools
- **JSON API Export** - Full assessment data via REST

### Action Plan Execution
- **Kanban-Style Tracking** - Todo, In Progress, Review, Done statuses
- **Assignee Management** - Assign action items to team members
- **Priority & Due Dates** - Track deadlines and urgency
- **Burn-Down Data** - Monitor remediation velocity
- **Progress Tracking** - Percentage completion per item

### Integration Hub
- **Webhooks** - Event-driven notifications to external systems
- **Jira Integration** - Create issues from action items (mock/ready for real API)
- **Slack Notifications** - Send alerts to channels (mock/ready for real API)
- **JSON/API Export** - Full data export for any integration

### Assessment Templates
- **6 Pre-built Templates**: Comprehensive IT, Cloud Maturity, Cybersecurity, DevOps, Vendor Risk, Digital Transformation
- **Industry-Specific** - Templates filtered by industry
- **Custom Templates** - Create your own assessment configurations

### Knowledge Base
- **Best Practices Library** - Articles linked to assessment categories
- **Search & Filter** - Find relevant guidance by category/keyword
- **CRUD Management** - Create, update, publish articles
- **Starter Content** - 5 pre-built articles covering ITSM, Cloud, Security, Teams

### Gamification & Engagement
- **8 Badges** - First Assessment, Pro, Master, High Achiever, Perfect Score, Collaborator, Evidence Collector, Quick Start
- **Points System** - Earn points for achievements
- **Leaderboard** - Ranked user engagement
- **Auto-Award** - Badges automatically checked and awarded

### Assessment Dimensions

#### People (27 questions)
- Leadership & Governance
- Skills & Competencies
- Team Structure & Organization
- Culture & Change Management
- Training & Development

#### Process (32 questions)
- ITSM & Service Management
- Project Management
- Security Processes
- DevOps & Automation
- Compliance & Risk Management
- Documentation & Knowledge Management

#### Technology (41 questions)
- Infrastructure & Network
- Cloud & Virtualization
- Security Technology
- Data Management & Storage
- Applications & Software
- Disaster Recovery
- Monitoring & Observability
- End User Computing

### Rating Scale (1-10)

| Score | Level | Description |
|-------|-------|-------------|
| 1 | Non-Existent | No capability or process exists |
| 2 | Initial | Ad hoc, reactive with no formal structure |
| 3 | Developing | Basic processes emerging but inconsistent |
| 4 | Repeatable | Processes exist and followed in most cases |
| 5 | Defined | Standardized and documented across the organization |
| 6 | Managed | Measured with KPIs and actively managed |
| 7 | Effective | Consistently delivering expected outcomes |
| 8 | Integrated | Fully integrated with business strategy and goals |
| 9 | Optimizing | Continuous improvement with proactive innovation |
| 10 | World-Class | Industry-leading practices setting benchmarks |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Frontend | React 18 + React Router |
| Charts | Recharts |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| PDF Generation | PDFKit |
| Excel Export | xlsx (SheetJS) |
| HTTP Client | Axios |
| Styling | Custom CSS (Enterprise UI) |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Seed the question bank
npm run seed

# Start the server
npm run server

# In a separate terminal, start the client
npm run client
```

### Default Admin Credentials
```
Email: admin@assessment.local
Password: admin123
```

### Quick Start
1. Open http://localhost:3000
2. Login or register an account
3. Create an Account (organization to assess)
4. Define Assessment Scope (select tech stack, focus areas, template)
5. Start Assessment (answer questions using 1-10 rating scale)
6. Complete & Generate Report (view comprehensive analysis)
7. Export as PDF/Excel/CSV
8. Track action items and remediation progress

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/auth/users` | List users (admin) |
| PUT | `/api/auth/users/:id/role` | Change role (admin) |

### Core Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/accounts` | Manage accounts |
| GET/POST | `/api/assessments/scopes` | Assessment scopes |
| POST | `/api/assessments/start` | Start new assessment |
| POST | `/api/assessments/:id/responses` | Submit responses |
| POST | `/api/assessments/:id/complete` | Complete assessment |
| GET | `/api/questions` | Query question bank |

### Reporting & Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/generate/:id` | Generate report |
| GET | `/api/reports/:id` | Get report details |
| GET | `/api/export/pdf/:reportId` | Download PDF |
| GET | `/api/export/excel/:assessmentId` | Download Excel |
| GET | `/api/export/csv/:assessmentId` | Download CSV |

### Enterprise Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/collaboration/comments` | Comments |
| POST | `/api/collaboration/assignments` | Assign sections |
| POST | `/api/evidence/upload` | Upload evidence |
| GET | `/api/compliance/frameworks` | List frameworks |
| GET | `/api/compliance/gap-report/:id` | Compliance gap report |
| GET/POST | `/api/action-items` | Manage action items |
| GET | `/api/action-items/burndown/:id` | Burn-down data |
| GET | `/api/benchmarks/compare/:id` | Benchmark comparison |
| GET/POST | `/api/risks` | Risk register |
| POST | `/api/risks/roi-calculate` | ROI calculator |
| GET/POST | `/api/integrations/webhooks` | Manage webhooks |
| POST | `/api/integrations/jira/create-issue` | Create Jira issue |
| POST | `/api/integrations/slack/notify` | Send Slack notification |
| GET | `/api/knowledge-base` | Browse articles |
| GET | `/api/templates` | Assessment templates |
| GET | `/api/gamification/badges` | All badges |
| GET | `/api/gamification/leaderboard` | Leaderboard |
| GET | `/api/audit-log` | Audit trail |

## Architecture

```
├── server/
│   ├── index.js                 # Express server + seed functions
│   ├── models/database.js       # SQLite schema (20+ tables)
│   ├── middleware/auth.js       # JWT authenticate + authorize
│   ├── routes/
│   │   ├── auth.js              # Authentication & user management
│   │   ├── accounts.js          # Account CRUD
│   │   ├── assessments.js       # Assessment lifecycle
│   │   ├── questions.js         # Question bank
│   │   ├── reports.js           # Report generation
│   │   ├── exportReport.js      # PDF/Excel/CSV export
│   │   ├── collaboration.js     # Comments, assignments, notifications
│   │   ├── evidence.js          # File upload/download
│   │   ├── compliance.js        # Frameworks & gap reports
│   │   ├── benchmarks.js        # Industry benchmarking
│   │   ├── actionItems.js       # Action plan execution
│   │   ├── riskRegister.js      # Risk management & ROI
│   │   ├── integrations.js      # Webhooks, Jira, Slack
│   │   ├── knowledgeBase.js     # Best practices articles
│   │   ├── templates.js         # Assessment templates
│   │   ├── gamification.js      # Badges & leaderboard
│   │   └── auditLog.js          # Activity tracking
│   ├── services/
│   │   ├── assessmentEngine.js  # Question selection & scoring
│   │   └── reportEngine.js      # Report, recommendations, action plan
│   ├── uploads/                 # Evidence file storage
│   └── data/
│       └── seed.js              # Question bank seed data
├── client/
│   ├── src/
│   │   ├── App.js               # Router & navigation
│   │   ├── pages/               # Page components (7 pages)
│   │   ├── services/api.js      # API client (Axios)
│   │   └── App.css              # Enterprise UI styles
│   └── public/
└── package.json
```

## Database Schema (20+ Tables)

- `users` - Authentication & profiles
- `accounts` - Client organizations
- `assessment_scopes` - Scope definitions
- `questions` - Question bank (100+)
- `assessments` - Assessment sessions
- `responses` - Question responses
- `reports` - Generated reports
- `comments` - Collaborative discussions
- `assessment_assignments` - Section assignments
- `evidence` - File attachments
- `compliance_frameworks` - Framework definitions (8)
- `compliance_controls` - Controls (40+)
- `question_control_mapping` - Q-to-control links
- `action_items` - Remediation tasks
- `risk_register` - Risk entries
- `industry_benchmarks` - Peer comparison data
- `webhooks` - Integration configs
- `notifications` - User notifications
- `badges` - Achievement definitions (8)
- `user_badges` - Earned badges
- `knowledge_base` - Best practice articles
- `assessment_templates` - Template configs (6)
- `scheduled_assessments` - Recurring schedules
- `audit_log` - Activity trail

## License

MIT
