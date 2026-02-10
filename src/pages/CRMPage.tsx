// CRM Pipeline Dashboard — LegendaryLeads Fusion
import { useState } from 'react';
import { useCRM } from '../hooks/useCRM';
import type { PipelineStage } from '../types';

const cardStyle: React.CSSProperties = {
  borderRadius: 12, border: '1px solid #1e293b', padding: 12, background: '#0f172a',
  marginBottom: 8, cursor: 'grab', fontSize: 13,
};

const stageColumnStyle: React.CSSProperties = {
  flex: 1, minWidth: 180, borderRadius: 12, border: '1px solid #1e293b',
  padding: 10, background: '#020617', display: 'flex', flexDirection: 'column', gap: 6,
};

export default function CRMPage() {
  const { pipeline, deals, loading, moveDeal, createDeal, getDealsByStage } = useCRM();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newContact, setNewContact] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createDeal({ title: newTitle, value: parseFloat(newValue) || 0, contactName: newContact });
    setNewTitle(''); setNewValue(''); setNewContact(''); setShowCreate(false);
  };

  const stages = pipeline?.stages || [];
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const wonValue = deals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>LegendaryLeads CRM</h1>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
            Pipeline: {pipeline?.name || 'Loading...'} | {deals.length} deals | ${totalValue.toLocaleString()} total | ${wonValue.toLocaleString()} won
          </p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          borderRadius: 999, border: 'none', padding: '0.4rem 1rem',
          background: 'linear-gradient(90deg, #ea00ea, #2699fe, #4bce2a)',
          color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          + New Deal
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{
          display: 'flex', gap: 8, marginBottom: 16, padding: 12,
          borderRadius: 12, border: '1px solid #1e293b', background: '#0f172a',
        }}>
          <input placeholder="Deal title" value={newTitle} onChange={e => setNewTitle(e.target.value)}
            style={{ flex: 2, borderRadius: 8, border: '1px solid #334155', padding: '0.4rem 0.6rem', background: 'black', color: 'white', fontSize: 13 }} />
          <input placeholder="Value ($)" value={newValue} onChange={e => setNewValue(e.target.value)} type="number"
            style={{ flex: 1, borderRadius: 8, border: '1px solid #334155', padding: '0.4rem 0.6rem', background: 'black', color: 'white', fontSize: 13 }} />
          <input placeholder="Contact name" value={newContact} onChange={e => setNewContact(e.target.value)}
            style={{ flex: 1, borderRadius: 8, border: '1px solid #334155', padding: '0.4rem 0.6rem', background: 'black', color: 'white', fontSize: 13 }} />
          <button type="submit" style={{
            borderRadius: 8, border: 'none', padding: '0.4rem 0.8rem',
            background: '#22c55e', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Create</button>
        </form>
      )}

      {loading && <div style={{ fontSize: 13, opacity: 0.7 }}>Loading pipeline...</div>}

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16 }}>
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.key as PipelineStage);
          const stageValue = stageDeals.reduce((s, d) => s + (d.value || 0), 0);

          return (
            <div key={stage.key} style={stageColumnStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: stage.color }}>{stage.label}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>{stageDeals.length} | ${stageValue.toLocaleString()}</div>
              </div>

              {stageDeals.map((deal) => (
                <div key={deal.id} style={cardStyle}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{deal.title}</div>
                  {deal.contactName && <div style={{ fontSize: 11, opacity: 0.7 }}>{deal.contactName}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: '#4bce2a', fontWeight: 600 }}>
                      ${(deal.value || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.5 }}>{deal.probability}%</span>
                  </div>
                  {deal.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      {deal.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 9, padding: '1px 6px', borderRadius: 999,
                          background: '#1e293b', color: '#94a3b8',
                        }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  {/* Stage move buttons */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {stages.filter(s => s.key !== stage.key).slice(0, 3).map(s => (
                      <button key={s.key} onClick={() => moveDeal(deal.id, s.key as PipelineStage)}
                        style={{
                          fontSize: 9, padding: '2px 6px', borderRadius: 6,
                          border: `1px solid ${s.color}40`, background: 'transparent',
                          color: s.color, cursor: 'pointer',
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {stageDeals.length === 0 && (
                <div style={{ fontSize: 11, opacity: 0.4, textAlign: 'center', padding: 20 }}>
                  No deals
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
