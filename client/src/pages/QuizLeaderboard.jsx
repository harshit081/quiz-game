import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

const QuizLeaderboard = () => {
  const { id } = useParams();
  const [entries, setEntries] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [quizRes, leaderboardRes] = await Promise.all([
          api.get(`/quizzes/${id}`),
          api.get(`/quizzes/${id}/leaderboard`),
        ]);
        if (mounted) {
          setQuiz(quizRes.data);
          setEntries(leaderboardRes.data);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load leaderboard.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Leaderboard</h2>
        <p className="muted">{quiz?.title || 'Top scores'}</p>
      </div>

      <div className="table">
        <div className="table-row header">
          <span>Rank</span>
          <span>Student</span>
          <span>Score</span>
          <span>Time</span>
        </div>
        {loading && Array.from({ length: 5 }).map((_, index) => (
          <div key={`leader-skeleton-${index}`} className="table-row skeleton" />
        ))}
        {!loading && entries.map((entry, index) => (
          <div key={entry._id} className="table-row">
            <span>#{index + 1}</span>
            <span>{entry.user?.name || 'Student'}</span>
            <span>{entry.score}</span>
            <span>{Math.ceil(entry.timeTakenSeconds / 60)} min</span>
          </div>
        ))}
        {!loading && error && <div className="alert">{error}</div>}
        {!loading && !error && !entries.length && (
          <div className="empty">
            <p className="muted">No attempts yet.</p>
          </div>
        )}
      </div>

      <div className="actions">
        <Link className="btn" to="/">Back to dashboard</Link>
      </div>
    </div>
  );
};

export default QuizLeaderboard;
