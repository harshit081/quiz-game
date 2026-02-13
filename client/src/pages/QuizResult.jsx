import { useLocation, Link } from 'react-router-dom';
import { FiTarget, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const QuizResult = () => {
  const location = useLocation();
  const result = location.state?.result;
  const quiz = location.state?.quiz;

  if (!result || !quiz) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <h2>No result found</h2>
          <Link className="btn btn-primary" to="/">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const reviewMap = new Map(result.review.map((item) => [item.questionId, item]));
  const correctCount = result.review.filter((item) => item.isCorrect).length;
  const accuracy = Math.round((correctCount / result.totalMarks) * 100);
  const passed = result.score >= Math.ceil(result.totalMarks * 0.5);

  return (
    <div className="dashboard-container">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1><FiTarget style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Result Summary</h1>
          <p>{quiz.title}</p>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{result.score} / {result.totalMarks}</div>
          <div className="stat-label">Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: passed ? '#22c55e' : '#ef4444' }}>
            {passed ? <><FiCheckCircle style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Pass</> : <><FiXCircle style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Needs review</>}
          </div>
          <div className="stat-label">Status</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      <section className="quizzes-table-wrapper">
        {quiz.questions.map((question, idx) => {
          const review = reviewMap.get(question._id);
          const selected = review?.selectedIndex ?? -1;
          const correct = review?.correctIndex ?? -1;
          return (
            <div key={`result-${question._id}`} className="result-item" style={{ padding: '1.25rem 0', borderBottom: '1px solid #f0f2f8' }}>
              <h4 style={{ marginBottom: '0.6rem' }}>
                Q{idx + 1}. {question.text}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {question.options.map((opt, optIndex) => (
                  <li
                    key={`result-${question._id}-${optIndex}`}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      background: optIndex === correct ? '#dcfce7' : optIndex === selected ? '#fee2e2' : 'transparent',
                      color: optIndex === correct ? '#166534' : optIndex === selected ? '#991b1b' : 'inherit',
                      fontWeight: (optIndex === correct || optIndex === selected) ? 600 : 400,
                    }}
                  >
                    {String.fromCharCode(65 + optIndex)}. {opt}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Link className="btn btn-primary" to="/">Back to dashboard</Link>
        <Link className="btn btn-secondary" to={`/quiz/${quiz._id}/leaderboard`}>Leaderboard</Link>
      </div>
    </div>
  );
};

export default QuizResult;
