import { Link, useLocation } from 'react-router-dom';
import { FiBarChart2, FiFileText, FiTrendingUp, FiUsers, FiBookOpen, FiHelpCircle, FiClipboard } from 'react-icons/fi';
import { useAuth } from '../auth.jsx';
import '../styles/sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const studentLinks = [
    { path: '/', label: 'Dashboard', icon: <FiBarChart2 /> },
    { path: '/global-quizzes', label: 'Quizzes', icon: <FiFileText /> },
    { path: '/attempts', label: 'My Attempts', icon: <FiTrendingUp /> },
    { path: '/groups', label: 'Groups', icon: <FiUsers /> },
  ];

  const teacherLinks = [
    { path: '/', label: 'Dashboard', icon: <FiBarChart2 /> },
    { path: '/admin/quizzes', label: 'My Quizzes', icon: <FiBookOpen /> },
    { path: '/question-bank', label: 'Question Bank', icon: <FiHelpCircle /> },
    { path: '/groups', label: 'Groups', icon: <FiUsers /> },
  ];

  const adminLinks = [
    { path: '/', label: 'Dashboard', icon: <FiBarChart2 /> },
    { path: '/admin/quizzes', label: 'All Quizzes', icon: <FiBookOpen /> },
    { path: '/admin/attempts', label: 'All Attempts', icon: <FiClipboard /> },
    { path: '/groups', label: 'Groups', icon: <FiUsers /> },
  ];

  let links = studentLinks;
  if (user?.role === 'teacher') {
    links = teacherLinks;
  } else if (user?.role === 'admin') {
    links = adminLinks;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo"><FiBookOpen size={24} /></div>
        <div>
          <h3>QuizForge</h3>
          <p>{user?.role || 'User'}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`sidebar-link ${isActive(link.path) ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{link.icon}</span>
            <span className="sidebar-label">{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || '?'}</div>
          <div>
            <p className="user-name">{user?.name}</p>
            <p className="user-email">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
