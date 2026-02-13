import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHash, FiZap, FiBookOpen, FiBook, FiHelpCircle, FiMonitor, FiGlobe, FiFileText, FiClock, FiStar } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../api';
import { useAuth } from '../auth.jsx';
import '../styles/dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

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
  const [adminAttemptsTrend, setAdminAttemptsTrend] = useState([]);
  const [teacherQuizMetrics, setTeacherQuizMetrics] = useState([]);
  const [themeMode, setThemeMode] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

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
          const [{ data }, { data: attemptsData }] = await Promise.all([
            api.get('/admin/stats'),
            api.get('/admin/attempts'),
          ]);

          const toLocalDateKey = (value) => {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return null;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          const days = Array.from({ length: 14 }, (_, index) => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - (13 - index));
            const key = toLocalDateKey(date);
            return {
              key,
              label: `${date.getDate()}/${date.getMonth() + 1}`,
              count: 0,
            };
          });

          const countMap = new Map(days.map((day) => [day.key, 0]));
          attemptsData.forEach((attempt) => {
            const stamp = attempt.attemptDate || attempt.createdAt;
            if (!stamp) return;
            const key = toLocalDateKey(stamp);
            if (!key) return;
            if (countMap.has(key)) {
              countMap.set(key, Number(countMap.get(key)) + 1);
            }
          });

          setAdminAttemptsTrend(days.map((day) => ({
            label: day.label,
            count: Number(countMap.get(day.key) || 0),
          })));

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

          const perQuiz = new Map();
          attemptsData.forEach((attempt) => {
            const quizId = attempt.quiz?._id || attempt.quiz?.title;
            const quizTitle = attempt.quiz?.title || 'Quiz';
            const totalMarks = Number(attempt.quiz?.totalMarks || 0);

            if (!perQuiz.has(quizId)) {
              perQuiz.set(quizId, {
                quiz: quizTitle,
                attempts: 0,
                percentageSum: 0,
                percentageCount: 0,
              });
            }

            const item = perQuiz.get(quizId);
            item.attempts += 1;

            if (totalMarks > 0) {
              item.percentageSum += (Number(attempt.score || 0) / totalMarks) * 100;
              item.percentageCount += 1;
            }
          });

          const chartData = Array.from(perQuiz.values())
            .map((item) => ({
              quiz: item.quiz,
              attempts: item.attempts,
              averageScore: item.percentageCount
                ? Number((item.percentageSum / item.percentageCount).toFixed(2))
                : 0,
            }))
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 8);

          setTeacherQuizMetrics(chartData);
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

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setThemeMode(root.getAttribute('data-theme') || 'light');
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const isDark = themeMode === 'dark';
  const chartThemeKey = `theme-${themeMode}`;

  const chartOptions = useMemo(() => {
    const textColor = isDark ? 'rgba(233, 239, 255, 0.85)' : 'rgba(15, 19, 34, 0.8)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 19, 34, 0.08)';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor },
          beginAtZero: true,
        },
      },
    };
  }, [isDark]);

  const adminTrendData = useMemo(() => ({
    labels: adminAttemptsTrend.map((item) => item.label),
    datasets: [
      {
        label: 'Attempts',
        data: adminAttemptsTrend.map((item) => item.count),
        borderColor: '#3b7cff',
        backgroundColor: 'rgba(59, 124, 255, 0.18)',
        tension: 0.35,
        fill: true,
      },
    ],
  }), [adminAttemptsTrend]);

  const teacherAttemptsData = useMemo(() => ({
    labels: teacherQuizMetrics.map((item) => item.quiz),
    datasets: [
      {
        label: 'Attempts',
        data: teacherQuizMetrics.map((item) => item.attempts),
        backgroundColor: 'rgba(59, 124, 255, 0.75)',
        borderColor: '#3b7cff',
        borderWidth: 1,
      },
    ],
  }), [teacherQuizMetrics]);

  const teacherAvgData = useMemo(() => ({
    labels: teacherQuizMetrics.map((item) => item.quiz),
    datasets: [
      {
        label: 'Avg Score (%)',
        data: teacherQuizMetrics.map((item) => item.averageScore),
        backgroundColor: 'rgba(92, 246, 255, 0.7)',
        borderColor: '#5cf6ff',
        borderWidth: 1,
      },
    ],
  }), [teacherQuizMetrics]);

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

      {user?.role === 'admin' && (
        <section className="analytics-section">
          <h2>Attempts Trend (Last 14 Days)</h2>
          <div className="chart-card">
            {adminAttemptsTrend.length ? (
              <Line key={`admin-trend-${chartThemeKey}`} data={adminTrendData} options={chartOptions} />
            ) : (
              <p className="empty-chart">No attempt data yet.</p>
            )}
          </div>
        </section>
      )}

      {user?.role === 'teacher' && (
        <section className="analytics-section">
          <h2>Quiz Performance Overview</h2>
          <div className="charts-grid">
            <div className="chart-card">
              {teacherQuizMetrics.length ? (
                <Bar key={`teacher-attempts-${chartThemeKey}`} data={teacherAttemptsData} options={chartOptions} />
              ) : (
                <p className="empty-chart">No attempts for your quizzes yet.</p>
              )}
            </div>
            <div className="chart-card">
              {teacherQuizMetrics.length ? (
                <Bar key={`teacher-avg-${chartThemeKey}`} data={teacherAvgData} options={chartOptions} />
              ) : (
                <p className="empty-chart">No score data yet.</p>
              )}
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
