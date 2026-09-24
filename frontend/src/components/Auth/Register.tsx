import { FormEvent, useState } from 'react';
import { registerUser } from '../../api/authApi';

interface Props {
  onRegister: (user: {
    id: string;
    name: string;
    email: string;
    color: string;
  }) => void;
  onShowLogin: () => void;
}

export function Register({ onRegister, onShowLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await registerUser(
        name,
        email,
        password
      );

      // Save authentication token
      localStorage.setItem('syncdoc-token', response.token);

      // Create local user object
      const user = {
        ...response.user,
        color: '#6E5ADB',
      };

      // Save logged-in user
      localStorage.setItem(
        'syncdoc-user',
        JSON.stringify(user)
      );

      // Update application state
      onRegister(user);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>SyncDoc</h1>

        <h2>Create Account</h2>

        <p className="auth-subtitle">
          Create an account to start using SyncDoc.
        </p>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Name */}
          <label htmlFor="register-name">Name</label>

          <input
            id="register-name"
            type="text"
            name="register-name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Enter your name"
            autoComplete="off"
            required
          />

          {/* Email */}
          <label htmlFor="register-email">Email</label>

          <input
            id="register-email"
            type="email"
            name="register-email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Enter your email"
            autoComplete="off"
            required
          />

          {/* Password */}
          <label htmlFor="register-password">Password</label>

          <input
            id="register-password"
            type="password"
            name="register-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="At least 6 characters"
            autoComplete="new-password"
            minLength={6}
            required
          />

          {/* Error */}
          {error && (
            <p className="auth-error">{error}</p>
          )}

          {/* Register button */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? 'Creating account…'
              : 'Register'}
          </button>
        </form>

        {/* Login link */}
        <p className="auth-switch">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onShowLogin}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}