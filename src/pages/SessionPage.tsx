import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import type { Session } from '../lib/apiClient';

export default function SessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!id) return;
      setIsLoading(true);

      try {
        const s = await apiClient.getSessionById(id);
        if (isMounted) {
          setSession(s);
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
  }, [id]);

  return (
    <div className="session-layout">
      {/* Chat area */}
      <section
        style={{
          borderRadius: 16,
          border: '1px solid #1e293b',
          padding: 16,
          background: '#020617',
          minHeight: 320,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>
          {session ? session.title : 'Session'}
        </h2>
        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
          {id ? `ID: ${id}` : 'No session selected.'}
        </p>

        {isLoading && (
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            Loading session…
          </div>
        )}

        {/* messages area */}
        <div
          style={{
            flex: 1,
            borderRadius: 12,
            border: '1px solid #1f2933',
            padding: 8,
            marginBottom: 10,
            overflowY: 'auto',
            fontSize: 13,
          }}
        >
          <div style={{ opacity: 0.7 }}>Conversation stream goes here…</div>
        </div>

        {/* input + button as before */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Type a message to the witness or AI…"
            style={{
              flex: 1,
              borderRadius: 999,
              border: '1px solid #334155',
              padding: '0.45rem 0.75rem',
              background: 'black',
              color: 'white',
              fontSize: 13,
            }}
          />
          <button
            style={{
              borderRadius: 999,
              border: 'none',
              padding: '0.45rem 0.9rem',
              background: 'linear-gradient(90deg,#ea00ea,#2699fe)',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Send
          </button>
        </div>
      </section>

      {/* Evidence panel unchanged */}
      <section
        style={{
          borderRadius: 16,
          border: '1px solid #1e293b',
          padding: 16,
          background: '#020617',
        }}
      >
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>Evidence</h3>
        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
          Upload photos, video, audio, or documents attached to this session.
        </p>
        <input type="file" multiple style={{ marginBottom: 12, fontSize: 12 }} />
        <div
          style={{
            borderRadius: 12,
            border: '1px dashed #334155',
            padding: 10,
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          Evidence list will appear here.
        </div>
      </section>
    </div>
  );
}
