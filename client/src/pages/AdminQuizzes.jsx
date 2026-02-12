import { useEffect, useState } from 'react';
import api from '../api';

const emptyQuestion = { text: '', options: ['', '', '', ''], correctIndex: 0 };

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    timeLimitMinutes: 15,
    questions: [emptyQuestion],
    isEnabled: true,
    singleAttempt: true,
  });
  const [error, setError] = useState('');

  const loadQuizzes = () => {
    api.get('/admin/quizzes').then(({ data }) => setQuizzes(data));
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleQuestionChange = (index, field, value) => {
    setForm((prev) => {
      const questions = prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q));
      return { ...prev, questions };
    });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    setForm((prev) => {
      const questions = prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((opt, idx) => (idx === oIndex ? value : opt));
        return { ...q, options };
      });
      return { ...prev, questions };
    });
  };

  const addQuestion = () => {
    setForm((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion] }));
  };

  const removeQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/admin/quizzes/${editingId}`, form);
      } else {
        await api.post('/admin/quizzes', form);
      }
      setForm({
        title: '',
        category: '',
        timeLimitMinutes: 15,
        questions: [emptyQuestion],
        isEnabled: true,
        singleAttempt: true,
      });
      setEditingId(null);
      loadQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create quiz');
    }
  };

  const startEdit = (quiz) => {
    setEditingId(quiz._id);
    setForm({
      title: quiz.title,
      category: quiz.category,
      timeLimitMinutes: quiz.timeLimitMinutes,
      questions: quiz.questions?.length ? quiz.questions : [emptyQuestion],
      isEnabled: quiz.isEnabled,
      singleAttempt: quiz.singleAttempt,
    });
  };

  const toggleQuiz = async (quizId) => {
    await api.patch(`/admin/quizzes/${quizId}/toggle`);
    loadQuizzes();
  };

  const deleteQuiz = async (quizId) => {
    await api.delete(`/admin/quizzes/${quizId}`);
    loadQuizzes();
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{editingId ? 'Edit Quiz' : 'Create Quiz'}</h2>
        <p className="muted">Build quizzes with MCQ questions.</p>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="grid two">
          <label>
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            Category
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
          </label>
        </div>
        <div className="grid two">
          <label>
            Time limit (minutes)
            <input
              type="number"
              min="1"
              value={form.timeLimitMinutes}
              onChange={(e) => setForm({ ...form, timeLimitMinutes: Number(e.target.value) })}
              required
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.singleAttempt}
              onChange={(e) => setForm({ ...form, singleAttempt: e.target.checked })}
            />
            Single attempt only
          </label>
        </div>

        {form.questions.map((question, index) => (
          <div key={`q-${index}`} className="question-block">
            <div className="question-header">
              <h4>Question {index + 1}</h4>
              {form.questions.length > 1 && (
                <button type="button" className="btn ghost" onClick={() => removeQuestion(index)}>
                  Remove
                </button>
              )}
            </div>
            <label>
              Question text
              <input
                value={question.text}
                onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                required
              />
            </label>
            <div className="grid two">
              {question.options.map((opt, optIndex) => (
                <label key={`opt-${optIndex}`}>
                  Option {String.fromCharCode(65 + optIndex)}
                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                    required
                  />
                </label>
              ))}
            </div>
            <label>
              Correct option
              <select
                value={question.correctIndex}
                onChange={(e) => handleQuestionChange(index, 'correctIndex', Number(e.target.value))}
              >
                {question.options.map((_, optIndex) => (
                  <option key={`correct-${optIndex}`} value={optIndex}>
                    {String.fromCharCode(65 + optIndex)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}

        {error && <div className="alert">{error}</div>}

        <div className="actions">
          <button type="button" className="btn ghost" onClick={addQuestion}>Add question</button>
          <button type="submit" className="btn primary">
            {editingId ? 'Update quiz' : 'Create quiz'}
          </button>
        </div>
      </form>

      <div className="divider" />

      <div className="panel-header">
        <h3>Manage Quizzes</h3>
      </div>
      <div className="grid">
        {quizzes.map((quiz) => (
          <div key={quiz._id} className="card">
            <h4>{quiz.title}</h4>
            <p className="muted">{quiz.category}</p>
            <p className="meta">{quiz.timeLimitMinutes} min · {quiz.totalMarks} marks</p>
            <div className="actions">
              <button className="btn" onClick={() => startEdit(quiz)}>
                Edit
              </button>
              <button className="btn" onClick={() => toggleQuiz(quiz._id)}>
                {quiz.isEnabled ? 'Disable' : 'Enable'}
              </button>
              <button className="btn ghost" onClick={() => deleteQuiz(quiz._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQuizzes;
