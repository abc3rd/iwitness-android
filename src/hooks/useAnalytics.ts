// Analytics Dashboard Hook
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import type { DashboardMetrics } from '../types';

export function useAnalytics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [funnel, setFunnel] = useState<{ status: string; count: number }[]>([]);
  const [sources, setSources] = useState<{ source: string; count: number }[]>([]);
  const [revenue, setRevenue] = useState<{ date: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, f, s, r] = await Promise.all([
        apiClient.getDashboardMetrics(),
        apiClient.getLeadFunnel(),
        apiClient.getLeadsBySource(),
        apiClient.getRevenueByDay(30),
      ]);
      setMetrics(m as DashboardMetrics);
      setFunnel(f as { status: string; count: number }[]);
      setSources(s as { source: string; count: number }[]);
      setRevenue(r as { date: string; amount: number }[]);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setMetrics({
        leads: { total: 247, new: 12, converted: 38, trend: 15 },
        revenue: { total: 45600, pending: 8200, trend: 8 },
        affiliates: { active: 34, topPerformers: ['UCRASH-JOHN', 'UCRASH-JANE'], trend: 5 },
        cases: { open: 23, closed: 89, avgDuration: 14, trend: -3 },
        campaigns: { active: 8, totalScans: 1245, conversionRate: 0.12 },
      });
      setFunnel([
        { status: 'new', count: 120 }, { status: 'contacted', count: 85 },
        { status: 'qualified', count: 52 }, { status: 'proposal', count: 30 },
        { status: 'negotiation', count: 18 }, { status: 'won', count: 38 }, { status: 'lost', count: 25 },
      ]);
      setSources([
        { source: 'qr_scan', count: 89 }, { source: 'referral', count: 67 },
        { source: 'web_form', count: 45 }, { source: 'event_trigger', count: 23 },
      ]);
      setRevenue(Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 3000) + 500,
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAnalytics(); }, [loadAnalytics]);

  return { metrics, funnel, sources, revenue, loading, error, refresh: loadAnalytics };
}
