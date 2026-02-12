import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth.jsx';

const QuizAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    api.get(`/quizzes/${id}`).then(({ data }) => {
      setQuiz(data);
      setAttemptLocked(Boolean(data.attempted));
    });
  }, [id]);

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
    if (secondsLeft === 0 && quiz && !submitting && !attemptLocked) {
      handleSubmit();
    }
  }, [secondsLeft, quiz, submitting, attemptLocked]);

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
      const { data } = await api.post(`/quizzes/${quiz._id}/attempt`, {
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
    <div className="panel">
      <div className="quiz-header">
        <div>
          <h2>{quiz.title}</h2>
          <p className="muted">{quiz.category}</p>
        </div>
        <div className="timer">Time left: {formattedTime}</div>
      </div>

      <div className="progress-row">
        <span className="pill">Question {current + 1} / {questions.length}</span>
        <span className="muted">Answered {Object.keys(answers).length} of {questions.length}</span>
      </div>
      <div className="progress">
        <div
          className="progress-bar"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      {question && (
        <div className="question">
          <h3>
            Q{current + 1}. {question.text}
          </h3>
          <div className="options">
            {question.options.map((opt, idx) => (
              <button
                key={`${question._id}-${idx}`}
                className={`option ${answers[question._id] === idx ? 'selected' : ''}`}
                type="button"
                onClick={() => selectOption(question._id, idx)}
              >
                <span className="badge">{String.fromCharCode(65 + idx)}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {submitError && <div className="alert">{submitError}</div>}

      <div className="actions">
        <button className="btn ghost" type="button" disabled={current === 0} onClick={() => setCurrent((prev) => prev - 1)}>
          Previous
        </button>
        {current < questions.length - 1 ? (
          <button className="btn" type="button" onClick={() => setCurrent((prev) => prev + 1)}>
            Next
          </button>
        ) : (
          <button
            className="btn primary"
            type="button"
            onClick={handleSubmit}
            disabled={submitting || attemptLocked}
          >
            Submit quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizAttempt;
