// Analytics Dashboard Page
import { useAnalytics } from '../hooks/useAnalytics';

function MetricCard({ label, value, subtext, trend, color }: {
  label: string; value: string; subtext?: string; trend?: number; color?: string;
}) {
  return (
    <div style={{
      borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || '#fff' }}>{value}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {subtext && <span style={{ fontSize: 10, opacity: 0.5 }}>{subtext}</span>}
        {trend !== undefined && (
          <span style={{ fontSize: 10, color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}

function FunnelBar({ label, count, maxCount, color }: { label: string; count: number; maxCount: number; color: string }) {
  const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ width: 80, fontSize: 11, opacity: 0.7, textAlign: 'right' }}>{label}</div>
      <div style={{ flex: 1, height: 20, borderRadius: 4, background: '#1e293b', position: 'relative' }}>
        <div style={{ width: `${width}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.5s' }} />
        <span style={{ position: 'absolute', right: 6, top: 2, fontSize: 10, color: '#fff' }}>{count}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { metrics, funnel, sources, revenue, loading } = useAnalytics();

  if (loading) return <div style={{ fontSize: 13, opacity: 0.7, padding: 20 }}>Loading analytics...</div>;

  const m = metrics;
  const maxFunnel = Math.max(...funnel.map(f => f.count), 1);
  const maxRevenue = Math.max(...revenue.map(r => r.amount), 1);

  const funnelColors: Record<string, string> = {
    new: '#3b82f6', contacted: '#8b5cf6', qualified: '#f59e0b',
    proposal: '#ef4444', negotiation: '#ea00ea', won: '#22c55e', lost: '#64748b',
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Analytics Dashboard</h1>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <MetricCard label="Total Leads" value={String(m?.leads.total || 0)} subtext={`${m?.leads.new || 0} new today`} trend={m?.leads.trend} color="#3b82f6" />
        <MetricCard label="Conversions" value={String(m?.leads.converted || 0)} subtext={`${m ? Math.round((m.leads.converted / Math.max(m.leads.total, 1)) * 100) : 0}% rate`} color="#22c55e" />
        <MetricCard label="Revenue" value={`$${(m?.revenue.total || 0).toLocaleString()}`} subtext={`$${(m?.revenue.pending || 0).toLocaleString()} pending`} trend={m?.revenue.trend} color="#4bce2a" />
        <MetricCard label="Active Cases" value={String(m?.cases.open || 0)} subtext={`${m?.cases.closed || 0} closed`} trend={m?.cases.trend} />
        <MetricCard label="Affiliates" value={String(m?.affiliates.active || 0)} trend={m?.affiliates.trend} color="#ea00ea" />
        <MetricCard label="QR Scans" value={String(m?.campaigns.totalScans || 0)} subtext={`${m?.campaigns.active || 0} active campaigns`} color="#2699fe" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Lead Funnel */}
        <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Lead Conversion Funnel</div>
          {funnel.map(f => (
            <FunnelBar key={f.status} label={f.status} count={f.count} maxCount={maxFunnel}
              color={funnelColors[f.status] || '#6b7280'} />
          ))}
        </div>

        {/* Lead Sources */}
        <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Lead Sources</div>
          {sources.map(s => (
            <div key={s.source} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ fontSize: 12 }}>{s.source.replace('_', ' ')}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4bce2a' }}>{s.count}</span>
            </div>
          ))}
        </div>

        {/* Revenue Chart (simplified bar chart) */}
        <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617', gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Revenue (Last 30 Days)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
            {revenue.map((r, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '100%', borderRadius: '2px 2px 0 0',
                  background: 'linear-gradient(180deg, #4bce2a, #2699fe)',
                  height: `${(r.amount / maxRevenue) * 100}px`,
                  minHeight: 2,
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 9, opacity: 0.4 }}>{revenue[0]?.date}</span>
            <span style={{ fontSize: 9, opacity: 0.4 }}>{revenue[revenue.length - 1]?.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
