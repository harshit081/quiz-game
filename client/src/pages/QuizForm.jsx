import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiGlobe, FiUsers, FiLock, FiEdit2, FiFileText, FiCheck, FiCopy, FiKey, FiBook, FiX, FiPlus } from 'react-icons/fi';
import api from '../api';
import '../styles/dashboard.css';
import '../styles/quiz-form.css';

const emptyQuestion = { text: '', options: ['', '', '', ''], correctIndex: 0 };

const QuizForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    category: '',
    timeLimitMinutes: 15,
    questions: [{ ...emptyQuestion }],
    isEnabled: true,
    singleAttempt: true,
    accessType: 'global',
    accessCode: '',
    groupId: '',
  });

  const [groups, setGroups] = useState([]);
  const [bank, setBank] = useState([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankScope, setBankScope] = useState('all');
  const [bankCategory, setBankCategory] = useState('');
  const [showBank, setShowBank] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      api.get(`/admin/quizzes/${id}`)
        .then(({ data }) => {
          setForm({
            title: data.title,
            category: data.category,
            timeLimitMinutes: data.timeLimitMinutes,
            questions: data.questions?.length ? data.questions : [{ ...emptyQuestion }],
            isEnabled: data.isEnabled,
            singleAttempt: data.singleAttempt,
            accessType: data.accessType || 'global',
            accessCode: data.accessCode || '',
            groupId: data.group || '',
          });
        })
        .catch(() => setError('Failed to load quiz.'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  useEffect(() => {
    loadBank();
  }, [bankScope, bankCategory]);

  const loadGroups = async () => {
    try {
      const { data } = await api.get('/groups?scope=owned');
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups', err);
    }
  };

  const loadBank = async () => {
    setBankLoading(true);
    try {
      const params = new URLSearchParams({ scope: bankScope });
      if (bankCategory) params.set('category', bankCategory);
      const { data } = await api.get(`/admin/questions?${params}`);
      setBank(data);
    } catch {
      // ignore
    } finally {
      setBankLoading(false);
    }
  };

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
    setForm((prev) => ({ ...prev, questions: [...prev.questions, { ...emptyQuestion }] }));
  };

  const removeQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const addFromBank = (question) => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { text: question.text, options: [...question.options], correctIndex: question.correctIndex },
      ],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    const payload = {
      title: form.title,
      category: form.category,
      timeLimitMinutes: form.timeLimitMinutes,
      questions: form.questions,
      isEnabled: form.isEnabled,
      singleAttempt: form.singleAttempt,
      accessType: form.accessType,
      groupId: form.accessType === 'group' ? form.groupId : undefined,
    };

    try {
      if (isEditing) {
        await api.put(`/admin/quizzes/${id}`, payload);
        setNotice('Quiz updated successfully.');
      } else {
        await api.post('/admin/quizzes', payload);
        setNotice('Quiz created successfully.');
      }
      setTimeout(() => navigate('/admin/quizzes'), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save quiz.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">Loading quiz...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1>{isEditing ? <><FiEdit2 style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Edit Quiz</> : <><FiFileText style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Create Quiz</>}</h1>
          <p>Build quizzes with MCQ questions. Students see one question at a time with a live timer.</p>
        </div>
      </section>

      <form className="quiz-form" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <label className="form-field">
              <span>Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. JavaScript Fundamentals"
                required
              />
            </label>
            <label className="form-field">
              <span>Category</span>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Programming"
                required
              />
            </label>
            <label className="form-field">
              <span>Time Limit (minutes)</span>
              <input
                type="number"
                min="1"
                value={form.timeLimitMinutes}
                onChange={(e) => setForm({ ...form, timeLimitMinutes: Number(e.target.value) })}
                required
              />
            </label>
          </div>
          <div className="form-toggles">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={form.singleAttempt}
                onChange={(e) => setForm({ ...form, singleAttempt: e.target.checked })}
              />
              <span>Single attempt only</span>
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={form.isEnabled}
                onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
              />
              <span>Publish immediately</span>
            </label>
          </div>
        </div>

        {/* Access Settings */}
        <div className="form-section">
          <h2>Access Settings</h2>
          <div className="access-options">
            {[
              { value: 'global', icon: <FiGlobe />, label: 'Public', desc: 'Anyone can access' },
              { value: 'group', icon: <FiUsers />, label: 'Group Only', desc: 'Restricted to a group' },
              { value: 'code', icon: <FiLock />, label: 'Access Code', desc: 'Requires a code' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`access-option ${form.accessType === opt.value ? 'active' : ''}`}
                onClick={() => setForm({ ...form, accessType: opt.value })}
              >
                <span className="access-option-icon">{opt.icon}</span>
                <strong>{opt.label}</strong>
                <span className="access-option-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
          {form.accessType === 'group' && (
            <label className="form-field" style={{ marginTop: '1rem' }}>
              <span>Select Group</span>
              <select
                value={form.groupId}
                onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                required
              >
                <option value="">-- Choose a group --</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>{g.name} ({g.code})</option>
                ))}
              </select>
            </label>
          )}
          {form.accessType === 'code' && (
            <div style={{ marginTop: '1rem' }}>
              <span className="form-field" style={{ marginBottom: '0.5rem' }}>
                <span>Access Code</span>
              </span>
              {isEditing && form.accessCode ? (
                <div className="code-display">
                  <code className="code-value">{form.accessCode}</code>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText(form.accessCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                  >
                    {codeCopied ? <><FiCheck size={14} /> Copied</> : <><FiCopy size={14} /> Copy</>}
                  </button>
                </div>
              ) : (
                <div className="code-display" style={{ justifyContent: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <FiKey style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> A unique access code will be auto-generated when you save
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="form-section">
          <div className="section-title-row">
            <h2>Questions ({form.questions.length})</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowBank(!showBank)}>
                {showBank ? 'Hide Bank' : <><FiBook size={14} /> Question Bank</>}
              </button>
              <button type="button" className="btn btn-primary" onClick={addQuestion}>
                <FiPlus size={14} /> Add Question
              </button>
            </div>
          </div>

          {form.questions.map((question, index) => (
            <div key={index} className="question-card">
              <div className="question-card-header">
                <h3>Question {index + 1}</h3>
                {form.questions.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeQuestion(index)}>
                    <FiX size={16} />
                  </button>
                )}
              </div>
              <label className="form-field">
                <span>Question text</span>
                <input
                  value={question.text}
                  onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                  placeholder="Enter your question"
                  required
                />
              </label>
              <div className="options-grid">
                {question.options.map((opt, optIndex) => (
                  <label key={optIndex} className={`option-field ${question.correctIndex === optIndex ? 'correct' : ''}`}>
                    <span className="option-letter">{String.fromCharCode(65 + optIndex)}</span>
                    <input
                      value={opt}
                      onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                      required
                    />
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={question.correctIndex === optIndex}
                      onChange={() => handleQuestionChange(index, 'correctIndex', optIndex)}
                      title="Mark as correct"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>{notice}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/quizzes')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </form>

      {/* Question Bank Drawer */}
      {showBank && (
        <div className="bank-drawer">
          <div className="bank-header">
            <h2><FiBook style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Question Bank</h2>
            <button type="button" className="btn-remove" onClick={() => setShowBank(false)}><FiX size={16} /></button>
          </div>
          <div className="bank-filters">
            <select value={bankScope} onChange={(e) => setBankScope(e.target.value)}>
              <option value="all">All Questions</option>
              <option value="personal">My Questions</option>
              <option value="global">Global Questions</option>
            </select>
            <input
              value={bankCategory}
              onChange={(e) => setBankCategory(e.target.value)}
              placeholder="Filter by category..."
            />
          </div>
          <div className="bank-list">
            {bankLoading ? (
              <div className="empty-state">Loading questions...</div>
            ) : bank.length > 0 ? (
              bank.map((q) => (
                <div key={q._id} className="bank-item">
                  <div className="bank-item-content">
                    <p className="bank-question-text">{q.text}</p>
                    <span className="category-badge">{q.category}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => addFromBank(q)}
                  >
                    + Add
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">No questions found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizForm;
