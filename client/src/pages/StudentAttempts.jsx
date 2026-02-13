import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText } from 'react-icons/fi';
import api from '../api';
import '../styles/dashboard.css';

const StudentAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadAttempts = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/quizzes/attempts/me');
        if (mounted) {
          setAttempts(data);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load your attempt history.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAttempts();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="dashboard-container">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1><FiFileText style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> My Attempts</h1>
          <p>Review your recent quiz activity.</p>
        </div>
      </section>

      <section className="quizzes-table-wrapper">
        <div className="table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1.5fr auto' }}>
          <span>Quiz</span>
          <span>Score</span>
          <span>Time</span>
          <span>Date</span>
          <span>Review</span>
        </div>
        {loading && Array.from({ length: 4 }).map((_, index) => (
          <div key={`attempt-skeleton-${index}`} className="table-row skeleton" style={{ height: '56px' }} />
        ))}
        {!loading && attempts.map((attempt) => (
          <div key={attempt._id} className="table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1.5fr auto' }}>
            <span>
              <strong>{attempt.quiz?.title}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{attempt.quiz?.category}</div>
            </span>
            <span><strong>{attempt.score}</strong> / {attempt.quiz?.totalMarks ?? '-'}</span>
            <span>{Math.ceil(attempt.timeTakenSeconds / 60)} min</span>
            <span>{new Date(attempt.attemptDate).toLocaleString()}</span>
            <span>
              <Link className="btn btn-secondary" to={`/attempts/${attempt._id}`}>
                View Responses
              </Link>
            </span>
          </div>
        ))}
        {!loading && error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && !attempts.length && (
          <div className="empty-state">
            <p>No attempts yet.</p>
            <Link className="btn btn-primary" to="/">Browse quizzes</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentAttempts;
