import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiTarget, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../api';
import '../styles/dashboard.css';

const AttemptReview = () => {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadAttempt = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/quizzes/attempts/${attemptId}`);
        if (mounted) {
          setData(response.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Unable to load attempt responses.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAttempt();
    return () => {
      mounted = false;
    };
  }, [attemptId]);

  const summary = useMemo(() => {
    const review = data?.review || [];
    const correctCount = review.filter((item) => item.isCorrect).length;
    const totalMarks = Number(data?.totalMarks || 0);
    const accuracy = totalMarks ? Math.round((correctCount / totalMarks) * 100) : 0;
    const passed = Number(data?.score || 0) >= Math.ceil(totalMarks * 0.5);
    return { correctCount, accuracy, passed };
  }, [data]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="quizzes-table-wrapper">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`attempt-review-skeleton-${index}`} className="table-row skeleton" style={{ height: '56px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <h2>Attempt review unavailable</h2>
          <p>{error || 'No attempt data found.'}</p>
          <Link className="btn btn-primary" to="/attempts">Back to my attempts</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1><FiTarget style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Attempt Review</h1>
          <p>{data.quiz?.title || 'Quiz'}</p>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data.score} / {data.totalMarks}</div>
          <div className="stat-label">Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: summary.passed ? '#22c55e' : '#ef4444' }}>
            {summary.passed ? <><FiCheckCircle style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Pass</> : <><FiXCircle style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Needs review</>}
          </div>
          <div className="stat-label">Status</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      <section className="quizzes-table-wrapper">
        {(data.review || []).map((item, idx) => (
          <div key={`review-${item.questionId}-${idx}`} className="result-item" style={{ padding: '1.25rem 0', borderBottom: '1px solid #f0f2f8' }}>
            <h4 style={{ marginBottom: '0.6rem' }}>
              Q{idx + 1}. {item.questionText}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {item.options.map((opt, optIndex) => (
                <li
                  key={`attempt-review-${item.questionId}-${optIndex}`}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    background: optIndex === item.correctIndex ? '#dcfce7' : optIndex === item.selectedIndex ? '#fee2e2' : 'transparent',
                    color: optIndex === item.correctIndex ? '#166534' : optIndex === item.selectedIndex ? '#991b1b' : 'inherit',
                    fontWeight: (optIndex === item.correctIndex || optIndex === item.selectedIndex) ? 600 : 400,
                  }}
                >
                  {String.fromCharCode(65 + optIndex)}. {opt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Link className="btn btn-primary" to="/attempts">Back to my attempts</Link>
        <Link className="btn btn-secondary" to="/">Back to dashboard</Link>
      </div>
    </div>
  );
};

export default AttemptReview;
