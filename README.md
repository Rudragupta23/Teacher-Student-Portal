# Teacher-Student Portal

A full-stack web application designed to simplify homework management and communication between teachers and students. Teachers can create assignments, upload homework, review submissions, and monitor student performance, while students can access assignments, submit homework, and receive feedback.

---

## 🚀 Features

### 👨‍🏫 Teacher (Admin)

- Secure authentication and login
- Create, update, and delete assignments
- Upload homework and study materials
- View student submissions
- Track student performance
- Manage students and assignments
- Provide feedback and grades

### 👨‍🎓 Student

- Secure authentication and login
- View assigned homework
- Submit assignments online
- Track submission status
- View grades and feedback
- Access previous submissions

### 📊 Dashboard

- Assignment tracking
- Submission management
- Student progress monitoring
- Performance overview

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Authentication
- JWT (JSON Web Token)

### Version Control
- Git & GitHub

---

## 📂 Project Structure

```text
Teacher-Student-Portal/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.js
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   └── server.js
│
├── README.md
├── package.json
└── .gitignore
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Rudragupta23/Teacher-Student-Portal.git

cd Teacher-Student-Portal
```

### 2. Install Backend Dependencies

```bash
cd server

npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client

npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside the server folder.

```env
PORT=your_port_number

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
```

---

## ▶️ Running the Application

### Start Backend

```bash
cd server

node server.js
```

### Start Frontend

```bash
cd client

npm run dev
```


## 📖 System Workflow

### Teacher Workflow

1. Login as Teacher.
2. Create homework assignments.
3. Assign homework to students.
4. Review submitted assignments.
5. Provide marks and feedback.

### Student Workflow

1. Login as Student.
2. View assigned homework.
3. Complete and upload assignments.
4. Check submission status.
5. View grades and feedback.

---

## 🎯 Future Enhancements

- AI-powered homework evaluation
- Plagiarism detection
- Real-time notifications
- Assignment deadline reminders
- Student leaderboard
- Email notifications
---
