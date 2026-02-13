# Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
This document defines the requirements for the Online Quiz System. It is intended for developers, testers, and stakeholders who need a clear, verifiable description of the system behavior.

### 1.2 Scope
The system provides a web-based quiz platform with role-based access (Admin, Teacher, Student), quiz creation and management, timed attempts, automatic evaluation, result reporting, analytics, question bank reuse, access-code gated quizzes, group/class sharing, global quizzes, and export features.

### 1.3 Definitions, Acronyms, Abbreviations
- Admin: Superuser with full access to all data and configurations.
- Teacher: Staff user who can create and manage only their own quizzes and question bank.
- Student: User who can attempt quizzes and view their own results.
- Group/Class: A teacher-managed cohort of students with a join code.
- Quiz Attempt: A student’s submission for a quiz, including answers and score.
- Access Code: A code required to unlock a gated quiz.
- Global Quiz: A quiz available to all users without a group or code.

## 2. Overall Description
### 2.1 Product Perspective
The Online Quiz System is a MERN-based web application with a client (React) and server (Node/Express) connected to a MongoDB database.

### 2.2 User Classes and Characteristics
- Admin: Full system administration, analytics, and global oversight.
- Teacher: Creates quizzes, manages questions, views attempts for own quizzes.
- Student: Attempts quizzes, views results and attempt history.

### 2.3 Operating Environment
- Client: Modern browser (Chrome, Edge, Firefox).
- Server: Node.js runtime.
- Database: MongoDB (Atlas or local).

### 2.4 Design and Implementation Constraints
- Session-based authentication.
- Data persisted in MongoDB.
- Access to gated quizzes requires valid access codes.

### 2.5 Assumptions and Dependencies
- Users have reliable internet connectivity.
- MongoDB connectivity and access credentials are configured via environment variables.

## 3. Functional Requirements
### 3.1 Authentication and Authorization
- FR-1: The system shall allow users to register as Student, Teacher, or Admin.
- FR-2: The system shall require Admin registration using an admin secret.
- FR-3: The system shall allow Teacher registration without a teacher secret.
- FR-4: The system shall provide login and logout functionality.
- FR-5: The system shall enforce role-based access control for all protected routes.

### 3.2 Quiz Management (Admin/Teacher)
- FR-6: Admins and Teachers shall create quizzes with title, category, time limit, questions, and total marks.
- FR-7: Admins and Teachers shall edit their own quizzes; Admins may edit any quiz.
- FR-8: Admins and Teachers shall enable or disable quizzes.
- FR-9: Admins and Teachers shall delete their own quizzes; Admins may delete any quiz.
- FR-10: The system shall support access-code gated quizzes.
- FR-10a: The system shall support group-only quizzes that are visible only to group members.
- FR-10b: The system shall support global quizzes available to all users.

### 3.3 Question Bank
- FR-11: Admins and Teachers shall create and manage reusable questions in a question bank.
- FR-12: Admins and Teachers shall add question bank items to a quiz.
- FR-13: Admins can manage all questions; Teachers can manage only their own.
- FR-13a: Admins and Teachers shall create questions in personal or global scopes.
- FR-13b: The system shall allow searching the question bank by category.

### 3.4 Quiz Access and Attempts (Students)
- FR-14: Students shall view available quizzes.
- FR-15: Students shall unlock gated quizzes using an access code.
- FR-15a: Students shall view group-only quizzes only when they are members of the group.
- FR-16: Students shall attempt quizzes with one question displayed at a time.
- FR-17: The system shall enforce time limits and auto-submit at time expiry.
- FR-18: The system shall auto-evaluate quiz attempts and compute scores.
- FR-19: The system shall allow at most one attempt per quiz when single-attempt is enabled.
- FR-20: The system shall provide attempt history for students.

### 3.5 Results and Analytics
- FR-21: Students shall view results immediately after submission.
- FR-22: Admins and Teachers shall view attempts and scores for their quizzes.
- FR-23: The system shall provide a leaderboard per quiz.
- FR-24: Admins shall view system-level statistics.

### 3.6 Export
- FR-25: Admins and Teachers shall export attempts to CSV.

### 3.7 Autosave
- FR-26: The system shall autosave quiz answers locally during an attempt.
- FR-27: The system shall restore saved answers and remaining time after refresh.

## 4. Non-Functional Requirements
### 4.1 Performance
- NFR-1: The system should load dashboard content within 3 seconds under normal network conditions.

### 4.2 Security
- NFR-2: Passwords must be hashed before storage.
- NFR-3: Sessions must be HTTP-only cookies.
- NFR-4: Access codes must be stored as hashed values.

### 4.3 Reliability
- NFR-5: The system shall prevent duplicate attempts for single-attempt quizzes.

### 4.4 Usability
- NFR-6: The UI shall provide clear feedback on loading, errors, and submission status.

## 5. External Interfaces
### 5.1 User Interface
- Responsive web UI for students, teachers, and admins.

### 5.2 API Interfaces (Summary)
- /api/auth/register, /api/auth/login, /api/auth/logout
- /api/quizzes, /api/quizzes/:id, /api/quizzes/:id/attempt
- /api/quizzes/attempts/me
- /api/quizzes/:id/leaderboard
- /api/quizzes/access
- /api/admin/quizzes, /api/admin/attempts, /api/admin/attempts.csv
- /api/admin/questions
- /api/groups

## 6. Data Requirements
- Users: name, email, password hash, role.
- Quizzes: title, category, time limit, questions, access code hash, access type (global/group/code), groupId, status, createdBy.
- Attempts: user, quiz, answers, score, time taken, attempt date.
- Groups: name, join code, createdBy, members.
- Question bank: text, options, correct index, category, scope (global/personal), createdBy.

## 7. Future Enhancements
- Proctoring signals (tab-switch detection).
- Multi-tenant organizations.
- Advanced analytics dashboards.
