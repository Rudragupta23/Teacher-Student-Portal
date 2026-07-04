# Teacher-Student-Parent-Grader Portal

A full-stack MERN (MongoDB, Express, React, Node.js) educational platform designed to streamline communication, resource sharing, and academic tracking between teachers, students, graders and parents.

---

## 🌟 Comprehensive Feature Breakdown

| Feature Category | Specific Capabilities |
| :--- | :--- |
| **Authentication & Account Security** | Secure user registration, JWT-based authentication, encrypted passwords, secure session handling, role-based login, password reset, email verification, and protected routes. |
| **Role-Based Access Control (RBAC)** | Dedicated permission levels for Admin, Teacher, Student, Parent, and Grader ensuring each user accesses only authorized features and data. |
| **Admin Dashboard** | Complete system management including user administration, class management, announcements, resources, reports, academic monitoring, and platform configuration. |
| **Teacher Dashboard** | Manage classes, create assignments, upload study materials, publish announcements, monitor student performance, communicate with parents, and evaluate submissions. |
| **Student Dashboard** | View assignments, submit homework, access learning resources, check grades, receive notifications, track academic progress, and communicate with teachers. |
| **Parent Dashboard** | Monitor child’s attendance, grades, assignments, homework status, announcements, teacher feedback, notifications, and overall academic performance. |
| **Grader Dashboard** | Review student submissions, evaluate assignments, assign marks, provide detailed feedback, maintain grading history, and assist teachers in assessments. |
| **User Profile Management** | Personalized profiles with profile picture, contact information, password management, and editable personal details for every user role. |
| **Class & Subject Management** | Create and organize classes, subjects, academic sections, semesters, and allocate teachers and students accordingly. |
| **Homework & Assignment Management** | Teachers can create assignments with due dates, instructions, attachments, grading criteria, and assign them to specific students or entire classes. |
| **Assignment Submission System** | Students can upload assignments, resubmit before deadlines, view submission history, and receive grading feedback after evaluation. |
| **Question Bank Management** | Create, categorize, edit, import, and reuse questions for quizzes, tests, assignments, and examinations. |
| **Quiz & Assessment Support** | Conduct quizzes, objective tests, descriptive assessments, and evaluate student performance with automated or manual grading. |
| **Grading & Evaluation System** | Grade assignments, provide comments, calculate total marks, maintain grade history, and generate performance reports. |
| **Academic Performance Tracking** | Monitor student progress using grades, assignment completion rates, quiz performance, and overall academic statistics. |
| **Learning Progress Analytics** | Interactive dashboards displaying assignment completion, academic growth, grades, attendance, and learning trends through visual statistics. |
| **Adaptive Learning Engine** | Intelligent recommendation system that adjusts learning difficulty and suggests additional practice based on student performance. |
| **Study Resource Management** | Upload, organize, categorize, download, and share notes, PDFs, presentations, videos, worksheets, and reference materials. |
| **Google Drive Integration** | Store and share large educational resources securely through Google Drive integration and external cloud links. |
| **Curriculum & Scheme Management** | Manage syllabus, lesson plans, schemes of work, curriculum progress, and teaching schedules for different classes. |
| **Announcements System** | Publish school-wide, class-specific, subject-specific, or role-specific announcements with instant visibility. |
| **Internal Messaging System** | Secure messaging platform supporting communication between Teachers, Students, Parents, Graders, and Administrators. |
| **Notification Center** | Real-time notifications for assignments, deadlines, grades, announcements, messages, and important academic updates. |
| **Email Notification System** | Automated emails for assignment reminders, grade updates, announcements, account verification, password reset, and important alerts. |
| **Automated Reminder System** | Background scheduled jobs automatically notify users about upcoming deadlines, overdue assignments, unread messages, and academic events. |
| **Document & File Management** | Upload, organize, preview, download, and manage academic documents and educational files securely. |
| **Search & Filtering** | Powerful search functionality with advanced filtering for assignments, students, teachers, resources, announcements, and messages. |
| **Calendar & Academic Schedule** | Display assignment deadlines, examinations, holidays, academic events, and important schedules using an integrated calendar. |
| **Feedback & Remarks System** | Teachers and graders can provide personalized remarks, suggestions, improvement notes, and performance feedback for students. |
| **Parent-Teacher Communication** | Dedicated communication channel allowing parents and teachers to discuss student progress and academic concerns. |
| **Student Progress Reports** | Generate comprehensive academic reports including grades, attendance, assignments, feedback, and performance summaries. |
| **Performance Dashboard** | Visual charts and statistics displaying assignment completion, attendance percentage, academic scores, and grading trends. |
| **Secure REST API** | Fully structured RESTful API architecture with authentication, authorization, validation, and error handling. |
| **Database Management** | Efficient MongoDB schema design with optimized relationships, indexing, and scalable data management. |
| **Responsive User Interface** | Fully responsive interface optimized for desktops, tablets, and mobile devices using React and Tailwind CSS. |
| **Cloud-Ready Architecture** | Easily deployable using MongoDB Atlas, Render, Vercel, AWS, or any cloud hosting platform. |
| **Scalable MERN Architecture** | Modular project structure following industry-standard MERN practices with reusable components and clean separation of concerns. |
| **Security Features** | Password hashing, JWT authentication, protected APIs, middleware validation, input sanitization, secure routing, and role-based authorization. |


---

# 📂 Exact Project Structure

## Frontend: React Client App

The `client/` directory contains the Vite-powered React application with Tailwind CSS for styling.

```text
client/
├── package.json               # Frontend dependencies and scripts
├── vite.config.js             # Vite bundler configuration
├── tailwind.config.js         # Tailwind CSS styling parameters
├── postcss.config.js          # PostCSS configuration
├── eslint.config.js           # Linting rules
├── index.html                 # Main HTML template
├── public/
│   └── mathcom-logo.png       # Application logo assets
└── src/
    ├── main.jsx               # React application entry point
    ├── App.jsx                # Root component and routing setup
    ├── index.css              # Global CSS and Tailwind directives
    ├── App.css                # App-level styling
    ├── services/
    │   └── api.js             # Axios/fetch configuration for API calls
    ├── context/
    │   └── AuthContext.jsx    # Global state management for user authentication
    ├── components/
    │   ├── common/
    │   │   └── ProtectedRoute.jsx   # Route wrapper for unauthorized access prevention
    │   └── admin/
    │       ├── AssignHomework.jsx   # UI component for assigning homework
    │       └── UploadQuestion.jsx   # UI component for uploading test questions
    └── pages/
        ├── auth/
        │   └── AuthPage.jsx         # Login/Registration screens
        ├── home/
        │   └── HomePage.jsx         # Landing page
        ├── admin/
        │   └── AdminDashboard.jsx   # Teacher/Admin main view
        ├── student/
        │   └── StudentDashboard.jsx # Student main view
        └── parent/
            └── ParentDashboard.jsx  # Parent main view
```
## Backend: Node/Express Server

The `server/` directory contains the REST API architecture, database models, and business logic.

```text
server/
├── server.js                  # Express server initialization and middleware setup
├── package.json               # Backend dependencies
├── config/
│   └── db.js                  # Mongoose MongoDB connection setup
├── models/                    # Mongoose Database Schemas
│   ├── Announcement.js        # Schema for platform announcements
│   ├── Assignment.js          # Schema for student assignments
│   ├── DriveLink.js           # Schema for external cloud links
│   ├── Homework.js            # Schema for teacher-assigned homework
│   ├── Message.js             # Schema for user-to-user messages
│   ├── Question.js            # Schema for test/assessment questions
│   ├── Resource.js            # Schema for study materials
│   ├── Scheme.js              # Schema for academic schemes/syllabi
│   └── User.js                # Schema for users (Admin, Student, Parent)

├── controllers/               # Request Handlers & Business Logic
│   ├── adminController.js
│   ├── announcementController.js
│   ├── authController.js
│   ├── driveController.js
│   ├── homeworkController.js
│   ├── messageController.js
│   ├── parentController.js
│   ├── resourceController.js
│   ├── schemeController.js
│   └── studentController.js

├── routes/                    # API Endpoint Definitions
│   ├── adminRoutes.js         # Endpoints for /api/admin
│   ├── announcementRoutes.js  # Endpoints for /api/announcements
│   ├── authRoutes.js          # Endpoints for /api/auth
│   ├── driveRoutes.js         # Endpoints for /api/drive
│   ├── homeworkRoutes.js      # Endpoints for /api/homework
│   ├── messageRoutes.js       # Endpoints for /api/messages
│   ├── parentRoutes.js        # Endpoints for /api/parents
│   ├── resourceRoutes.js      # Endpoints for /api/resources
│   ├── schemeRoutes.js        # Endpoints for /api/schemes
│   └── studentRoutes.js       # Endpoints for /api/students

├── middlewares/
│   ├── authMiddleware.js      # Verifies JWT tokens
│   └── roleMiddleware.js      # Restricts route access based on user role

├── jobs/
│   └── reminderJob.js         # Scheduled background tasks (e.g., due date alerts)

└── utils/
    ├── adaptiveLogic.js       # Algorithms for personalized content pacing
    └── sendEmail.js           # Nodemailer integration for external communication
```

---

# ⚙️ Environment Variables Setup

To run this project locally, create a `.env` file inside the `server/` directory.

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string_here

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d

# Email Service (Nodemailer)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@teacherportal.com
```
# 🚀 Installation & Run Instructions

Follow these steps to get the application running on your local machine.

---

## 1. Clone the Repository

```bash
git clone https://github.com/rudragupta23/teacher-student-portal.git
cd Teacher-Student-Portal
```

---

## 2. Backend Setup

Navigate to the `server` directory, install dependencies, and start the development server.

```bash
cd server

# Install backend dependencies
npm install

# Start the development server
node server.js
```

The Express backend server will typically run on:

```
http://localhost:5000
```

---

## 3. Frontend Setup

Open a **new terminal**, navigate to the `client` directory, install dependencies, and start the Vite development server.

```bash
cd client

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```

The React frontend will typically run on:

```
http://localhost:5173
```

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Nodemailer
- Cron Jobs

---

# 🔐 Authentication & Authorization

- JWT-based Authentication
- Protected Routes
- Role-Based Access Control
- Secure Password Storage
- Session Management

---

# 📧 Email Integration

The platform supports email notifications using **Nodemailer** for:

- Password Reset
- Important Announcements
- Homework Notifications
- Reminder Emails

---

# ⏰ Automated Reminder System

A background CRON job continuously checks pending tasks and automatically sends reminder notifications for:

- Homework Deadlines
- Assignment Due Dates
- Important Announcements

---

# 📚 Main Modules

- Authentication
- Admin Dashboard
- Student Dashboard
- Parent Dashboard
- Homework Management
- Assignment Management
- Question Bank
- Messaging System
- Resource Sharing
- Announcement System
- Curriculum Management
- Google Drive Integration
- Email Notifications
- Reminder System

---

# 📄 License

This project is intended for educational purposes.

---
