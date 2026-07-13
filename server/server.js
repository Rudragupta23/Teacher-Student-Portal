require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const announcementRoutes = require('./routes/announcementRoutes');
const messageRoutes = require('./routes/messageRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const classPlannerRoutes = require('./routes/classPlannerRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

// Setup JSON limits 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/parent', require('./routes/parentRoutes'));
app.use('/api/homework', require('./routes/homeworkRoutes'));
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/scheme', require('./routes/schemeRoutes'));
app.use('/api/drive-links', require('./routes/driveRoutes'));
app.use('/api/planner', classPlannerRoutes);
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/topics', require('./routes/topicProgressRoutes'));
require('./jobs/reminderJob');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});