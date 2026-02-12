# Online Quiz System

A MERN-based online quiz platform with admin and student roles, timed quizzes, auto-evaluation, and instant results.

## Features
- Session-based authentication with admin/student roles
- Admin quiz creation, edit, enable/disable, and attempt review
- Student quiz attempts with timer and auto-submit
- Instant results with correct/incorrect breakdown
- Admin dashboard chart summary

## Tech Stack
- Frontend: React (Vite), Chart.js
- Backend: Node.js, Express, Mongoose
- Database: MongoDB

## Getting Started (Local)

### 1) Backend
1. Create a `.env` file in `server` using `server/.env.example`.
2. Start the API:

```bash
cd server
npm run dev
```

### 2) Frontend
1. Create a `.env` file in `client` using `client/.env.example`.
2. Start the client:

```bash
cd client
npm run dev
```

## Admin Registration
To register an admin, set `ADMIN_SECRET` in `server/.env` and provide it during registration.

## Deployment

### Backend (Render)
- Create a new Web Service.
- Build command: `npm install`
- Start command: `npm start`
- Root directory: `server`
- Add environment variables from `server/.env.example`.

### Frontend (Vercel)
- Create a new project from the repository.
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_API_URL` pointing to your backend URL (for example, `https://your-backend.onrender.com/api`).

## Notes
- Use MongoDB Atlas for a managed database in production.
- Update `CLIENT_ORIGIN` in the backend environment to match your frontend URL.
