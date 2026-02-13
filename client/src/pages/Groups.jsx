import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiUser, FiPlus, FiLogIn, FiX } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../auth.jsx';
import '../styles/dashboard.css';
import '../styles/groups.css';

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createNotice, setCreateNotice] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/groups');
      setGroups(data);
    } catch (err) {
      setError('Unable to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateNotice('');
    if (!name.trim()) {
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post('/groups', { name: name.trim() });
      setCreateNotice(`Group created. Share code: ${data.code}`);
      setName('');
      setActiveModal(null);
      loadGroups();
    } catch (err) {
      setCreateNotice('Unable to create group.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCode.trim()) {
      setJoinError('Enter a group code.');
      return;
    }
    setJoining(true);
    try {
      await api.post('/groups/join', { code: joinCode.trim() });
      setJoinCode('');
      setActiveModal(null);
      loadGroups();
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Unable to join group.');
    } finally {
      setJoining(false);
    }
  };

  const isTeacher = ['admin', 'teacher'].includes(user?.role);
  const hasGroups = !loading && groups.length > 0;

  const openCreateModal = () => {
    setCreateNotice('');
    setActiveModal('create');
  };

  const openJoinModal = () => {
    setJoinError('');
    setActiveModal('join');
  };

  return (
    <div className="dashboard-container">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1><FiUsers style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Groups & Classes</h1>
          <p>Create groups for classes or join with a shared code.</p>
        </div>
        {hasGroups && (
          <div className="welcome-actions group-corner-actions">
            {isTeacher && (
              <button type="button" className="btn btn-secondary" onClick={openCreateModal}>
                <FiPlus style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                Create Group
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={openJoinModal}>
              <FiLogIn style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Join Group
            </button>
          </div>
        )}
      </section>

      {!loading && !hasGroups && (
        <div className={`groups-setup-grid ${isTeacher ? 'two-col' : 'one-col'}`}>
          {isTeacher && (
            <section className="access-code-section">
              <h2>Create a Group</h2>
              <form className="access-form" onSubmit={handleCreate}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CS101 - Morning"
                  className="access-input"
                />
                <button className="btn btn-primary" type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </form>
              {createNotice && <div className="alert alert-error" style={{ background: '#e6ffe6', color: '#060', borderColor: '#6c6' }}>{createNotice}</div>}
            </section>
          )}

          <section className="access-code-section">
            <h2>Join a Group</h2>
            <form className="access-form" onSubmit={handleJoin}>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter group code..."
                className="access-input"
              />
              <button className="btn btn-primary" type="submit" disabled={joining}>
                {joining ? 'Joining...' : 'Join'}
              </button>
            </form>
            {joinError && <div className="alert alert-error">{joinError}</div>}
          </section>
        </div>
      )}

      {hasGroups && activeModal && (
        <div className="group-modal-overlay" onClick={() => setActiveModal(null)}>
          <section className="access-code-section group-modal" onClick={(e) => e.stopPropagation()}>
            <div className="group-modal-header">
              <h2>{activeModal === 'create' ? 'Create a Group' : 'Join a Group'}</h2>
              <button type="button" className="group-modal-close" onClick={() => setActiveModal(null)}>
                <FiX size={16} />
              </button>
            </div>

            {activeModal === 'create' && isTeacher && (
              <>
                <form className="access-form" onSubmit={handleCreate}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. CS101 - Morning"
                    className="access-input"
                  />
                  <button className="btn btn-primary" type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </form>
                {createNotice && <div className="alert alert-error" style={{ background: '#e6ffe6', color: '#060', borderColor: '#6c6' }}>{createNotice}</div>}
              </>
            )}

            {activeModal === 'join' && (
              <>
                <form className="access-form" onSubmit={handleJoin}>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter group code..."
                    className="access-input"
                  />
                  <button className="btn btn-primary" type="submit" disabled={joining}>
                    {joining ? 'Joining...' : 'Join'}
                  </button>
                </form>
                {joinError && <div className="alert alert-error">{joinError}</div>}
              </>
            )}
          </section>
        </div>
      )}

      <section className="quizzes-section">
        <div className="section-header">
          <h2>Your Groups</h2>
        </div>
        <div className="quiz-grid">
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="quiz-card skeleton" />
          ))}
          {!loading && groups.map((group) => (
            <div key={group._id} className="quiz-card">
              <div className="quiz-header category-general">
                <div className="quiz-icon"><FiUsers /></div>
                <span className="quiz-category">{group.code}</span>
              </div>
              <h3 className="quiz-title">{group.name}</h3>
              <div className="quiz-meta">
                <span><FiUser style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} /> {group.members?.length ?? 0} members</span>
              </div>
              <div className="quiz-actions">
                <Link className="btn btn-secondary" to={`/groups/${group._id}`}>Open Group</Link>
              </div>
            </div>
          ))}
          {!loading && error && <div className="alert alert-error">{error}</div>}
          {!loading && !error && !groups.length && (
            <div className="empty-state"><p>No groups yet. Create one or join with a code!</p></div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Groups;
