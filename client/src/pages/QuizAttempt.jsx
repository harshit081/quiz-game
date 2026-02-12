import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const QuizAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/quizzes/${id}`).then(({ data }) => {
      setQuiz(data);
      setSecondsLeft(data.timeLimitMinutes * 60);
    });
  }, [id]);

  useEffect(() => {
    if (!secondsLeft) return undefined;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0 && quiz && !submitting) {
      handleSubmit();
    }
  }, [secondsLeft, quiz, submitting]);

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
    if (!quiz || submitting) return;
    setSubmitting(true);
    const payloadAnswers = quiz.questions.map((q) => ({
      questionId: q._id,
      selectedIndex: answers[q._id] ?? -1,
    }));

    try {
      const { data } = await api.post(`/quizzes/${quiz._id}/attempt`, {
        answers: payloadAnswers,
        timeTakenSeconds: quiz.timeLimitMinutes * 60 - secondsLeft,
      });

      navigate('/result', { state: { quiz, result: data, answers } });
    } catch (err) {
      setSubmitting(false);
    }
  };

  if (!quiz) {
    return <div className="panel">Loading quiz...</div>;
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

      <div className="actions">
        <button className="btn ghost" type="button" disabled={current === 0} onClick={() => setCurrent((prev) => prev - 1)}>
          Previous
        </button>
        {current < questions.length - 1 ? (
          <button className="btn" type="button" onClick={() => setCurrent((prev) => prev + 1)}>
            Next
          </button>
        ) : (
          <button className="btn primary" type="button" onClick={handleSubmit} disabled={submitting}>
            Submit quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizAttempt;
