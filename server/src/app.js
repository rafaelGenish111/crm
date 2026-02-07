const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.VITE_API_URL?.replace('/api', ''),
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
    ].filter(Boolean); // Remove undefined values

    // Allow any localhost port in development
    if (process.env.NODE_ENV === 'development' && origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM API is running' });
});

// Business Configuration Routes
const configRoutes = require('./routes/configRoutes');
app.use('/api/config', configRoutes);

// Authentication Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// User Management Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Leads Routes
const leadRoutes = require('./routes/leadRoutes');
app.use('/api/leads', leadRoutes);

// Customers Routes
const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customers', customerRoutes);

// Courses Routes
const courseRoutes = require('./routes/courseRoutes');
app.use('/api/courses', courseRoutes);

// Workshops Routes
const workshopRoutes = require('./routes/workshopRoutes');
app.use('/api/workshops', workshopRoutes);

// Accounting Routes
const accountingRoutes = require('./routes/accountingRoutes');
app.use('/api/accounting', accountingRoutes);

// Campaigns Routes
const campaignRoutes = require('./routes/campaignRoutes');
app.use('/api/campaigns', campaignRoutes);

// Popup Routes (public and protected)
const popupRoutes = require('./routes/popupRoutes');
app.use('/api/popup', popupRoutes);

// WhatsApp Routes
const whatsappRoutes = require('./routes/whatsappRoutes');
app.use('/api/whatsapp', whatsappRoutes);

// Payment Routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

// Attendance Routes
const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/api/attendance', attendanceRoutes);

// Exams Routes
const examRoutes = require('./routes/examRoutes');
app.use('/api/exams', examRoutes);

// Student Routes
const studentRoutes = require('./routes/studentRoutes');
app.use('/api/student', studentRoutes);

// AI Bot Routes (for students)
const aiBotRoutes = require('./routes/aiBotRoutes');
app.use('/api/student/ai-bot', aiBotRoutes);

// Knowledge Base Routes (for admins)
const knowledgeBaseRoutes = require('./routes/knowledgeBaseRoutes');
app.use('/api/knowledge-base', knowledgeBaseRoutes);

// Events Routes
const eventRoutes = require('./routes/eventRoutes');
app.use('/api/events', eventRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
