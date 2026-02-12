import { useLocation, Link } from 'react-router-dom';

const QuizResult = () => {
  const location = useLocation();
  const result = location.state?.result;
  const quiz = location.state?.quiz;

  if (!result || !quiz) {
    return (
      <div className="panel">
        <h2>No result found</h2>
        <Link className="btn" to="/">Back to dashboard</Link>
      </div>
    );
  }

  const reviewMap = new Map(result.review.map((item) => [item.questionId, item]));
  const correctCount = result.review.filter((item) => item.isCorrect).length;
  const accuracy = Math.round((correctCount / result.totalMarks) * 100);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Result Summary</h2>
        <p className="muted">{quiz.title}</p>
      </div>
      <div className="result-score">
        <div className="result-card">
          <span className="label">Score</span>
          <strong>{result.score} / {result.totalMarks}</strong>
        </div>
        <div className="result-card">
          <span className="label">Status</span>
          <strong>{result.score >= Math.ceil(result.totalMarks * 0.5) ? 'Pass' : 'Needs review'}</strong>
        </div>
        <div className="result-card">
          <span className="label">Accuracy</span>
          <strong>{accuracy}%</strong>
        </div>
      </div>

      <div className="divider" />

      <div className="result-list">
        {quiz.questions.map((question, idx) => {
          const review = reviewMap.get(question._id);
          const selected = review?.selectedIndex ?? -1;
          const correct = review?.correctIndex ?? -1;
          return (
            <div key={`result-${question._id}`} className="result-item">
              <h4>
                Q{idx + 1}. {question.text}
              </h4>
              <ul>
                {question.options.map((opt, optIndex) => (
                  <li
                    key={`result-${question._id}-${optIndex}`}
                    className={
                      optIndex === correct
                        ? 'correct'
                        : optIndex === selected
                          ? 'incorrect'
                          : ''
                    }
                  >
                    {String.fromCharCode(65 + optIndex)}. {opt}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="actions">
        <Link className="btn" to="/">Back to dashboard</Link>
        <Link className="btn ghost" to={`/quiz/${quiz._id}/leaderboard`}>Leaderboard</Link>
      </div>
    </div>
  );
};

export default QuizResult;
