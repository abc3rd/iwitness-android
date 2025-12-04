import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Unable to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #0f172a, #020617 55%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: 'rgba(15,23,42,0.9)',
          borderRadius: 16,
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>iWitness – Secure Sign In</h1>
        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>
          Face 2 Face encrypted channel. No public or anonymous access.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <label style={{ fontSize: 13 }}>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </label>

          {error && (
            <div style={{ fontSize: 12, color: '#f97373' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: 8,
              padding: '0.6rem 1rem',
              borderRadius: 999,
              border: 'none',
              background: isSubmitting
                ? 'rgba(148,163,184,0.6)'
                : 'linear-gradient(90deg,#ea00ea,#2699fe)',
              color: 'white',
              fontWeight: 600,
              cursor: isSubmitting ? 'default' : 'pointer',
            }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
          By continuing, you acknowledge that all sessions are logged and securely stored by Omega
          UI / Face 2 Face.
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 4,
  padding: '0.5rem 0.75rem',
  borderRadius: 999,
  border: '1px solid rgba(148,163,184,0.7)',
  background: 'rgba(15,23,42,0.7)',
  color: 'white',
  fontSize: 13,
};
