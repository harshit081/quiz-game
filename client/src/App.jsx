import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminQuizzes from './pages/AdminQuizzes';
import AdminAttempts from './pages/AdminAttempts';
import QuizAttempt from './pages/QuizAttempt';
import QuizResult from './pages/QuizResult';
import StudentAttempts from './pages/StudentAttempts';
import QuizLeaderboard from './pages/QuizLeaderboard';

const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <header className="nav">
      <div className="logo">
        <Link to="/">QuizForge</Link>
      </div>
      <nav className="nav-links">
        {user ? (
          <>
            <Link to="/">Dashboard</Link>
            <Link to="/attempts">My Attempts</Link>
            {user.role === 'admin' && (
              <>
                <Link to="/admin/quizzes">Admin</Link>
                <Link to="/admin/attempts">Attempts</Link>
              </>
            )}
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
      </nav>
    </header>
  );
};

const AppLayout = () => (
  <div className="app-shell">
    <Navigation />
    <main>
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
        <Route path="/result" element={(
          <ProtectedRoute>
            <QuizResult />
          </ProtectedRoute>
        )} />
        <Route path="/attempts" element={(
          <ProtectedRoute>
            <StudentAttempts />
          </ProtectedRoute>
        )} />
        <Route path="/admin/quizzes" element={(
          <ProtectedRoute requireAdmin>
            <AdminQuizzes />
          </ProtectedRoute>
        )} />
        <Route path="/admin/attempts" element={(
          <ProtectedRoute requireAdmin>
            <AdminAttempts />
          </ProtectedRoute>
        )} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </div>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
