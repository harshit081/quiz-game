import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { FiSun, FiMoon, FiBookOpen } from 'react-icons/fi';
import { AuthProvider, useAuth } from './auth.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminQuizzes from './pages/AdminQuizzes';
import AdminAttempts from './pages/AdminAttempts';
import QuizAttempt from './pages/QuizAttempt';
import QuizResult from './pages/QuizResult';
import StudentAttempts from './pages/StudentAttempts';
import QuizLeaderboard from './pages/QuizLeaderboard';
import GlobalQuizzes from './pages/GlobalQuizzes';
import Groups from './pages/Groups';
import QuizForm from './pages/QuizForm';
import QuestionBank from './pages/QuestionBank';

const Navigation = ({ theme, onToggleTheme }) => {
  const { user, logout } = useAuth();

  return (
    <header className="nav">
      <div className="logo">
        <Link to="/"><FiBookOpen style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> QuizForge</Link>
      </div>
      <nav className="nav-links">
        {user ? (
          <>
            <span className="nav-user">{user.name} · {user.role}</span>
            <button className="btn ghost" type="button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>
      </nav>
    </header>
  );
};

const AppLayout = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-shell">
      <Navigation theme={theme} onToggleTheme={toggleTheme} />
      <div className={`app-layout${user ? ' has-sidebar' : ''}`}>
        {user && <Sidebar />}
        <main className="app-main">
          <Routes>
            <Route path="/" element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/quiz/:id" element={(
              <ProtectedRoute>
                <QuizAttempt />
              </ProtectedRoute>
            )} />
            <Route path="/quiz/:id/leaderboard" element={(
              <ProtectedRoute>
                <QuizLeaderboard />
              </ProtectedRoute>
            )} />
            <Route path="/global-quizzes" element={(
              <ProtectedRoute>
                <GlobalQuizzes />
              </ProtectedRoute>
            )} />
            <Route path="/groups" element={(
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            )} />
            <Route path="/result" element={(
              <ProtectedRoute>
                <QuizResult />
              </ProtectedRoute>
            )} />
            <Route path="/attempts" element={(
              <ProtectedRoute requireStudent>
                <StudentAttempts />
              </ProtectedRoute>
            )} />
            <Route path="/admin/quizzes" element={(
              <ProtectedRoute requireStaff>
                <AdminQuizzes />
              </ProtectedRoute>
            )} />
            <Route path="/question-bank" element={(
              <ProtectedRoute requireStaff>
                <QuestionBank />
              </ProtectedRoute>
            )} />
            <Route path="/admin/quizzes/new" element={(
              <ProtectedRoute requireStaff>
                <QuizForm />
              </ProtectedRoute>
            )} />
            <Route path="/admin/quizzes/:id" element={(
              <ProtectedRoute requireStaff>
                <QuizForm />
              </ProtectedRoute>
            )} />
            <Route path="/admin/attempts" element={(
              <ProtectedRoute requireStaff>
                <AdminAttempts />
              </ProtectedRoute>
            )} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
