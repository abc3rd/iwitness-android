// Attorney Portal Page
import { useState } from 'react';

interface AttorneyCase {
  id: string;
  title: string;
  clientName: string;
  status: string;
  incidentType: string;
  estimatedValue: number;
  createdAt: string;
}

export default function AttorneyPortalPage() {
  const [cases] = useState<AttorneyCase[]>([
    { id: 'c-1', title: 'Rear-End Collision I-75', clientName: 'John Smith', status: 'active', incidentType: 'auto_accident', estimatedValue: 25000, createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 'c-2', title: 'Workplace Fall - Construction', clientName: 'Jane Doe', status: 'in_litigation', incidentType: 'workplace', estimatedValue: 45000, createdAt: new Date(Date.now() - 604800000).toISOString() },
    { id: 'c-3', title: 'Multi-Vehicle Accident SR-41', clientName: 'Bob Wilson', status: 'settlement', incidentType: 'auto_accident', estimatedValue: 80000, createdAt: new Date(Date.now() - 2592000000).toISOString() },
    { id: 'c-4', title: 'Slip & Fall at Retail Store', clientName: 'Alice Brown', status: 'intake', incidentType: 'slip_fall', estimatedValue: 15000, createdAt: new Date(Date.now() - 86400000).toISOString() },
  ]);

  const [newLeads] = useState([
    { id: 'nl-1', name: 'Michael Torres', type: 'auto_accident', score: 85, source: 'qr_scan', createdAt: new Date().toISOString() },
    { id: 'nl-2', name: 'Sarah Kim', type: 'medical', score: 72, source: 'referral', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ]);

  const statusColors: Record<string, string> = {
    intake: '#3b82f6', active: '#22c55e', in_litigation: '#ef4444',
    settlement: '#f59e0b', pending_docs: '#8b5cf6',
  };

  const openCases = cases.filter(c => !['closed', 'archived'].includes(c.status));
  const totalValue = cases.reduce((s, c) => s + c.estimatedValue, 0);

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Attorney Portal</h1>
      <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        {openCases.length} active cases | ${totalValue.toLocaleString()} total case value | {newLeads.length} new referrals
      </p>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Active Cases', value: openCases.length, color: '#22c55e' },
          { label: 'In Litigation', value: cases.filter(c => c.status === 'in_litigation').length, color: '#ef4444' },
          { label: 'Settlement', value: cases.filter(c => c.status === 'settlement').length, color: '#f59e0b' },
          { label: 'Total Value', value: `$${totalValue.toLocaleString()}`, color: '#4bce2a' },
        ].map(card => (
          <div key={card.label} style={{
            flex: 1, borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617',
          }}>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* New leads alert */}
      {newLeads.length > 0 && (
        <div style={{
          borderRadius: 12, border: '1px solid #ea00ea40', padding: 16, background: '#ea00ea10', marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ea00ea', marginBottom: 8 }}>
            New Lead Referrals ({newLeads.length})
          </div>
          {newLeads.map(lead => (
            <div key={lead.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: '1px solid #1e293b',
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{lead.name}</span>
                <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 8 }}>{lead.type.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: lead.score >= 80 ? '#22c55e' : '#f59e0b' }}>Score: {lead.score}</span>
                <button style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 999,
                  border: '1px solid #22c55e', background: 'transparent',
                  color: '#22c55e', cursor: 'pointer',
                }}>Accept</button>
                <button style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 999,
                  border: '1px solid #64748b', background: 'transparent',
                  color: '#64748b', cursor: 'pointer',
                }}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cases list */}
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Your Cases</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {cases.map(c => (
          <div key={c.id} style={{
            borderRadius: 12, border: '1px solid #1e293b', padding: 14, background: '#020617',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{c.title}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>Client: {c.clientName} | {c.incidentType.replace('_', ' ')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#4bce2a' }}>${c.estimatedValue.toLocaleString()}</div>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999,
                border: `1px solid ${statusColors[c.status] || '#94a3b8'}`,
                color: statusColors[c.status] || '#94a3b8',
              }}>{c.status.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
