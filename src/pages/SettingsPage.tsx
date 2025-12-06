// src/pages/SettingsPage.tsx
import { useAuth } from '../auth/AuthContext';

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Settings</h1>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Account and preferences for your uCRASH iWitness Accident Sharing Portal Access.
      </p>

      <div
        style={{
          borderRadius: 16,
          border: '1px solid #1e293b',
          padding: 16,
          background: '#020617',
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 10, fontWeight: 600 }}>Profile</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Signed in as:{' '}
          <strong>{user?.email ?? 'Unknown user'}</strong>
        </div>
      </div>

      <button
        onClick={signOut}
        style={{
          borderRadius: 999,
          border: '1px solid #f97373',
          background: 'transparent',
          color: '#f97373',
          padding: '0.45rem 0.9rem',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
