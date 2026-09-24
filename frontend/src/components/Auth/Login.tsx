import { FormEvent, useState } from 'react';
import { loginUser } from '../../api/authApi';

interface Props {
  onLogin: (user: {
    id: string;
    name: string;
    email: string;
    color: string;
  }) => void;
  onShowRegister: () => void;
}

export function Login({ onLogin, onShowRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await loginUser(email, password);

      // Save authentication token
      localStorage.setItem('syncdoc-token', response.token);

      // Create local user object
      const user = {
        ...response.user,
        color: '#6E5ADB',
      };

      // Save logged-in user
      localStorage.setItem('syncdoc-user', JSON.stringify(user));

      // Update application state
      onLogin(user);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Login failed. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>SyncDoc</h1>

        <h2>Login</h2>

        <p className="auth-subtitle">
          Login to continue to your documents.
        </p>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Email */}
          <label htmlFor="login-email">Email</label>

          <input
            id="login-email"
            type="email"
            name="login-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            autoComplete="off"
            required
          />

          {/* Password */}
          <label htmlFor="login-password">Password</label>

          <input
            id="login-password"
            type="password"
            name="login-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="new-password"
            required
          />

          {/* Error */}
          {error && <p className="auth-error">{error}</p>}

          {/* Login button */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        {/* Register link */}
        <p className="auth-switch">
          Don't have an account?{' '}
          <button type="button" onClick={onShowRegister}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
}