import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import type { Session } from '../lib/apiClient';

export default function SessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await apiClient.getSessionById(id);
        if (isMounted) {
          setSession(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleEvidenceUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      await apiClient.uploadEvidence({
        sessionId: session.id,
        file,
        type: 'license_plate',
      });
      setUploadStatus('Photo sent securely to u-CRASH AI for analysis.');
      // Clear the file input so user can re-take a new picture
      e.target.value = '';
    } catch (err) {
      console.error(err);
      setUploadStatus('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div>Loading accident report…</div>;
  }

  if (!session) {
    return <div>Accident report not found.</div>;
  }

  return (
    <div className="session-layout">
      {/* Chat / communication area */}
      <section
        style={{
          borderRadius: 16,
          border: '1px solid #1e293b',
          padding: 16,
          background: '#020617',
          minHeight: 320,
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{session.title}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {session.external_id
              ? `ID: ${session.external_id} • Status: ${session.status}`
              : `Status: ${session.status}`}
          </div>
        </div>

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
          <div style={{ opacity: 0.7 }}>
            Conversation stream with client, witnesses, or AI will appear here…
          </div>
        </div>

        {/* input + button */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Type a message or note about this accident…"
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
              background: 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Send
          </button>
        </div>
      </section>

      {/* Evidence capture area */}
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
          Capture a clear photo of the license plate and/or the scene. On mobile devices, this will
          open the camera. The image is sent to u-CRASH AI for analysis, categorization, and
          monetization.
        </p>

        <label
          htmlFor="license-plate-upload"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 999,
            border: '1px solid #4bce2a',
            padding: '0.4rem 0.9rem',
            fontSize: 13,
            cursor: 'pointer',
            marginBottom: 10,
          }}
        >
          {isUploading ? 'Uploading…' : 'Take license plate photo'}
        </label>
        <input
          id="license-plate-upload"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleEvidenceUpload}
          style={{ display: 'none' }}
        />

        {uploadStatus && (
          <div style={{ fontSize: 12, marginBottom: 10, opacity: 0.8 }}>
            {uploadStatus}
          </div>
        )}

        <div
          style={{
            borderRadius: 12,
            border: '1px dashed #334155',
            padding: 10,
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          Evidence history will appear here once the backend exposes a list endpoint. For now, use
          this screen to send plate and scene photos into the AI pipeline.
        </div>
      </section>
    </div>
  );
}
