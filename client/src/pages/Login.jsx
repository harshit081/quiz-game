import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../auth.jsx';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
            <p className="eyebrow">Sign in</p>
            <h2>This world needs you</h2>
            <p className="muted">Play live quizzes, climb leaderboards, and mentor your groups.</p>
          </div>
        </section>

        <section className="auth-card cinematic-card">
          <div className="auth-header">
            <div className="auth-logo" aria-hidden="true">
              <FiBookOpen size={28} />
            </div>
            <div>
              <p className="eyebrow">Welcome back</p>
              <h2>Log in to QuizForge</h2>
              <p className="muted">Access your quizzes, groups, and stats.</p>
            </div>
          </div>
          <form className="form" onSubmit={handleSubmit}>
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
            <p className="helper">Use the email you registered with.</p>
            {error && <div className="alert">{error}</div>}
            <button className="btn primary" type="submit">Log in</button>
          </form>
          <p className="muted">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
