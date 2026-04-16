const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TaskFlow Dark API is running' });
});

// API endpoints placeholder for future expansion
app.get('/api/tasks', (req, res) => {
  res.json({ 
    message: 'Tasks endpoint - would connect to database in production',
    note: 'Currently using localStorage in frontend'
  });
});

app.post('/api/tasks', (req, res) => {
  res.json({ 
    message: 'Create task endpoint - would save to database in production',
    note: 'Currently using localStorage in frontend'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TaskFlow Dark backend running on port ${PORT}`);
});