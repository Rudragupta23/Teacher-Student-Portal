require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your React frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'] // 👈 THIS IS THE MAGIC LINE
}));

// 2. Setup JSON limits (MUST BE EXACTLY LIKE THIS AND BEFORE ROUTES)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/homework', require('./routes/homeworkRoutes'));
// We will add admin and student routes here later
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/student', require('./routes/studentRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});