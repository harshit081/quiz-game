import { useEffect, useState } from 'react';
import api from '../api';

const emptyQuestion = { text: '', options: ['', '', '', ''], correctIndex: 0 };

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bank, setBank] = useState([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: '',
    timeLimitMinutes: 15,
    questions: [emptyQuestion],
    isEnabled: true,
    singleAttempt: true,
    accessCode: '',
  });
  const [bankForm, setBankForm] = useState({
    text: '',
    category: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/quizzes');
      setQuizzes(data);
    } finally {
      setLoading(false);
    }
  };

  const loadBank = async () => {
    setBankLoading(true);
    setBankError('');
    try {
      const { data } = await api.get('/admin/questions');
      setBank(data);
    } catch (err) {
      setBankError('Unable to load question bank.');
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
    loadBank();
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

  const addFromBank = (question) => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: question.text,
          options: [...question.options],
          correctIndex: question.correctIndex,
        },
      ],
    }));
  };

  const saveBankQuestion = async (e) => {
    e.preventDefault();
    setBankError('');
    try {
      await api.post('/admin/questions', bankForm);
      setBankForm({ text: '', category: '', options: ['', '', '', ''], correctIndex: 0 });
      loadBank();
    } catch (err) {
      setBankError(err.response?.data?.message || 'Unable to save question.');
    }
  };

  const deleteBankQuestion = async (id) => {
    const confirmed = window.confirm('Delete this question from the bank?');
    if (!confirmed) return;
    await api.delete(`/admin/questions/${id}`);
    loadBank();
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
    setNotice('');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/quizzes/${editingId}`, form);
        setNotice('Quiz updated successfully.');
      } else {
        await api.post('/admin/quizzes', form);
        setNotice('Quiz created successfully.');
      }
      setForm({
        title: '',
        category: '',
        timeLimitMinutes: 15,
        questions: [emptyQuestion],
        isEnabled: true,
        singleAttempt: true,
        accessCode: '',
      });
      setEditingId(null);
      loadQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create quiz');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (quiz) => {
    setEditingId(quiz._id);
    setNotice('');
    setForm({
      title: quiz.title,
      category: quiz.category,
      timeLimitMinutes: quiz.timeLimitMinutes,
      questions: quiz.questions?.length ? quiz.questions : [emptyQuestion],
      isEnabled: quiz.isEnabled,
      singleAttempt: quiz.singleAttempt,
      accessCode: '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      title: '',
      category: '',
      timeLimitMinutes: 15,
      questions: [emptyQuestion],
      isEnabled: true,
      singleAttempt: true,
      accessCode: '',
    });
    setNotice('');
  };

  const toggleQuiz = async (quizId) => {
    await api.patch(`/admin/quizzes/${quizId}/toggle`);
    loadQuizzes();
  };

  const deleteQuiz = async (quizId) => {
    const confirmed = window.confirm('Delete this quiz? This cannot be undone.');
    if (!confirmed) return;
    await api.delete(`/admin/quizzes/${quizId}`);
    loadQuizzes();
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{editingId ? 'Edit Quiz' : 'Create Quiz'}</h2>
        <p className="muted">Build quizzes with MCQ questions.</p>
      </div>
      <div className="info-banner">
        <p>
          Keep questions short and focused. Students see one question at a time with a live timer.
        </p>
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
          <label>
            Access code (optional)
            <input
              value={form.accessCode}
              onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
              placeholder="Leave blank for public quiz"
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
        {notice && <div className="notice">{notice}</div>}

        <div className="actions">
          <button type="button" className="btn ghost" onClick={addQuestion}>Add question</button>
          {editingId && (
            <button type="button" className="btn" onClick={cancelEdit}>
              Cancel edit
            </button>
          )}
          <button type="submit" className="btn primary" disabled={saving}>
            {editingId ? 'Update quiz' : 'Create quiz'}
          </button>
        </div>
      </form>

      <div className="divider" />

      <div className="panel-header">
        <h3>Question Bank</h3>
        <p className="muted">Reuse questions across quizzes.</p>
      </div>
      <form className="form" onSubmit={saveBankQuestion}>
        <div className="grid two">
          <label>
            Question text
            <input
              value={bankForm.text}
              onChange={(e) => setBankForm({ ...bankForm, text: e.target.value })}
              required
            />
          </label>
          <label>
            Category
            <input
              value={bankForm.category}
              onChange={(e) => setBankForm({ ...bankForm, category: e.target.value })}
              required
            />
          </label>
        </div>
        <div className="grid two">
          {bankForm.options.map((opt, index) => (
            <label key={`bank-opt-${index}`}>
              Option {String.fromCharCode(65 + index)}
              <input
                value={opt}
                onChange={(e) => {
                  const options = bankForm.options.map((value, idx) => (idx === index ? e.target.value : value));
                  setBankForm({ ...bankForm, options });
                }}
                required
              />
            </label>
          ))}
        </div>
        <label>
          Correct option
          <select
            value={bankForm.correctIndex}
            onChange={(e) => setBankForm({ ...bankForm, correctIndex: Number(e.target.value) })}
          >
            {bankForm.options.map((_, index) => (
              <option key={`bank-correct-${index}`} value={index}>
                {String.fromCharCode(65 + index)}
              </option>
            ))}
          </select>
        </label>
        <div className="actions">
          <button className="btn" type="submit">Save to bank</button>
        </div>
        {bankError && <div className="alert">{bankError}</div>}
      </form>

      <div className="grid bank-grid">
        {bankLoading && Array.from({ length: 3 }).map((_, index) => (
          <div key={`bank-skeleton-${index}`} className="card skeleton" />
        ))}
        {!bankLoading && bank.map((question) => (
          <div key={question._id} className="card">
            <div className="card-header">
              <h4>{question.text}</h4>
              <span className="pill">{question.category}</span>
            </div>
            <ol className="option-list">
              {question.options.map((opt, idx) => (
                <li key={`bank-${question._id}-${idx}`} className={idx === question.correctIndex ? 'correct' : ''}>
                  {String.fromCharCode(65 + idx)}. {opt}
                </li>
              ))}
            </ol>
            <div className="actions">
              <button className="btn" type="button" onClick={() => addFromBank(question)}>
                Add to quiz
              </button>
              <button className="btn ghost" type="button" onClick={() => deleteBankQuestion(question._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {!bankLoading && !bank.length && (
          <div className="empty">
            <p className="muted">No question bank items yet.</p>
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="panel-header">
        <h3>Manage Quizzes</h3>
      </div>
      <div className="grid">
        {loading && Array.from({ length: 3 }).map((_, index) => (
          <div key={`quiz-skeleton-${index}`} className="card skeleton" />
        ))}
        {!loading && quizzes.map((quiz) => (
          <div key={quiz._id} className="card">
            <div className="card-header">
              <h4>{quiz.title}</h4>
              <span className={`status ${quiz.isEnabled ? 'live' : 'draft'}`}>
                {quiz.isEnabled ? 'Live' : 'Disabled'}
              </span>
            </div>
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
        {!loading && !quizzes.length && (
          <div className="empty">
            <p className="muted">No quizzes created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuizzes;
