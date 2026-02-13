import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHash, FiZap, FiBookOpen, FiBook, FiHelpCircle, FiMonitor, FiGlobe, FiFileText, FiClock, FiStar } from 'react-icons/fi';
import api from '../api';
import '../styles/dashboard.css';

const getCategoryIcon = (category) => {
  const icons = { math: <FiHash />, science: <FiZap />, history: <FiBookOpen />, english: <FiBook />, general: <FiHelpCircle />, technology: <FiMonitor />, geography: <FiGlobe /> };
  return icons[category?.toLowerCase()] || <FiFileText />;
};

const getCategoryColor = (category) => {
  const colors = { math: 'category-math', science: 'category-science', history: 'category-history', english: 'category-english', general: 'category-general', technology: 'category-tech', geography: 'category-geo' };
  return colors[category?.toLowerCase()] || 'category-general';
};

const GlobalQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = Array.from(new Set(quizzes.map((q) => q.category).filter(Boolean)));
  const filteredQuizzes = selectedCategory === 'all' ? quizzes : quizzes.filter((q) => q.category === selectedCategory);

  useEffect(() => {
    let mounted = true;
    const loadQuizzes = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/quizzes?scope=global');
        if (mounted) setQuizzes(data);
      } catch (err) {
        if (mounted) setError('Unable to load global quizzes.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadQuizzes();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="dashboard-container">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1><FiGlobe style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Global Quizzes</h1>
          <p>Open quizzes available to everyone. No access code needed.</p>
        </div>
      </section>

      {categories.length > 0 && (
        <div className="category-filter">
          <button className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All</button>
          {categories.map((cat) => (
            <button key={cat} className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
              {getCategoryIcon(cat)} {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="quiz-grid">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="quiz-card skeleton" />)}
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : filteredQuizzes.length > 0 ? (
        <div className="quiz-grid">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz._id} className="quiz-card">
              <div className={`quiz-header ${getCategoryColor(quiz.category)}`}>
                <div className="quiz-icon">{getCategoryIcon(quiz.category)}</div>
                <span className="quiz-category">{quiz.category}</span>
              </div>
              <h3 className="quiz-title">{quiz.title}</h3>
              <div className="quiz-meta">
                <span><FiClock style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />{quiz.timeLimitMinutes} min</span>
                <span><FiStar style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />{quiz.totalMarks} marks</span>
              </div>
              <div className="quiz-actions">
                <Link to={`/quiz/${quiz._id}`} className="btn btn-primary">Start Quiz</Link>
                <Link to={`/quiz/${quiz._id}/leaderboard`} className="btn btn-secondary">Leaderboard</Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><p>No global quizzes available yet.</p></div>
      )}
    </div>
  );
};

export default GlobalQuizzes;
