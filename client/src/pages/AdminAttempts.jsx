import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiBarChart2, FiDownload } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../auth';
import '../styles/dashboard.css';

const AdminAttempts = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const selectedQuizId = searchParams.get('quizId') || '';

  const downloadCsv = async () => {
    if (!selectedQuizId) {
      setError('Open attempts from Quiz Management to download quiz-wise CSV.');
      return;
    }

    try {
      setError('');
      const response = await api.get(`/admin/attempts.csv?quizId=${selectedQuizId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers?.['content-disposition'] || '';
      const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const fileName = fileNameMatch?.[1] || 'quiz_attempts.csv';
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Unable to download CSV for selected quiz.');
    }
  };

  const filteredAttempts = useMemo(() => {
    if (!selectedQuizId) return attempts;
    return attempts.filter((attempt) => attempt.quiz?._id === selectedQuizId);
  }, [attempts, selectedQuizId]);

  useEffect(() => {
    let mounted = true;
    const loadAttempts = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: attemptsData } = await api.get('/admin/attempts');
        if (mounted) {
          setAttempts(attemptsData);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load attempts.');
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
          <h1><FiBarChart2 style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Quiz Attempts</h1>
          <p>{user?.role === 'teacher' ? 'Open from Quiz Management and review attempts quiz-wise.' : 'Review submissions and download results quiz-wise.'}</p>
        </div>
        <div className="welcome-actions">
          <button className="btn btn-primary" type="button" onClick={downloadCsv} disabled={!selectedQuizId}>
            <FiDownload style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Download CSV
          </button>
        </div>
      </section>

      <section className="quizzes-table-wrapper">
        <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.6 }}>
          {loading ? 'Loading attempts...' : `${filteredAttempts.length} total attempts`}
        </div>
        <div className="table-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr' }}>
          <span>Student</span>
          <span>Quiz</span>
          <span>Score</span>
          <span>Date</span>
        </div>
        {loading && Array.from({ length: 4 }).map((_, index) => (
          <div key={`attempt-skeleton-${index}`} className="table-row skeleton" style={{ height: '56px' }} />
        ))}
        {!loading && filteredAttempts.map((attempt) => (
          <div key={attempt._id} className="table-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr' }}>
            <span>
              <strong>{attempt.user?.name}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{attempt.user?.email}</div>
            </span>
            <span>{attempt.quiz?.title}</span>
            <span><strong>{attempt.score}</strong></span>
            <span>{new Date(attempt.attemptDate).toLocaleString()}</span>
          </div>
        ))}
        {!loading && error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && !filteredAttempts.length && (
          <div className="empty-state">
            <p>{selectedQuizId ? 'No attempts yet for this quiz.' : 'Select a quiz to view attempts.'}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminAttempts;
