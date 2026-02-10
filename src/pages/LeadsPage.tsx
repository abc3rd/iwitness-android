// Lead Management Page
import { useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import type { LeadStatus } from '../types';

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', contacted: '#8b5cf6', qualified: '#f59e0b',
  proposal: '#ef4444', negotiation: '#ea00ea', won: '#22c55e',
  lost: '#64748b', nurturing: '#06b6d4', disqualified: '#6b7280',
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 50, height: 4, borderRadius: 2, background: '#1e293b' }}>
        <div style={{ width: `${score}%`, height: 4, borderRadius: 2, background: color }} />
      </div>
      <span style={{ fontSize: 10, color }}>{score}</span>
    </div>
  );
}

export default function LeadsPage() {
  const { leads, loading, error, updateStatus } = useLeads();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = leads.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (search && !l.fullName.toLowerCase().includes(search.toLowerCase()) &&
        !l.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusCounts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Leads</h1>
      <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        {leads.length} total leads | {statusCounts['new'] || 0} new | {statusCounts['qualified'] || 0} qualified | {statusCounts['won'] || 0} converted
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ borderRadius: 8, border: '1px solid #334155', padding: '0.4rem 0.6rem', background: 'black', color: 'white', fontSize: 13, width: 200 }} />
        {['all', 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
              border: filter === s ? '1px solid #4bce2a' : '1px solid #334155',
              background: filter === s ? '#4bce2a20' : 'transparent',
              color: filter === s ? '#4bce2a' : '#94a3b8',
            }}>
            {s === 'all' ? `All (${leads.length})` : `${s} (${statusCounts[s] || 0})`}
          </button>
        ))}
      </div>

      {loading && <div style={{ fontSize: 13, opacity: 0.7 }}>Loading leads...</div>}
      {error && <div style={{ fontSize: 13, color: '#f97373', marginBottom: 8 }}>{error} (showing mock data)</div>}

      {/* Leads table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(lead => (
          <div key={lead.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 12,
            borderRadius: 12, border: '1px solid #1e293b', background: '#020617', fontSize: 13,
          }}>
            <div style={{ flex: 2, minWidth: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{lead.fullName}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{lead.email}{lead.phone ? ` | ${lead.phone}` : ''}</div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 2 }}>Source</div>
              <div style={{ fontSize: 12 }}>{lead.source.replace('_', ' ')}</div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 2 }}>Type</div>
              <div style={{ fontSize: 12 }}>{lead.incidentType?.replace('_', ' ') || '-'}</div>
            </div>

            <div style={{ width: 80 }}>
              <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 2 }}>Score</div>
              <ScoreBar score={lead.score} />
            </div>

            <div style={{ width: 80, textAlign: 'right' }}>
              <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 2 }}>Value</div>
              <div style={{ fontSize: 12, color: '#4bce2a', fontWeight: 600 }}>${(lead.estimatedValue || 0).toLocaleString()}</div>
            </div>

            <div>
              <select value={lead.status}
                onChange={e => updateStatus(lead.id, e.target.value as LeadStatus)}
                style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 8,
                  border: `1px solid ${STATUS_COLORS[lead.status] || '#334155'}`,
                  background: 'transparent', color: STATUS_COLORS[lead.status] || '#94a3b8',
                  cursor: 'pointer',
                }}>
                {['new','contacted','qualified','proposal','negotiation','won','lost','nurturing','disqualified'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div style={{ fontSize: 13, opacity: 0.5, textAlign: 'center', padding: 40 }}>
          No leads found matching your filters.
        </div>
      )}
    </div>
  );
}
