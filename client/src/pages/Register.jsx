import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiRadio } from 'react-icons/fi';
import { useAuth } from '../auth.jsx';

const Register = () => {
  const [step, setStep] = useState('role');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    adminSecret: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleSelect = (role) => {
    setForm((prev) => ({ ...prev, role }));
    setStep('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-shell cinematic">
      <div className="auth-frame">
        <section className="auth-visual">
          <div className="brand-chip">
            <span className="brand-mark" aria-hidden="true">QF</span>
            <span>QuizForge</span>
          </div>
          <div className="auth-art">
            <div className="planet" />
            <div className="moon" />
            <div className="glow-orb" />
            <div className="comet" />
          </div>
          <div className="auth-tagline">
            <p className="eyebrow">Get started</p>
            <h2>Build your next live class</h2>
            <p className="muted">Create quizzes, groups, and global challenges with ease.</p>
          </div>
        </section>

        <section className="auth-card cinematic-card">
          {step === 'role' ? (
            <div className="role-step">
              <div className="auth-header">
                <div className="auth-logo" aria-hidden="true">
                  <FiRadio size={28} />
                </div>
                <div>
                  <p className="eyebrow">Choose role</p>
                  <h2>Who are you joining as?</h2>
                  <p className="muted">Pick the role that best fits your use.</p>
                </div>
              </div>
              <div className="role-grid">
                <button className="role-card role-student" type="button" onClick={() => handleRoleSelect('student')}>
                  <span className="role-icon" aria-hidden="true">S</span>
                  <div>
                    <h4>Student</h4>
                    <p>Join quizzes and track progress.</p>
                  </div>
                </button>
                <button className="role-card role-teacher" type="button" onClick={() => handleRoleSelect('teacher')}>
                  <span className="role-icon" aria-hidden="true">T</span>
                  <div>
                    <h4>Teacher</h4>
                    <p>Create quizzes and manage groups.</p>
                  </div>
                </button>
                <button className="role-card role-admin" type="button" onClick={() => handleRoleSelect('admin')}>
                  <span className="role-icon" aria-hidden="true">A</span>
                  <div>
                    <h4>Admin</h4>
                    <p>Oversee users and global content.</p>
                  </div>
                </button>
              </div>
              <p className="muted">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <div className="auth-logo" aria-hidden="true">
                  <FiRadio size={28} />
                </div>
                <div>
                  <p className="eyebrow">Get started</p>
                  <h2>Create your account</h2>
                  <p className="muted">Role selected: {form.role}</p>
                </div>
                <button className="btn ghost" type="button" onClick={() => setStep('role')}>
                  Change role
                </button>
              </div>
              <form className="form" onSubmit={handleSubmit}>
                <label>
                  Full name
                  <div className="input-icon">
                    <span aria-hidden="true">
                      <FiUser size={18} />
                    </span>
                    <input name="name" value={form.name} onChange={handleChange} required />
                  </div>
                </label>
                <label>
                  Email
                  <div className="input-icon">
                    <span aria-hidden="true">
                      <FiMail size={18} />
                    </span>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required />
                  </div>
                </label>
                <label>
                  Password
                  <div className="input-icon">
                    <span aria-hidden="true">
                      <FiLock size={18} />
                    </span>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                    </button>
                  </div>
                </label>
                <p className="helper">Use at least 8 characters for a stronger password.</p>
                {form.role === 'admin' && (
                  <label>
                    Admin secret
                    <input name="adminSecret" value={form.adminSecret} onChange={handleChange} required />
                  </label>
                )}
                {form.role === 'admin' && (
                  <p className="helper">Ask your instructor for the admin secret key.</p>
                )}
                {error && <div className="alert">{error}</div>}
                <button className="btn primary" type="submit">Register</button>
              </form>
              <p className="muted">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Register;
