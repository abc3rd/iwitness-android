// Medical Provider Portal Page
import { useState } from 'react';

interface MedicalReferral {
  id: string;
  patientName: string;
  referredBy: string;
  injuryType: string;
  urgency: 'low' | 'medium' | 'high';
  status: string;
  caseId?: string;
  createdAt: string;
}

export default function MedicalPortalPage() {
  const [referrals] = useState<MedicalReferral[]>([
    { id: 'mr-1', patientName: 'John Smith', referredBy: 'Atty. Williams', injuryType: 'Whiplash / Neck Strain', urgency: 'high', status: 'pending', caseId: 'c-1', createdAt: new Date().toISOString() },
    { id: 'mr-2', patientName: 'Jane Doe', referredBy: 'Atty. Garcia', injuryType: 'Back Injury / Herniated Disc', urgency: 'medium', status: 'scheduled', caseId: 'c-2', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'mr-3', patientName: 'Bob Wilson', referredBy: 'Self-Referral', injuryType: 'Shoulder Dislocation', urgency: 'high', status: 'in_treatment', createdAt: new Date(Date.now() - 604800000).toISOString() },
    { id: 'mr-4', patientName: 'Alice Brown', referredBy: 'Atty. Martinez', injuryType: 'Soft Tissue Damage', urgency: 'low', status: 'documentation', caseId: 'c-4', createdAt: new Date(Date.now() - 1209600000).toISOString() },
  ]);

  const urgencyColors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
  const statusColors: Record<string, string> = {
    pending: '#3b82f6', scheduled: '#8b5cf6', in_treatment: '#f59e0b',
    documentation: '#ea00ea', completed: '#22c55e',
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Medical Provider Portal</h1>
      <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        {referrals.length} patient referrals | {referrals.filter(r => r.status === 'pending').length} pending review
      </p>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Pending', value: referrals.filter(r => r.status === 'pending').length, color: '#3b82f6' },
          { label: 'Scheduled', value: referrals.filter(r => r.status === 'scheduled').length, color: '#8b5cf6' },
          { label: 'In Treatment', value: referrals.filter(r => r.status === 'in_treatment').length, color: '#f59e0b' },
          { label: 'Documentation', value: referrals.filter(r => r.status === 'documentation').length, color: '#ea00ea' },
        ].map(card => (
          <div key={card.label} style={{
            flex: 1, borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617',
          }}>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Referrals list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {referrals.map(r => (
          <div key={r.id} style={{
            borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: 999,
              background: urgencyColors[r.urgency],
              flexShrink: 0,
            }} />
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{r.patientName}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                {r.injuryType} | Referred by: {r.referredBy}
              </div>
              <div style={{ fontSize: 10, opacity: 0.4 }}>
                {new Date(r.createdAt).toLocaleDateString()}
                {r.caseId && <span> | Case: {r.caseId}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999,
                border: `1px solid ${urgencyColors[r.urgency]}`,
                color: urgencyColors[r.urgency],
              }}>{r.urgency}</span>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999,
                border: `1px solid ${statusColors[r.status] || '#94a3b8'}`,
                color: statusColors[r.status] || '#94a3b8',
              }}>{r.status.replace('_', ' ')}</span>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{
                fontSize: 10, padding: '4px 10px', borderRadius: 8,
                border: '1px solid #22c55e', background: 'transparent',
                color: '#22c55e', cursor: 'pointer',
              }}>Schedule</button>
              <button style={{
                fontSize: 10, padding: '4px 10px', borderRadius: 8,
                border: '1px solid #2699fe', background: 'transparent',
                color: '#2699fe', cursor: 'pointer',
              }}>View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
