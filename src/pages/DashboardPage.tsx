import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import type { Session } from '../lib/apiClient';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiClient.getSessions();
        if (isMounted) {
          setSessions(data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('Unable to load sessions.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Active Sessions</h1>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Each session represents a Face 2 Face encrypted channel for witnesses, clients, and counsel.
      </p>

      {isLoading && (
        <div style={{ fontSize: 13, opacity: 0.7 }}>Loading sessions…</div>
      )}

      {error && (
        <div style={{ fontSize: 13, color: '#f97373', marginBottom: 8 }}>
          {error}
        </div>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          No sessions yet. Once created, they will appear here.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sessions.map((s) => (
          <Link
            key={s.id}
            to={`/sessions/${s.id}`}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 12,
              background: '#020617',
              border: '1px solid #1e293b',
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{s.title}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{s.id}</div>
            </div>
            <div
              style={{
                fontSize: 11,
                padding: '0.25rem 0.6rem',
                borderRadius: 999,
                border: '1px solid #4bce2a',
                color: '#4bce2a',
              }}
            >
              {s.status}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
