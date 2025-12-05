import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import type { Session } from '../lib/apiClient';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newExternalId, setNewExternalId] = useState('');

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load accident reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      await loadSessions();
      if (!isMounted) return;
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setError(null);
      await apiClient.createSession({
        title: newTitle.trim(),
        external_id: newExternalId.trim() || undefined,
        status: 'Active',
      });
      setNewTitle('');
      setNewExternalId('');
      await loadSessions();
    } catch (err) {
      console.error(err);
      setError('Unable to create accident report.');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Accident Reports</h1>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Each report represents an accident or incident being handled through the u-CRASH iWitness
        system. Use this view to see active, under-review, and closed matters.
      </p>

      {/* New accident report form */}
      <form
        onSubmit={handleCreate}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 12,
          borderRadius: 16,
          border: '1px solid #1e293b',
          background: '#020617',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          Create new accident report
        </div>
        <input
          type="text"
          placeholder="Accident title (e.g., Rear-end collision – Cape Coral Bridge)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{
            borderRadius: 999,
            border: '1px solid #334155',
            padding: '0.4rem 0.75rem',
            background: 'black',
            color: 'white',
            fontSize: 13,
          }}
        />
        <input
          type="text"
          placeholder="Plate or external ID (optional, e.g., FL-123-ABC or Claim-2025-01)"
          value={newExternalId}
          onChange={(e) => setNewExternalId(e.target.value)}
          style={{
            borderRadius: 999,
            border: '1px solid #334155',
            padding: '0.4rem 0.75rem',
            background: 'black',
            color: 'white',
            fontSize: 13,
          }}
        />
        <button
          type="submit"
          style={{
            alignSelf: 'flex-start',
            marginTop: 4,
            borderRadius: 999,
            border: 'none',
            padding: '0.35rem 0.9rem',
            background: 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Add Accident
        </button>
      </form>

      {isLoading && <div style={{ fontSize: 13, opacity: 0.7 }}>Loading reports…</div>}

      {error && (
        <div style={{ fontSize: 13, color: '#f97373', marginBottom: 8 }}>
          {error}
        </div>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          No accident reports yet. Once created, they will appear here.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sessions.map((s) => (
          <Link
            key={s.id}
            to={`/sessions/${s.id}`}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              borderRadius: 16,
              border: '1px solid #1e293b',
              background: '#020617',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.title}
              </div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                {s.external_id ? `ID: ${s.external_id}` : 'No external ID'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                Created: {new Date(s.created_at).toLocaleString()}
              </div>
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
