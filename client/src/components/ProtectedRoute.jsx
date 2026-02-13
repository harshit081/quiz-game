import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const ProtectedRoute = ({ children, requireAdmin = false, requireStaff = false, requireStudent = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="panel loading-card">
        <div className="spinner" />
        <p className="muted">Preparing your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requireStaff && !['admin', 'teacher'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requireStudent && user.role !== 'student') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
