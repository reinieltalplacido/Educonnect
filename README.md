# 🎓 EduConnect – A Role-Based Learning Platform

**EduConnect** is a web-based platform that connects teachers and students in an organized, real-time learning environment. Built for flexibility, simplicity, and real-world school needs — it offers dynamic course management, messaging, and role-based access using Firebase.

> 🏁 **This project was developed as my Final Project** for our Web Systems & Technologies subject at **NEUST – Bachelor of Science in Information Technology (BSIT), 3rd Year**.

---

## 🚀 Features

### 🔐 Authentication & User Roles
- Firebase Email/Password Auth
- Multi-step signup:
  - **Students** upload COR (Certificate of Registration)
  - **Teachers** upload COE (Certificate of Employment)

### 📚 Course Management (Teachers)
- Create, Edit, and Delete Courses
- Manage title, section, code, and description
- Invite students by email
- Tabbed course view:  
  - Lessons  
  - Assignments  
  - Files  
  - Announcements  
  - Quizzes  
  - Students

### 🧑‍🎓 Student Dashboard
- See enrolled courses
- Access all course content via tabs
- Updates in real-time via Firestore listeners

### 💬 Messaging System
- Real-time chat (Firestore-powered)
- One-to-one contact per course

### 🔔 Notifications
- Dashboard shows real-time alerts for messages and updates

---

## 🧰 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Firebase**:
  - Firebase Auth
  - Firestore Database
  - Firebase Storage (for COR/COE uploads)
- **Version**: Modular SDK v9.22.1 and v11.6.0
