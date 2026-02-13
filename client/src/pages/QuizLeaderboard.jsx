import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FiAward } from 'react-icons/fi';
import api from '../api';

const QuizLeaderboard = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const accessCode = searchParams.get('code') || sessionStorage.getItem(`quiz_code_${id}`) || '';
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
        const query = accessCode ? `?code=${encodeURIComponent(accessCode)}` : '';
        const [quizRes, leaderboardRes] = await Promise.all([
          api.get(`/quizzes/${id}${query}`),
          api.get(`/quizzes/${id}/leaderboard${query}`),
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
    <div className="dashboard-container">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1><FiAward style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Leaderboard</h1>
          <p>{quiz?.title || 'Top scores'}</p>
        </div>
      </section>

      <section className="quizzes-table-wrapper">
        <div className="table-header" style={{ gridTemplateColumns: '0.5fr 2fr 1fr 1fr' }}>
          <span>Rank</span>
          <span>Student</span>
          <span>Score</span>
          <span>Time</span>
        </div>
        {loading && Array.from({ length: 5 }).map((_, index) => (
          <div key={`leader-skeleton-${index}`} className="table-row skeleton" style={{ height: '56px' }} />
        ))}
        {!loading && entries.map((entry, index) => (
          <div key={entry._id} className="table-row" style={{ gridTemplateColumns: '0.5fr 2fr 1fr 1fr' }}>
            <span style={{ fontWeight: 700, color: index < 3 ? '#3b7cff' : 'inherit' }}>
              {index === 0 ? <FiAward size={18} color="#FFD700" /> : index === 1 ? <FiAward size={18} color="#C0C0C0" /> : index === 2 ? <FiAward size={18} color="#CD7F32" /> : `#${index + 1}`}
            </span>
            <span><strong>{entry.user?.name || 'Student'}</strong></span>
            <span><strong>{entry.score}</strong></span>
            <span>{Math.ceil(entry.timeTakenSeconds / 60)} min</span>
          </div>
        ))}
        {!loading && error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && !entries.length && (
          <div className="empty-state">
            <p>No attempts yet.</p>
          </div>
        )}
      </section>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Link className="btn btn-primary" to="/">Back to dashboard</Link>
      </div>
    </div>
  );
};

export default QuizLeaderboard;
