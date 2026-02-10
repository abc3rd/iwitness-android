// Admin Dashboard Page
import { useState, useEffect } from 'react';

interface SystemStats {
  users: { total: number; active: number; newToday: number };
  leads: { total: number; converted: number; avgScore: number };
  revenue: { total: number; pending: number; payouts: number };
  affiliates: { total: number; active: number; topEarner: string };
  campaigns: { total: number; active: number; totalScans: number };
  events: { total: number; crashes: number; geofence: number };
  tenants: { total: number; active: number };
}

export default function AdminPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivity] = useState([
    { id: 'a-1', type: 'lead_created', description: 'New lead from QR scan — John Smith', time: '2 min ago' },
    { id: 'a-2', type: 'case_updated', description: 'Case C-1234 moved to settlement', time: '15 min ago' },
    { id: 'a-3', type: 'payout_processed', description: 'Affiliate payout $245.00 to UCRASH-JOHN', time: '1 hour ago' },
    { id: 'a-4', type: 'crash_detected', description: 'Crash event detected near I-75 & Daniels Pkwy', time: '2 hours ago' },
    { id: 'a-5', type: 'user_signup', description: 'New user registered: sarah@example.com', time: '3 hours ago' },
    { id: 'a-6', type: 'campaign_created', description: 'QR Campaign "Mall Kiosk" created by UCRASH-JANE', time: '5 hours ago' },
  ]);

  useEffect(() => {
    setStats({
      users: { total: 1248, active: 834, newToday: 23 },
      leads: { total: 4521, converted: 892, avgScore: 64 },
      revenue: { total: 156800, pending: 12400, payouts: 48200 },
      affiliates: { total: 312, active: 187, topEarner: 'UCRASH-JOHN' },
      campaigns: { total: 89, active: 34, totalScans: 28450 },
      events: { total: 12890, crashes: 342, geofence: 8921 },
      tenants: { total: 5, active: 4 },
    });
  }, []);

  const typeIcons: Record<string, { color: string; label: string }> = {
    lead_created: { color: '#3b82f6', label: 'LEAD' },
    case_updated: { color: '#f59e0b', label: 'CASE' },
    payout_processed: { color: '#22c55e', label: 'PAY' },
    crash_detected: { color: '#ef4444', label: 'CRASH' },
    user_signup: { color: '#8b5cf6', label: 'USER' },
    campaign_created: { color: '#ea00ea', label: 'QR' },
  };

  if (!stats) return <div style={{ fontSize: 13, opacity: 0.7 }}>Loading admin dashboard...</div>;

  const sections = [
    [
      { label: 'Total Users', value: stats.users.total.toLocaleString(), sub: `${stats.users.newToday} new today`, color: '#3b82f6' },
      { label: 'Active Users', value: stats.users.active.toLocaleString(), sub: `${Math.round(stats.users.active / stats.users.total * 100)}% engagement`, color: '#8b5cf6' },
      { label: 'Total Leads', value: stats.leads.total.toLocaleString(), sub: `Avg score: ${stats.leads.avgScore}`, color: '#2699fe' },
      { label: 'Conversions', value: stats.leads.converted.toLocaleString(), sub: `${Math.round(stats.leads.converted / stats.leads.total * 100)}% rate`, color: '#22c55e' },
    ],
    [
      { label: 'Total Revenue', value: `$${stats.revenue.total.toLocaleString()}`, sub: `$${stats.revenue.pending.toLocaleString()} pending`, color: '#4bce2a' },
      { label: 'Payouts', value: `$${stats.revenue.payouts.toLocaleString()}`, sub: `${stats.affiliates.active} active affiliates`, color: '#ea00ea' },
      { label: 'QR Scans', value: stats.campaigns.totalScans.toLocaleString(), sub: `${stats.campaigns.active} active campaigns`, color: '#2699fe' },
      { label: 'Crash Events', value: stats.events.crashes.toLocaleString(), sub: `${stats.events.total.toLocaleString()} total events`, color: '#ef4444' },
    ],
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Admin Dashboard</h1>
      <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        System overview | {stats.tenants.active} active tenants | Platform health: Operational
      </p>

      {sections.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {row.map(card => (
            <div key={card.label} style={{
              flex: 1, borderRadius: 12, border: '1px solid #1e293b', padding: 14, background: '#020617',
            }}>
              <div style={{ fontSize: 10, opacity: 0.5 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: card.color, marginTop: 2 }}>{card.value}</div>
              <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{card.sub}</div>
            </div>
          ))}
        </div>
      ))}

      {/* Recent Activity Feed */}
      <div style={{ borderRadius: 12, border: '1px solid #1e293b', padding: 16, background: '#020617', marginTop: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent System Activity</div>
        {recentActivity.map(a => {
          const icon = typeIcons[a.type] || { color: '#94a3b8', label: '?' };
          return (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '1px solid #0f172a',
            }}>
              <span style={{
                fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: `${icon.color}20`, color: icon.color, whiteSpace: 'nowrap',
              }}>{icon.label}</span>
              <span style={{ fontSize: 12, flex: 1 }}>{a.description}</span>
              <span style={{ fontSize: 10, opacity: 0.4, whiteSpace: 'nowrap' }}>{a.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
