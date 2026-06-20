require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Allows frontend to communicate with backend
app.use(express.json()); // Allows parsing of JSON bodies

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