# 🎓 MathCom Mentors | Classroom Portal

MathCom Mentors is a full-stack MERN educational platform built to centralize the digital classroom. It provides secure, role-based dashboards for teachers, students, graders, and parents to manage assignments, track academic progress, and streamline communication in one place.

[![Website](https://img.shields.io/badge/Website-mathcommentors.com-blue?style=for-the-badge&logo=google-chrome)](https://mathcommentors.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**🚀 Live Platform:** [https://mathcommentors.com/](https://mathcommentors.com/)

## 🌟 Comprehensive Feature Breakdown

| Category | Feature | Description | Accessible Roles |
| :--- | :--- | :--- | :--- |
| **Security & Auth** | **Role-Based Access (RBAC)** | Strict access control ensuring users only see dashboards and data relevant to their specific role. | All Users |
| | **JWT Authentication** | Secure, stateless session management and protected API endpoints using JSON Web Tokens. | All Users |
| | **Secure Password Recovery** | Automated email system using Nodemailer to send encrypted password reset links. | All Users |
| **Dashboards** | **Admin Control Center** | Complete system oversight, user account creation/management, and platform-wide configuration. | Admin |
| | **Teacher Workspace** | Hub for creating classes, tracking syllabus progress, and monitoring overall class performance. | Teacher |
| | **Student Portal** | Personalized view of pending tasks, submitted work, grades, and upcoming deadlines. | Student |
| | **Parent Hub** | Real-time tracking of their child's attendance, grades, and teacher feedback. | Parent |
| | **Grader Interface** | Dedicated pipeline for reviewing submissions, assigning marks, and writing feedback. | Grader |
| **Academic Tools** | **Homework Management** | End-to-end system to create, distribute, submit, and evaluate digital assignments. | Teacher, Student, Grader |
| | **Resource Library** | Centralized repository for uploading study materials, PDFs, and Google Drive links. | Teacher, Student |
| | **Class Planner / Scheme** | Tools to map out the curriculum, schedule upcoming lessons, and track syllabus completion. | Admin, Teacher |
| | **Question Bank Integration** | Upload and manage standardized questions for assignments and evaluations. | Admin, Teacher |
| **Communication** | **Targeted Announcements** | Broadcast important updates system-wide or to specific classes/roles. | Admin, Teacher, Student |
| | **Internal Messaging** | Secure direct communication channel connecting educators with parents. | Teacher, Parent |
| | **Contextual Feedback** | Attach specific, constructive comments directly to a student's graded submission. | Teacher, Grader, Student |
| **Automation** | **CRON Job Reminders** | Background server tasks that automatically detect approaching deadlines and send warning emails. | Student, Parent |
| | **Automated Alerts** | Instant email notifications triggered by new assignments or newly published grades. | Student, Parent |

## 🎭 User Roles & Dashboards

| Role | Capabilities & Access |
| :--- | :--- |
| **👨‍🏫 Teacher/Admin** | Creates classes, assigns homework, uploads study materials, publishes announcements, monitors student performance, and communicates with parents. |
| **📝 Grader** | Reviews and grades student submissions, provides constructive feedback, and tracks overall assignment completion rates. |
| **🎓 Student** | Views upcoming assignments, submits homework, accesses study resources, checks grades, tracks personal academic progress, and receives automated reminders. |
| **👪 Parent** | Monitors their child’s attendance, grades, homework status, teacher feedback, and overall academic performance in real-time. |

---

## 🛠️ Technology Stack

### **Frontend**
- **React.js** (UI Development)
- **Vite** (Next-generation frontend tooling)
- **Tailwind CSS** (Utility-first styling)
- **React Router DOM** (Application routing)
- **Axios** (API communication)
- **Framer Motion** (Smooth UI animations)

### **Backend**
- **Node.js & Express.js** (Server & API architecture)
- **MongoDB & Mongoose** (Database & Object Data Modeling)
- **JSON Web Tokens (JWT)** (Authentication)
- **Bcrypt.js** (Password hashing)
- **Nodemailer** (Email integration)
- **Node-Cron** (Automated background tasks)

---

# 📂 Exact Project Structure

## Frontend: React Client App

The `client/` directory contains the Vite-powered React application with Tailwind CSS for styling.

```text
client/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── index.html
├── public/
│   └── mathcom-logo.png
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── App.css
    ├── services/
    │   └── api.js
    ├── context/
    │   └── AuthContext.jsx
    ├── components/
    │   ├── common/
    │   │   └── ProtectedRoute.jsx
    │   └── admin/
    │       ├── AssignHomework.jsx
    │       └── UploadQuestion.jsx
    └── pages/
        ├── auth/
        │   └── AuthPage.jsx
        ├── home/
        │   └── HomePage.jsx
        ├── admin/
        │   └── AdminDashboard.jsx
        ├── student/
        │   └── StudentDashboard.jsx
        └── parent/
            └── ParentDashboard.jsx
```
## Backend: Node/Express Server

The `server/` directory contains the REST API architecture, database models, and business logic.

```text
server/
├── server.js
├── package.json
├── config/
│   └── db.js
├── models/
│   ├── Announcement.js
│   ├── Assignment.js
│   ├── DriveLink.js
│   ├── Homework.js
│   ├── Message.js
│   ├── Question.js
│   ├── Resource.js
│   ├── Scheme.js
│   └── User.js
├── controllers/
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
├── routes/
│   ├── adminRoutes.js
│   ├── announcementRoutes.js
│   ├── authRoutes.js
│   ├── driveRoutes.js
│   ├── homeworkRoutes.js
│   ├── messageRoutes.js
│   ├── parentRoutes.js
│   ├── resourceRoutes.js
│   ├── schemeRoutes.js
│   └── studentRoutes.js
├── middlewares/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
├── jobs/
│   └── reminderJob.js
└── utils/
    └── sendEmail.js
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

# 📄 License

This project is intended for educational purposes.

---
