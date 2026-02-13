import { useEffect, useState } from 'react';
import { FiDatabase, FiPlus, FiTrash2, FiUpload, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../auth';
import '../styles/dashboard.css';
import '../styles/question-bank.css';

const emptyQuestion = { text: '', options: ['', '', '', ''], correctIndex: 0, category: '', scope: 'personal' };

const QuestionBank = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyQuestion });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);
  const [importScope, setImportScope] = useState('personal');

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ scope });
      if (categoryFilter.trim()) params.set('category', categoryFilter.trim());
      const { data } = await api.get(`/admin/questions?${params}`);
      setQuestions(data);
    } catch {
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [scope, categoryFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      await api.post('/admin/questions', form);
      setNotice('Question added successfully.');
      setForm({ ...emptyQuestion });
      setShowForm(false);
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch {
      setError('Failed to delete question.');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    setNotice('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scope', importScope);
    try {
      const { data } = await api.post('/admin/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const insertedCount = Number(data.inserted || 0);
      const skippedCount = Number(data.skipped || 0);
      const importedLabel = insertedCount === 1 ? 'question' : 'questions';
      const skippedText = skippedCount > 0
        ? ` ${skippedCount} ${skippedCount === 1 ? 'question was' : 'questions were'} skipped.`
        : '';
      setNotice(`Imported ${insertedCount} ${importedLabel}.${skippedText}`);
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleOptionChange = (index, value) => {
    setForm((prev) => {
      const options = prev.options.map((o, i) => (i === index ? value : o));
      return { ...prev, options };
    });
  };

  const categories = Array.from(new Set(questions.map((q) => q.category).filter(Boolean)));

  const canDeleteQuestion = (question) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    const createdBy = typeof question.createdBy === 'string'
      ? question.createdBy
      : question.createdBy?._id;

    return Boolean(createdBy) && String(createdBy) === String(user.id);
  };

  return (
    <div className="dashboard-container">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1><FiDatabase style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Question Bank</h1>
          <p>Create, import, and manage reusable questions for your quizzes.</p>
        </div>
      </section>

      {/* Toolbar */}
      <div className="qb-toolbar">
        <div className="qb-actions">
          <label className="btn btn-secondary qb-import-btn">
            <FiUpload size={14} /> {importing ? 'Importing...' : 'Import Excel'}
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} hidden disabled={importing} />
          </label>
          <select className="qb-import-scope" value={importScope} onChange={(e) => setImportScope(e.target.value)}>
            <option value="personal">Import as Personal</option>
            <option value="global">Import as Global</option>
          </select>
          <button type="button" className="btn btn-primary"  onClick={() => setShowForm(!showForm)}>
            {showForm ? <><FiX size={14} /> Cancel</> : <><FiPlus size={14} /> Add Question</>}
          </button>
        </div>
      </div>

      {/* Notices */}
      {error && <div className="alert alert-error qb-alert">{error}</div>}
      {notice && <div className="alert qb-alert qb-alert-success">{notice}</div>}

      {/* Create Form */}
      {showForm && (
        <form className="qb-form" onSubmit={handleCreate}>
          <h3>New Question</h3>
          <label className="form-field">
            <span>Question Text</span>
            <input
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="e.g. What is the capital of France?"
              required
            />
          </label>
          <div className="qb-form-row">
            <label className="form-field">
              <span>Category</span>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Geography"
                required
                list="qb-categories"
              />
              <datalist id="qb-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>
            <label className="form-field">
              <span>Scope</span>
              <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                <option value="personal">Personal</option>
                <option value="global">Global</option>
              </select>
            </label>
          </div>
          <div className="qb-options-grid">
            {form.options.map((opt, idx) => (
              <label key={idx} className={`qb-option-field ${form.correctIndex === idx ? 'correct' : ''}`}>
                <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                <input
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  required
                />
                <input
                  type="radio"
                  name="correctIndex"
                  checked={form.correctIndex === idx}
                  onChange={() => setForm({ ...form, correctIndex: idx })}
                  title="Mark as correct"
                />
              </label>
            ))}
          </div>
          <div className="qb-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : <><FiCheck size={14} /> Save Question</>}
            </button>
          </div>
        </form>
      )}

      {/* Questions List */}
      <section className="quizzes-table-wrapper">
        <div className="qb-list-toolbar">
          <div className="qb-filters">
            <div className="qb-scope-tabs">
              {[
                { value: 'all', label: 'All' },
                { value: 'personal', label: 'My Questions' },
                { value: 'global', label: 'Global' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`qb-tab ${scope === s.value ? 'active' : ''}`}
                  onClick={() => setScope(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="qb-search">
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Filter by category..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
              {categoryFilter && (
                <button type="button" className="qb-clear" onClick={() => setCategoryFilter('')}>
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.6 }}>
          {loading ? 'Loading questions...' : `${questions.length} questions`}
        </div>
        <div className="table-header" style={{ gridTemplateColumns: '3fr 1fr 1fr 0.5fr' }}>
          <span>Question</span>
          <span>Category</span>
          <span>Scope</span>
          <span>Actions</span>
        </div>
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="table-row skeleton" style={{ height: '72px' }} />
        ))}
        {!loading && questions.map((q) => (
          <div key={q._id} className="table-row" style={{ gridTemplateColumns: '3fr 1fr 1fr 0.5fr' }}>
            <div className="qb-question-cell">
              <p className="qb-question-text">{q.text}</p>
              <div className="qb-options-preview">
                {q.options.map((opt, idx) => (
                  <span key={idx} className={`qb-option-tag ${idx === q.correctIndex ? 'correct' : ''}`}>
                    {String.fromCharCode(65 + idx)}. {opt}
                  </span>
                ))}
              </div>
            </div>
            <span><span className="category-badge">{q.category}</span></span>
            <span><span className={`scope-badge ${q.scope}`}>{q.scope === 'global' ? 'Global' : 'Personal'}</span></span>
            <span>
              {canDeleteQuestion(q) && (
                <button
                  type="button"
                  className="icon-btn"
                  title="Delete question"
                  onClick={() => handleDelete(q._id)}
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </span>
          </div>
        ))}
        {!loading && !questions.length && (
          <div className="empty-state">
            <p>No questions found. Add some or import from Excel!</p>
            <button type="button" className="btn btn-primary qb-empty-cta" onClick={() => setShowForm(true)}>
              <FiPlus size={14} /> Add Question
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default QuestionBank;
