import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiGlobe, FiUsers, FiLock, FiEye, FiEyeOff, FiCopy, FiCheck, FiEdit2, FiTrash2, FiBookOpen, FiBarChart2 } from 'react-icons/fi';
import api from '../api';
import '../styles/admin-quizzes.css';

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [revealedId, setRevealedId] = useState(null);

  useEffect(() => {
    loadQuizzes();
    loadGroups();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/quizzes');
      setQuizzes(data);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const { data } = await api.get('/groups?scope=owned');
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups', err);
    }
  };

  const toggleQuiz = async (quizId, currentStatus) => {
    try {
      await api.patch(`/admin/quizzes/${quizId}/toggle`);
      setQuizzes((prev) =>
        prev.map((q) =>
          q._id === quizId ? { ...q, isEnabled: !q.isEnabled } : q
        )
      );
    } catch (err) {
      console.error('Failed to toggle quiz', err);
    }
  };

  const deleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.delete(`/admin/quizzes/${quizId}`);
        setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
      } catch (err) {
        console.error('Failed to delete quiz', err);
      }
    }
  };

  const getAccessTypeInfo = (quiz) => {
    if (quiz.accessType === 'group' && quiz.group) {
      const group = groups.find((g) => g._id === quiz.group);
      return { label: group?.name || 'Group', type: 'group' };
    }
    if (quiz.accessType === 'code') {
      return { label: 'Access Code', type: 'code' };
    }
    return { label: 'Public', type: 'global' };
  };

  const copyAccessCode = (quiz) => {
    if (quiz.accessCode) {
      navigator.clipboard.writeText(quiz.accessCode).then(() => {
        setCopiedId(quiz._id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  return (
    <div className="admin-quizzes-page">
      <div className="admin-header">
        <h1>Quiz Management</h1>
        <Link to="/admin/quizzes/new" className="btn-create">
          + Create Quiz
        </Link>
      </div>

      {/* Quizzes Table */}
      <div className="quizzes-table">
        <div className="table-header">
          <div>Title</div>
          <div>Category</div>
          <div>Access</div>
          <div>Attempts</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        <div className="table-body">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="table-row skeleton" />
            ))
          ) : quizzes.length > 0 ? (
            quizzes.map((quiz) => {
              const accessInfo = getAccessTypeInfo(quiz);
              return (
                <div key={quiz._id} className="table-row">
                  <div className="table-cell-title">
                    <h3>{quiz.title}</h3>
                    <p>{quiz.timeLimitMinutes} min · {quiz.totalMarks} marks</p>
                  </div>

                  <div>
                    <span className="category-badge">{quiz.category}</span>
                  </div>

                  <div>
                    <span className={`access-badge ${accessInfo.type}`}>
                      <span className="access-icon">
                        {accessInfo.type === 'global' ? <FiGlobe /> : accessInfo.type === 'group' ? <FiUsers /> : <FiLock />}
                      </span>
                      {accessInfo.label}
                    </span>
                    {quiz.accessType === 'code' && quiz.accessCode && (
                      <div className="code-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setRevealedId(revealedId === quiz._id ? null : quiz._id)}
                          title={revealedId === quiz._id ? 'Hide code' : 'Reveal code'}
                        >
                          {revealedId === quiz._id ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                        {revealedId === quiz._id && (
                          <code className="revealed-code">{quiz.accessCode}</code>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => copyAccessCode(quiz)}
                          title={copiedId === quiz._id ? 'Copied!' : 'Copy access code'}
                        >
                          {copiedId === quiz._id ? <FiCheck size={18} /> : <FiCopy size={18} />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="attempt-count">
                      {quiz.attemptCount || 0} {quiz.attemptCount === 1 ? 'attempt' : 'attempts'}
                    </span>
                  </div>

                  <div>
                    <div className="status-toggle">
                      <button
                        className={`toggle-switch ${quiz.isEnabled ? 'enabled' : ''}`}
                        onClick={() => toggleQuiz(quiz._id, quiz.isEnabled)}
                        type="button"
                      />
                      <span className="status-label">
                        {quiz.isEnabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="actions-menu">
                      <Link to={`/admin/attempts?quizId=${quiz._id}`} className="action-btn" title="View Attempts">
                        <FiBarChart2 size={16} />
                      </Link>
                      <Link to={`/admin/quizzes/${quiz._id}`} className="action-btn" title="Edit">
                        <FiEdit2 size={16} />
                      </Link>
                      <button
                        className="action-btn"
                        onClick={() => deleteQuiz(quiz._id)}
                        type="button"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><FiBookOpen size={32} /></div>
              <p>No quizzes created yet. Start by creating your first quiz!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuizzes;
