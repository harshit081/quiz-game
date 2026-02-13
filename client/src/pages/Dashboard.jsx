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
    if (!user) return;

    const loadData = async () => {
      setQuizzesLoading(true);
      setQuizzesError('');
      try {
        const endpoint = user.role === 'student' ? '/quizzes?scope=available' : '/admin/quizzes';
        const { data } = await api.get(endpoint);
        setQuizzes(data);
      } catch (err) {
        setQuizzesError('Unable to load quizzes right now.');
      } finally {
        setQuizzesLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        if (user.role === 'admin') {
          const { data } = await api.get('/admin/stats');
          setStats({
            usersCount: data.usersCount ?? 0,
            quizCount: data.quizCount ?? 0,
            averageScore: data.averageScore ?? 0,
            attemptsCount: data.attemptsCount ?? 0,
          });
          return;
        }

        if (user.role === 'teacher') {
          const { data: attemptsData } = await api.get('/admin/attempts');
          setStats({
            attemptsCount: attemptsData.length,
          });
          return;
        }

        const { data } = await api.get('/quizzes/stats/me');

        setStats({
          averagePercentage: data.averagePercentage ?? 0,
          attemptsCount: data.attemptsCount ?? 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setStats({
          averageScore: 0,
          averagePercentage: 0,
          attemptsCount: 0,
        });
      }
    };

    loadStats();
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
          {user?.role !== 'teacher' && (
            <div className="stat-card">
              <div className="stat-number">
                {user?.role === 'student'
                  ? (stats?.averagePercentage != null ? `${stats.averagePercentage}%` : '—')
                  : (stats?.averageScore != null ? `${stats.averageScore}%` : '—')}
              </div>
              <div className="stat-label">{user?.role === 'student' ? 'Avg. Percentage' : 'Avg. Score'}</div>
            </div>
          )}
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
              <div className="stat-value">{stats?.averageScore != null ? `${stats.averageScore}%` : '0%'}</div>
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
                {(() => {
                  const savedCode = sessionStorage.getItem(`quiz_code_${quiz._id}`) || '';
                  const codeQuery = savedCode ? `?code=${encodeURIComponent(savedCode)}` : '';
                  const startPath = `/quiz/${quiz._id}${codeQuery}`;
                  const leaderboardPath = `/quiz/${quiz._id}/leaderboard${codeQuery}`;
                  const isStudent = user?.role === 'student';
                  const hideStart = isStudent && quiz.singleAttempt && quiz.attempted;

                  return (
                    <>
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
                {isStudent && quiz.attempted && (
                  <div className="quiz-meta" style={{ marginTop: '-0.4rem' }}>
                    <span>
                      <strong>My Score:</strong> {quiz.latestScore} / {quiz.totalMarks}
                    </span>
                  </div>
                )}
                <div className="quiz-rating">
                  {/* Star rating placeholder - can be enhanced with actual ratings */}
                  <span>{[1,2,3,4,5].map(i => <FiStar key={i} size={14} style={{ verticalAlign: 'middle' }} />)} (4.5)</span>
                  <span className="review-count">128 reviews</span>
                </div>
                <div className="quiz-actions">
                  {!hideStart && (
                    <Link
                      to={startPath}
                      className="btn btn-primary"
                    >
                      Start Quiz
                    </Link>
                  )}
                  {hideStart && quiz.latestAttemptId && (
                    <Link
                      to={`/attempts/${quiz.latestAttemptId}`}
                      className="btn btn-secondary"
                    >
                      View Score
                    </Link>
                  )}
                  <Link
                    to={leaderboardPath}
                    className="btn btn-secondary"
                  >
                    Leaderboard
                  </Link>
                </div>
                    </>
                  );
                })()}
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
