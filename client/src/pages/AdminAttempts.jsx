import { useEffect, useState } from 'react';
import api from '../api';

const AdminAttempts = () => {
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    api.get('/admin/attempts').then(({ data }) => setAttempts(data));
  }, []);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Student Attempts</h2>
        <p className="muted">Review submissions and scores.</p>
      </div>
      <div className="table">
        <div className="table-row header">
          <span>Student</span>
          <span>Quiz</span>
          <span>Score</span>
          <span>Date</span>
        </div>
        {attempts.map((attempt) => (
          <div key={attempt._id} className="table-row">
            <span>{attempt.user?.name} ({attempt.user?.email})</span>
            <span>{attempt.quiz?.title}</span>
            <span>{attempt.score}</span>
            <span>{new Date(attempt.attemptDate).toLocaleString()}</span>
          </div>
        ))}
        {!attempts.length && <p className="muted">No attempts yet.</p>}
      </div>
    </div>
  );
};

export default AdminAttempts;
