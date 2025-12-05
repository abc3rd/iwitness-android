// src/components/PatentStamp.tsx

export default function PatentStamp() {
  return (
    <div
      style={{
        borderRadius: 999,
        border: '1px solid #4bce2a',
        padding: '0.2rem 0.7rem',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.08,
        display: 'inline-flex',
        gap: 6,
        alignItems: 'center',
        opacity: 0.9,
      }}
    >
      <span style={{ fontWeight: 600 }}>uCRASH iWitness</span>
      <span style={{ opacity: 0.7 }}>Omega UI • Accident Sharing Portal</span>
      <span style={{ opacity: 0.7 }}>Powered by UCP — Patent Pending</span>
    </div>
  );
}
