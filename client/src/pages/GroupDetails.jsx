import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiUsers, FiUser, FiHash, FiUserMinus, FiLogOut } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../auth.jsx';
import '../styles/dashboard.css';
import '../styles/groups.css';

const GroupDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState('');

  const loadGroup = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/groups/${id}`);
      setGroup(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load group details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/groups/${id}`);
        if (mounted) setGroup(data);
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Unable to load group details.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const currentUserId = String(user?.id || '');
  const ownerId = String(group?.createdBy?._id || group?.createdBy || '');
  const isOwner = Boolean(currentUserId && ownerId && currentUserId === ownerId);
  const isAdmin = user?.role === 'admin';
  const canManageMembers = isOwner || isAdmin;
  const isMember = (group?.members || []).some((member) => String(member?._id || member) === currentUserId);

  const handleLeaveGroup = async () => {
    setActionError('');
    setActionNotice('');
    setLeaving(true);
    try {
      await api.post(`/groups/${id}/leave`);
      navigate('/groups');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Unable to leave group.');
    } finally {
      setLeaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setActionError('');
    setActionNotice('');
    setRemovingMemberId(memberId);
    try {
      await api.delete(`/groups/${id}/members/${memberId}`);
      setActionNotice('Member removed successfully.');
      await loadGroup();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Unable to remove member.');
    } finally {
      setRemovingMemberId('');
    }
  };

  return (
    <div className="dashboard-container">
      <section className="welcome-section">
        <div className="welcome-content">
          <h1><FiUsers style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> {group?.name || 'Group Details'}</h1>
          <p>View group info and members.</p>
        </div>
        <div className="welcome-actions">
          {isMember && !isOwner && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLeaveGroup}
              disabled={leaving}
            >
              <FiLogOut style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
              {leaving ? 'Leaving...' : 'Leave Group'}
            </button>
          )}
          <Link className="btn btn-secondary" to="/groups">Back to Groups</Link>
        </div>
      </section>

      {loading && (
        <section className="quizzes-table-wrapper">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`member-skeleton-${index}`} className="table-row skeleton" style={{ height: '56px' }} />
          ))}
        </section>
      )}

      {!loading && error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && actionError && <div className="alert alert-error">{actionError}</div>}
      {!loading && !error && actionNotice && <div className="alert group-success-alert">{actionNotice}</div>}

      {!loading && !error && group && (
        <>
          <section className="quizzes-table-wrapper group-summary">
            <div className="group-info-item"><FiHash /> <strong>Code:</strong> {group.code}</div>
            <div className="group-info-item"><FiUser /> <strong>Owner:</strong> {group.createdBy?.name || 'Unknown'}</div>
            <div className="group-info-item"><FiUsers /> <strong>Members:</strong> {group.members?.length || 0}</div>
          </section>

          <section className="quizzes-table-wrapper">
            <div className="section-header">
              <h2>Members</h2>
            </div>
            <div className="table-header" style={{ gridTemplateColumns: canManageMembers ? '1.5fr 2fr 1fr auto' : '1.5fr 2fr 1fr' }}>
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              {canManageMembers && <span>Actions</span>}
            </div>
            {(group.members || []).map((member) => (
              <div key={member._id} className="table-row" style={{ gridTemplateColumns: canManageMembers ? '1.5fr 2fr 1fr auto' : '1.5fr 2fr 1fr' }}>
                <span>{member.name}</span>
                <span>{member.email}</span>
                <span style={{ textTransform: 'capitalize' }}>{member.role}</span>
                {canManageMembers && (
                  <span className="group-member-action">
                    {String(member._id) === ownerId ? (
                      <span className="owner-tag">Owner</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary group-remove-btn"
                        onClick={() => handleRemoveMember(member._id)}
                        disabled={removingMemberId === member._id}
                      >
                        <FiUserMinus style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                        {removingMemberId === member._id ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </span>
                )}
              </div>
            ))}
            {!group.members?.length && (
              <div className="empty-state">
                <p>No members found.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default GroupDetails;
