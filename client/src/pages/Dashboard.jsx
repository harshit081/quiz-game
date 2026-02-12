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
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/quizzes').then(({ data }) => setQuizzes(data));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/admin/stats').then(({ data }) => setStats(data));
    }
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
      <div className="panel">
        <div className="panel-header">
          <h2>Available Quizzes</h2>
          <p className="muted">Pick a quiz and start your attempt.</p>
        </div>
        <div className="grid">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="card">
              <h3>{quiz.title}</h3>
              <p className="muted">{quiz.category}</p>
              <p className="meta">
                {quiz.timeLimitMinutes} min · {quiz.totalMarks} marks
              </p>
              <Link className="btn" to={`/quiz/${quiz._id}`}>Start quiz</Link>
            </div>
          ))}
          {!quizzes.length && <p className="muted">No quizzes are enabled yet.</p>}
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="panel">
          <div className="panel-header">
            <h2>Admin Pulse</h2>
            <p className="muted">Quick view of platform activity.</p>
          </div>
          {stats && chartData ? (
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
          ) : (
            <p className="muted">Loading admin stats...</p>
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
