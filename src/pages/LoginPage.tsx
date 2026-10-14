import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/products');
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate data-testid="login-form">
        <h1>Log in</h1>
        <p className="muted">Welcome back! Please enter your details.</p>

        {error && (
          <div className="alert" role="alert" data-testid="form-error">
            {error}
          </div>
        )}

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="login-email"
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="login-password"
        />

        <button type="submit" className="btn" disabled={loading} data-testid="login-submit">
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <p className="muted center">
          Don&apos;t have an account?{' '}
          <Link to="/signup" data-testid="go-to-signup">
            Sign up
          </Link>
        </p>
        <p className="hint" data-testid="demo-credentials">
          Demo: demo@example.com / password123
        </p>
      </form>
    </div>
  );
}
