# Enterprise IT Infrastructure Assessment Platform

A comprehensive full-stack application for conducting deep-dive assessments of IT infrastructure across **People**, **Process**, and **Technology** dimensions.

## Features

### Core Capabilities
- **Account Management** - Create and manage client organizations with industry, size, and contact details
- **Assessment Scope Definition** - Define what to assess including technology stack, departments, infrastructure type, and focus areas
- **Dynamic Question Bank** - 100+ weighted questions across People, Process, and Technology categories
- **Automated Assessment Engine** - Generates tailored questions based on scope configuration
- **Comprehensive Reporting** - Detailed reports with scores, graphs, maturity levels, and gap analysis
- **30-60-90 Day Action Plans** - Structured improvement roadmap with prioritized recommendations

### Assessment Dimensions

#### People
- Leadership & Governance
- Skills & Competencies
- Team Structure & Organization
- Culture & Change Management
- Training & Development

#### Process
- ITSM & Service Management
- Project Management
- Security Processes
- DevOps & Automation
- Compliance & Risk Management
- Documentation & Knowledge Management

#### Technology
- Infrastructure & Network
- Cloud & Virtualization
- Security Technology
- Data Management & Storage
- Applications & Software
- Disaster Recovery
- Monitoring & Observability
- End User Computing

### Reporting
- **Maturity Level Assessment** (1-5 scale: Initial to Optimizing)
- **Radar & Bar Charts** for visual score representation
- **Gap Analysis** identifying critical weaknesses
- **Strength Identification** highlighting high-performing areas
- **Risk Assessment** with impact/likelihood matrix
- **Prioritized Recommendations** (Critical/High/Medium/Low)
- **30-60-90 Day Action Plan** with objectives, actions, and expected outcomes

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Frontend | React 18 + React Router |
| Charts | Recharts |
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

### Quick Start
1. Open http://localhost:3000
2. Create an Account (organization to assess)
3. Define Assessment Scope (select tech stack, focus areas)
4. Start Assessment (answer questions using 1-5 rating scale)
5. Complete & Generate Report (view comprehensive analysis)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/accounts` | Manage accounts |
| GET/POST | `/api/assessments/scopes` | Assessment scopes |
| POST | `/api/assessments/start` | Start new assessment |
| POST | `/api/assessments/:id/responses` | Submit responses |
| POST | `/api/assessments/:id/complete` | Complete assessment |
| POST | `/api/reports/generate/:id` | Generate report |
| GET | `/api/reports/:id` | Get report details |
| GET | `/api/questions` | Query question bank |

## Architecture

```
├── server/
│   ├── index.js                 # Express server entry
│   ├── models/database.js       # SQLite schema & connection
│   ├── routes/
│   │   ├── accounts.js          # Account CRUD
│   │   ├── assessments.js       # Assessment management
│   │   ├── questions.js         # Question bank
│   │   └── reports.js           # Report generation
│   ├── services/
│   │   ├── assessmentEngine.js  # Question selection & scoring
│   │   └── reportEngine.js      # Report, recommendations, action plan
│   └── data/
│       └── seed.js              # Question bank seed data
├── client/
│   ├── src/
│   │   ├── App.js               # Router & navigation
│   │   ├── pages/               # Page components
│   │   ├── services/api.js      # API client
│   │   └── App.css              # Enterprise UI styles
│   └── public/
└── package.json
```

## License

MIT
