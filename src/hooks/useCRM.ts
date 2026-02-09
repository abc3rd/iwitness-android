// CRM Pipeline Hook — LegendaryLeads
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import type { CRMDeal, CRMPipeline, CRMActivity, PipelineStage } from '../types';

export function useCRM() {
  const [pipeline, setPipeline] = useState<CRMPipeline | null>(null);
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await apiClient.getDefaultPipeline();
      setPipeline(p);
      if (p?.id) {
        const d = await apiClient.getCRMDeals(p.id);
        setDeals(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error('Failed to load CRM pipeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to load CRM');
      setPipeline({
        id: 'mock-pipeline', name: 'Default Pipeline', isDefault: true, createdAt: new Date().toISOString(),
        stages: [
          { key: 'prospect', label: 'Prospect', color: '#6b7280', order: 1 },
          { key: 'contacted', label: 'Contacted', color: '#3b82f6', order: 2 },
          { key: 'qualified', label: 'Qualified', color: '#8b5cf6', order: 3 },
          { key: 'proposal_sent', label: 'Proposal Sent', color: '#f59e0b', order: 4 },
          { key: 'negotiation', label: 'Negotiation', color: '#ef4444', order: 5 },
          { key: 'closed_won', label: 'Closed Won', color: '#22c55e', order: 6 },
          { key: 'closed_lost', label: 'Closed Lost', color: '#64748b', order: 7 },
        ],
      });
      setDeals([
        { id: 'mock-deal-1', pipelineId: 'mock-pipeline', stage: 'prospect', title: 'Auto Accident - Cape Coral', value: 5000, probability: 30, contactName: 'John Smith', contactEmail: 'john@example.com', tags: [], aiInsights: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'mock-deal-2', pipelineId: 'mock-pipeline', stage: 'contacted', title: 'Workplace Injury Claim', value: 8000, probability: 50, contactName: 'Jane Doe', tags: [], aiInsights: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'mock-deal-3', pipelineId: 'mock-pipeline', stage: 'qualified', title: 'Slip & Fall - Retail Store', value: 15000, probability: 70, contactName: 'Bob Wilson', tags: ['high-value'], aiInsights: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'mock-deal-4', pipelineId: 'mock-pipeline', stage: 'negotiation', title: 'Medical Malpractice', value: 25000, probability: 60, contactName: 'Alice Brown', tags: [], aiInsights: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPipeline(); }, [loadPipeline]);

  const moveDeal = useCallback(async (dealId: string, stage: PipelineStage) => {
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage } : d));
    try { await apiClient.moveCRMDeal(dealId, stage); } catch { /* local update stands */ }
  }, []);

  const createDeal = useCallback(async (data: Partial<CRMDeal>) => {
    const mockDeal: CRMDeal = {
      id: `deal-${Date.now()}`, pipelineId: pipeline?.id || 'mock', stage: 'prospect',
      title: data.title || 'New Deal', value: data.value || 0, probability: 0,
      contactName: data.contactName, contactEmail: data.contactEmail, tags: [], aiInsights: {},
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    try {
      const deal = await apiClient.createCRMDeal({ ...data, pipelineId: pipeline?.id });
      setDeals((prev) => [...prev, deal]);
      return deal;
    } catch {
      setDeals((prev) => [...prev, mockDeal]);
      return mockDeal;
    }
  }, [pipeline]);

  const getDealsByStage = useCallback((stage: PipelineStage) => deals.filter((d) => d.stage === stage), [deals]);

  return { pipeline, deals, loading, error, moveDeal, createDeal, getDealsByStage, refresh: loadPipeline };
}
