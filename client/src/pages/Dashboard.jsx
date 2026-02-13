import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHash, FiZap, FiBookOpen, FiBook, FiHelpCircle, FiMonitor, FiGlobe, FiFileText, FiClock, FiStar } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../auth.jsx';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get unique categories from quizzes
  const categories = Array.from(
    new Set(quizzes.map((q) => q.category).filter(Boolean))
  );
  const filteredQuizzes =
    selectedCategory === 'all'
      ? quizzes
      : quizzes.filter((q) => q.category === selectedCategory);

  useEffect(() => {
    const loadData = async () => {
      setQuizzesLoading(true);
      setQuizzesError('');
      try {
        const { data } = await api.get('/quizzes?scope=group');
        setQuizzes(data);
      } catch (err) {
        setQuizzesError('Unable to load quizzes right now.');
      } finally {
        setQuizzesLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      const loadStats = async () => {
        setStatsLoading(true);
        try {
          const { data } = await api.get('/admin/stats');
          setStats(data);
        } catch (err) {
          console.error('Failed to load stats:', err);
        } finally {
          setStatsLoading(false);
        }
      };

      loadStats();
    } else {
      setStatsLoading(false);
    }
  }, [user]);

  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    setAccessError('');
    if (!accessCode.trim()) {
      setAccessError('Enter a quiz access code.');
      return;
    }
    setAccessLoading(true);
    try {
      const { data } = await api.post('/quizzes/access', { code: accessCode.trim() });
      sessionStorage.setItem(`quiz_code_${data._id}`, accessCode.trim());
      navigate(`/quiz/${data._id}?code=${encodeURIComponent(accessCode.trim())}`);
    } catch (err) {
      setAccessError(err.response?.data?.message || 'Invalid access code.');
    } finally {
      setAccessLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      math: <FiHash />,
      science: <FiZap />,
      history: <FiBookOpen />,
      english: <FiBook />,
      general: <FiHelpCircle />,
      technology: <FiMonitor />,
      geography: <FiGlobe />,
    };
    return icons[category?.toLowerCase()] || <FiFileText />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      math: 'category-math',
      science: 'category-science',
      history: 'category-history',
      english: 'category-english',
      general: 'category-general',
      technology: 'category-tech',
      geography: 'category-geo',
    };
    return colors[category?.toLowerCase()] || 'category-general';
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome, {user?.name || 'Student'}!</h1>
          <p>Ready to test your knowledge? Select a quiz to begin.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-card">
            <div className="stat-number">{quizzes.length}</div>
            <div className="stat-label">Available Quizzes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats?.averageScore || '—'}</div>
            <div className="stat-label">Avg. Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats?.attemptsCount || 0}</div>
            <div className="stat-label">Attempts</div>
          </div>
        </div>
      </section>

      {/* Admin Stats Section */}
      {user?.role === 'admin' && (
        <section className="admin-stats">
          <h2>Platform Overview</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-value">{stats?.usersCount || 0}</div>
              <div className="stat-title">Total Users</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats?.quizCount || 0}</div>
              <div className="stat-title">Total Quizzes</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats?.attemptsCount || 0}</div>
              <div className="stat-title">Total Attempts</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats?.averageScore || '0'}%</div>
              <div className="stat-title">Avg Score</div>
            </div>
          </div>
        </section>
      )}

      {/* Access Code Section */}
      {user?.role === 'student' && (
        <section className="access-code-section">
          <h2>Access with Code</h2>
          <form className="access-form" onSubmit={handleAccessSubmit}>
            <input
              type="text"
              placeholder="Enter quiz access code..."
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="access-input"
            />
            <button
              type="submit"
              disabled={accessLoading}
              className="btn btn-primary"
            >
              {accessLoading ? 'Unlocking...' : 'Unlock Quiz'}
            </button>
          </form>
          {accessError && <div className="alert alert-error">{accessError}</div>}
        </section>
      )}

      {/* Quizzes Section */}
      <section className="quizzes-section">
        <div className="section-header">
          <h2>
            {user?.role === 'student'
              ? 'Your Available Quizzes'
              : 'All Quizzes'}
          </h2>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="category-filter">
            <button
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {getCategoryIcon(cat)} {cat}
              </button>
            ))}
          </div>
        )}

        {/* Quiz Cards Grid */}
        {quizzesLoading ? (
          <div className="quiz-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="quiz-card skeleton" />
            ))}
          </div>
        ) : quizzesError ? (
          <div className="alert alert-error">{quizzesError}</div>
        ) : filteredQuizzes.length > 0 ? (
          <div className="quiz-grid">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz._id} className="quiz-card">
                <div className={`quiz-header ${getCategoryColor(quiz.category)}`}>
                  <div className="quiz-icon">
                    {getCategoryIcon(quiz.category)}
                  </div>
                  <span className="quiz-category">{quiz.category}</span>
                </div>
                <h3 className="quiz-title">{quiz.title}</h3>
                <div className="quiz-meta">
                  <span><FiClock style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />{quiz.timeLimitMinutes} min</span>
                  <span><FiStar style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />{quiz.totalMarks} marks</span>
                </div>
                <div className="quiz-rating">
                  {/* Star rating placeholder - can be enhanced with actual ratings */}
                  <span>{[1,2,3,4,5].map(i => <FiStar key={i} size={14} style={{ verticalAlign: 'middle' }} />)} (4.5)</span>
                  <span className="review-count">128 reviews</span>
                </div>
                <div className="quiz-actions">
                  <Link
                    to={`/quiz/${quiz._id}`}
                    className="btn btn-primary"
                  >
                    Start Quiz
                  </Link>
                  <Link
                    to={`/quiz/${quiz._id}/leaderboard`}
                    className="btn btn-secondary"
                  >
                    Leaderboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No quizzes available yet. Check back soon!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
