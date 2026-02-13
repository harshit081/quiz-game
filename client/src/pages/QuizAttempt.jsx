import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiZap } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../auth.jsx';
import '../styles/quiz-attempt.css';

const QuizAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [attemptLocked, setAttemptLocked] = useState(false);
  const [restored, setRestored] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const accessCode = searchParams.get('code') || sessionStorage.getItem(`quiz_code_${id}`) || '';

  useEffect(() => {
    const query = accessCode ? `?code=${encodeURIComponent(accessCode)}` : '';

    api.get(`/quizzes/${id}${query}`).then(({ data }) => {
      setQuiz(data);
      setAttemptLocked(Boolean(data.attempted));
      if (accessCode) {
        sessionStorage.setItem(`quiz_code_${id}`, accessCode);
      }
    });
  }, [id, searchParams, accessCode]);

  const storageKey = useMemo(() => {
    const userId = user?.id || 'guest';
    return `quiz_attempt_${id}_${userId}`;
  }, [id, user]);

  useEffect(() => {
    if (!quiz || !user || restored) return;
    const saved = localStorage.getItem(storageKey);
    const timeLimitSeconds = quiz.timeLimitMinutes * 60;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const startTime = parsed.startedAt || Date.now();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setAnswers(parsed.answers || {});
        setCurrent(Number(parsed.current || 0));
        setStartedAt(startTime);
        setSecondsLeft(Math.max(timeLimitSeconds - elapsed, 0));
      } catch (err) {
        const startTime = Date.now();
        setStartedAt(startTime);
        setSecondsLeft(timeLimitSeconds);
        localStorage.setItem(
          storageKey,
          JSON.stringify({ answers: {}, current: 0, startedAt: startTime })
        );
      }
    } else {
      const startTime = Date.now();
      setStartedAt(startTime);
      setSecondsLeft(timeLimitSeconds);
      localStorage.setItem(
        storageKey,
        JSON.stringify({ answers: {}, current: 0, startedAt: startTime })
      );
    }

    setRestored(true);
  }, [quiz, user, restored, storageKey]);

  useEffect(() => {
    if (!restored || !quiz || !startedAt) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({ answers, current, startedAt })
    );
  }, [answers, current, startedAt, quiz, restored, storageKey]);

  useEffect(() => {
    if (!secondsLeft) return undefined;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  useEffect(() => {
    if (!restored || !startedAt) return;
    if (secondsLeft === 0 && quiz && !submitting && !attemptLocked) {
      handleSubmit();
    }
  }, [secondsLeft, quiz, submitting, attemptLocked, restored, startedAt]);

  useEffect(() => {
    if (!quiz) return undefined;
    let mounted = true;
    let interval;

    const loadLeaderboard = async () => {
      try {
        const query = accessCode ? `?code=${encodeURIComponent(accessCode)}` : '';
        const { data } = await api.get(`/quizzes/${id}/leaderboard${query}`);
        if (mounted) {
          setLeaderboard(data);
        }
      } finally {
        if (mounted) {
          setLeaderboardLoading(false);
        }
      }
    };

    loadLeaderboard();
    interval = setInterval(loadLeaderboard, 12000);

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [quiz, id, accessCode]);

  const questions = quiz?.questions || [];
  const question = questions[current];

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  const selectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!quiz || submitting || attemptLocked) return;
    setSubmitting(true);
    setSubmitError('');
    const payloadAnswers = quiz.questions.map((q) => ({
      questionId: q._id,
      selectedIndex: answers[q._id] ?? -1,
    }));

    try {
      const query = accessCode ? `?code=${encodeURIComponent(accessCode)}` : '';
      const { data } = await api.post(`/quizzes/${quiz._id}/attempt${query}`, {
        answers: payloadAnswers,
        timeTakenSeconds: quiz.timeLimitMinutes * 60 - secondsLeft,
      });

      localStorage.removeItem(storageKey);
      navigate('/result', { state: { quiz, result: data, answers } });
    } catch (err) {
      if (err.response?.status === 409) {
        setAttemptLocked(true);
        setSubmitError('This quiz already has an attempt. You cannot submit again.');
      } else {
        setSubmitting(false);
        setSubmitError('Submission failed. Check your connection and try again.');
      }
    }
  };

  if (!quiz) {
    return <div className="panel">Loading quiz...</div>;
  }

  if (attemptLocked) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2>Attempt locked</h2>
          <p className="muted">You have already submitted this quiz.</p>
        </div>
        <div className="actions">
          <Link className="btn" to="/attempts">View my attempts</Link>
          <Link className="btn ghost" to={`/quiz/${id}/leaderboard`}>Leaderboard</Link>
          <Link className="btn ghost" to="/">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-attempt-page">
      {/* Top Progress Bar */}
      <div className="attempt-progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
        <div className="progress-info">
          Question {current + 1} of {questions.length} • {formattedTime} left
        </div>
      </div>

      <div className="quiz-arena">
        <div className="quiz-shell">
          {/* Main Content Area */}
          <section className="arena-main">
            {/* Question Card */}
            {question && (
              <div className="question-section">
                <h1 className="question-text">{question.text}</h1>
              </div>
            )}

            {/* Answer Options */}
            <div className="answers-section">
              {question?.options.map((opt, idx) => (
                <label key={`${question._id}-${idx}`} className="answer-option">
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    checked={answers[question._id] === idx}
                    onChange={() => selectOption(question._id, idx)}
                    className="answer-radio"
                  />
                  <span className="answer-text">{opt}</span>
                </label>
              ))}
            </div>

            {submitError && <div className="alert alert-error">{submitError}</div>}

            {/* Navigation Buttons */}
            <div className="quiz-navigation">
              <button
                className="btn btn-secondary"
                type="button"
                disabled={current === 0}
                onClick={() => setCurrent((prev) => prev - 1)}
              >
                <FiChevronLeft size={16} /> Previous
              </button>

              <span className="nav-counter">
                {current + 1} / {questions.length}
              </span>

              {current < questions.length - 1 ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setCurrent((prev) => prev + 1)}
                >
                  Next <FiChevronRight size={16} />
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-submit"
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || attemptLocked}
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </section>

          {/* Leaderboard Sidebar */}
          <aside className="leaderboard-sidebar">
            <div className="leaderboard-header">
              <h3>Live Leaderboard</h3>
              <span className="leaderboard-badge"><FiZap size={14} /> Live</span>
            </div>

            <div className="leaderboard-list">
              {leaderboardLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="leaderboard-entry skeleton" />
                ))
              ) : leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div key={entry._id} className="leaderboard-entry">
                    <span className="rank-badge">{index + 1}</span>
                    <div className="entry-info">
                      <p className="entry-name">{entry.user?.name || 'Student'}</p>
                    </div>
                    <span className="entry-score">{entry.score} pts</span>
                  </div>
                ))
              ) : (
                <p className="empty-message">No submissions yet</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
