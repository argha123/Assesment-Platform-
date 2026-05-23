const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, getDb } = require('./models/database');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const assessmentRoutes = require('./routes/assessments');
const questionRoutes = require('./routes/questions');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize database
initializeDatabase();

// Seed default admin user
const db = getDb();
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@assessment.local');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), 'System Admin', 'admin@assessment.local', hash, 'admin');
  console.log('Default admin user created (admin@assessment.local / admin123)');
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/reports', reportRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`IT Assessment Platform Server running on port ${PORT}`);
});

module.exports = app;
