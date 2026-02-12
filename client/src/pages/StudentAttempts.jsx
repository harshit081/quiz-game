import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

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
    <div className="panel">
      <div className="panel-header">
        <h2>My Attempts</h2>
        <p className="muted">Review your recent quiz activity.</p>
      </div>

      <div className="table">
        <div className="table-row header">
          <span>Quiz</span>
          <span>Score</span>
          <span>Time</span>
          <span>Date</span>
        </div>
        {loading && Array.from({ length: 4 }).map((_, index) => (
          <div key={`attempt-skeleton-${index}`} className="table-row skeleton" />
        ))}
        {!loading && attempts.map((attempt) => (
          <div key={attempt._id} className="table-row">
            <span>
              <strong>{attempt.quiz?.title}</strong>
              <div className="muted">{attempt.quiz?.category}</div>
            </span>
            <span>{attempt.score} / {attempt.quiz?.totalMarks ?? '-'}</span>
            <span>{Math.ceil(attempt.timeTakenSeconds / 60)} min</span>
            <span>{new Date(attempt.attemptDate).toLocaleString()}</span>
          </div>
        ))}
        {!loading && error && <div className="alert">{error}</div>}
        {!loading && !error && !attempts.length && (
          <div className="empty">
            <p className="muted">No attempts yet.</p>
            <Link className="btn" to="/">Browse quizzes</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttempts;
