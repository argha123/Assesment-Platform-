const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./models/database');

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

// API Routes
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
