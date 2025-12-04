export default function EvidencePage() {
    return (
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Evidence Library</h1>
        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
          Global view of evidence across all iWitness sessions. Later this will connect to storage and
          filtering (by session, type, date).
        </p>
  
        <div
          style={{
            borderRadius: 16,
            border: '1px solid #1e293b',
            padding: 16,
            background: '#020617',
            fontSize: 13,
            opacity: 0.7,
          }}
        >
          Table/grid will go here in the next iteration.
        </div>
      </div>
    );
  }
  