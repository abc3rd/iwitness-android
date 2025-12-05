// src/pages/LoginPage.tsx
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signup'); // default to Sign up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    try {
      setIsSubmitting(true);
      // For now, password is not validated server-side; we just accept it.
      await signIn(email.trim(), password);

      // If signIn succeeds, send them into the app
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Sign in failed', err);
      setError('Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    mode === 'signup' ? 'Create Your Eyewitness Access' : 'Eyewitness Access';
  const subtitle =
    mode === 'signup'
      ? 'Sign up to report accidents, capture evidence, and track your referrals.'
      : 'Sign in to report accidents, capture evidence, and track your referrals.';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #020617 0, #020617 40%, #000 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 24,
          border: '1px solid #1e293b',
          background:
            'radial-gradient(circle at top left, rgba(234,0,234,0.15), transparent 55%), radial-gradient(circle at bottom right, rgba(38,153,254,0.15), transparent 55%), #020617',
          padding: 32,
          boxShadow: '0 24px 80px rgba(15,23,42,0.9)',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: 6,
            }}
          >
            U-CRASH
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{subtitle}</div>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            borderRadius: 999,
            border: '1px solid #1f2937',
            padding: 2,
            marginBottom: 18,
            background: '#020617',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              borderRadius: 999,
              border: 'none',
              padding: '0.35rem 0.4rem',
              fontSize: 12,
              cursor: 'pointer',
              background:
                mode === 'signup'
                  ? 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)'
                  : 'transparent',
              color: mode === 'signup' ? 'white' : '#9ca3af',
              fontWeight: mode === 'signup' ? 600 : 500,
            }}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => setMode('signin')}
            style={{
              flex: 1,
              borderRadius: 999,
              border: 'none',
              padding: '0.35rem 0.4rem',
              fontSize: 12,
              cursor: 'pointer',
              background:
                mode === 'signin'
                  ? 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)'
                  : 'transparent',
              color: mode === 'signin' ? 'white' : '#9ca3af',
              fontWeight: mode === 'signin' ? 600 : 500,
            }}
          >
            Sign in
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: 12, marginBottom: 4, opacity: 0.9 }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                borderRadius: 999,
                border: '1px solid #334155',
                padding: '0.5rem 0.75rem',
                background: '#020617',
                color: 'white',
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: 12, marginBottom: 4, opacity: 0.9 }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                borderRadius: 999,
                border: '1px solid #334155',
                padding: '0.5rem 0.75rem',
                background: '#020617',
                color: 'white',
                fontSize: 13,
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#f97373', marginBottom: 8 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              borderRadius: 999,
              border: 'none',
              marginTop: 6,
              padding: '0.6rem 0.75rem',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'linear-gradient(90deg, #4bce2a, #22c55e)',
              color: '#020617',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
