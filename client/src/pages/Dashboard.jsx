import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../api';
import { useAuth } from '../auth.jsx';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadQuizzes = async () => {
      setQuizzesLoading(true);
      setQuizzesError('');
      try {
        const { data } = await api.get('/quizzes');
        if (mounted) {
          setQuizzes(data);
        }
      } catch (err) {
        if (mounted) {
          setQuizzesError('Unable to load quizzes right now.');
        }
      } finally {
        if (mounted) {
          setQuizzesLoading(false);
        }
      }
    };

    loadQuizzes();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      let mounted = true;
      const loadStats = async () => {
        setStatsLoading(true);
        setStatsError('');
        try {
          const { data } = await api.get('/admin/stats');
          if (mounted) {
            setStats(data);
          }
        } catch (err) {
          if (mounted) {
            setStatsError('Unable to load admin stats.');
          }
        } finally {
          if (mounted) {
            setStatsLoading(false);
          }
        }
      };

      loadStats();
      return () => {
        mounted = false;
      };
    }
    return undefined;
  }, [user]);

  const chartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ['Users', 'Quizzes', 'Attempts'],
      datasets: [
        {
          data: [stats.usersCount, stats.quizCount, stats.attemptsCount],
          backgroundColor: ['#F4B740', '#4F9D69', '#4D7C8A'],
          borderWidth: 0,
        },
      ],
    };
  }, [stats]);

  return (
    <div className="dashboard">
      <section className="hero">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>
            {user?.name ? `Ready, ${user.name}?` : 'Ready to quiz?'}
          </h1>
          <p className="muted">
            Keep your streak alive. Choose a quiz or build a new one.
          </p>
        </div>
        <div className="hero-card">
          <div className="hero-stat">
            <span className="label">Active quizzes</span>
            <strong>{quizzes.length}</strong>
          </div>
          <div className="hero-stat">
            <span className="label">Role</span>
            <strong>{user?.role ?? 'student'}</strong>
          </div>
        </div>
      </section>

      <div className="panel">
        <div className="panel-header">
          <h2>Available Quizzes</h2>
          <p className="muted">Pick a quiz and start your attempt.</p>
        </div>
        <div className="grid">
          {quizzesLoading && (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="card skeleton" />
            ))
          )}
          {!quizzesLoading && quizzes.map((quiz) => (
            <div key={quiz._id} className="card">
              <div className="card-header">
                <h3>{quiz.title}</h3>
                <span className="pill">{quiz.category}</span>
              </div>
              <p className="meta">
                {quiz.timeLimitMinutes} min · {quiz.totalMarks} marks
              </p>
              <div className="actions">
                <Link className="btn" to={`/quiz/${quiz._id}`}>Start quiz</Link>
                <Link className="btn ghost" to={`/quiz/${quiz._id}/leaderboard`}>Leaderboard</Link>
              </div>
            </div>
          ))}
          {!quizzesLoading && quizzesError && <div className="alert">{quizzesError}</div>}
          {!quizzesLoading && !quizzesError && !quizzes.length && (
            <div className="empty">
              <p className="muted">No quizzes are enabled yet.</p>
            </div>
          )}
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="panel">
          <div className="panel-header">
            <h2>Admin Pulse</h2>
            <p className="muted">Quick view of platform activity.</p>
          </div>
          {statsLoading && <div className="skeleton tall" />}
          {!statsLoading && statsError && <div className="alert">{statsError}</div>}
          {!statsLoading && !statsError && stats && chartData ? (
            <div className="chart-row">
              <div className="chart-card">
                <Doughnut data={chartData} />
              </div>
              <div className="stats">
                <div>
                  <span className="label">Users</span>
                  <strong>{stats.usersCount}</strong>
                </div>
                <div>
                  <span className="label">Quizzes</span>
                  <strong>{stats.quizCount}</strong>
                </div>
                <div>
                  <span className="label">Attempts</span>
                  <strong>{stats.attemptsCount}</strong>
                </div>
                <div>
                  <span className="label">Avg Score</span>
                  <strong>{stats.averageScore}</strong>
                </div>
              </div>
            </div>
          ) : null}
          {!statsLoading && !statsError && !stats && (
            <p className="muted">No stats available yet.</p>
          )}
          <div className="actions">
            <Link className="btn" to="/admin/quizzes">Manage quizzes</Link>
            <Link className="btn ghost" to="/admin/attempts">View attempts</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
